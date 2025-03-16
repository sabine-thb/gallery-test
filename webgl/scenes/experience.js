import * as THREE from 'three';
import MainCamera from '../modules/camera/mainCamera';
import Controls from '../modules/controls';
import Renderer from '../modules/render';
import Room1 from '../components/room1';
import Room2 from '../components/room2';
import Corridor from '../components/corridor';
import { Sky } from 'three/addons/objects/Sky.js';

export default class Experience {
    constructor(canvas) {
        if (!canvas) return;
        
        this.canvas = canvas;
        this.walls = [];
        this.playerRadius = 0.5;
        this.boundaryBox = new THREE.Box3(
            new THREE.Vector3(-50, -50, -50),
            new THREE.Vector3(50, 50, 50)
        );
        
        this.scene = new THREE.Scene();
        // this.paintScene = new THREE.Scene();

        this.camera = new MainCamera();
        // this.paintCamera = new MainCamera();
        
        this.renderer = new Renderer(canvas);
        // this.renderer.instance.setScissorTest(true);

        //Initialisation de l'audio
        this.listener = new THREE.AudioListener();
        this.camera.instance.add(this.listener);

        // Création de la sphère audio
        const sphereGeometry = new THREE.SphereGeometry(0.25, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.0, });
        this.audioSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.audioSphere.position.set(30, 1, 0);
        this.scene.add(this.audioSphere);
        
        // Configuration du son positionnel
        this.sound = new THREE.PositionalAudio(this.listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('/audio/song.wav', (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setRefDistance(0.25);
            this.sound.setLoop(true);
            this.sound.setVolume(1);
            this.sound.play();
        });
        this.audioSphere.add(this.sound);
        
        this.renderer.instance.shadowMap.enabled = true;
        this.renderer.instance.shadowMap.type = THREE.PCFSoftShadowMap;
        this.controls = new Controls(this.camera.instance, document.body, this);
        
        // Position initiale du joueur dans la première pièce
        this.camera.instance.position.set(29.79, 1.7, 0.65);
        
        this.initSky();
        this.createEnvironment();
        this.setupEventListeners();
        this.animate();
        
        // Initialisation du temps pour l'animation du soleil
        this.startTime = Date.now();
        this.cycleDuration = 20 * 60 * 1000; // 20 minutes en millisecondes

        // this.createPaintScene();

    }


    resize() {
        if (this.camera && this.renderer) {
            this.camera.resize();
            this.renderer.resize();
        }
    }

    initSky() {
        // Ajout du ciel
        this.sky = new Sky();
        this.sky.scale.setScalar(450000);
        this.scene.add(this.sky);

        this.sun = new THREE.Vector3();

        // Création de la lumière directionnelle du soleil
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 1;
        this.sunLight.shadow.camera.far = 100;
        this.sunLight.shadow.camera.left = -50;
        this.sunLight.shadow.camera.right = 50;
        this.sunLight.shadow.camera.top = 50;
        this.sunLight.shadow.camera.bottom = -50;
        this.scene.add(this.sunLight);

        // Paramètres du ciel
        this.skyParams = {
            turbidity: 10,
            rayleigh: 3,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            elevation: 45,
            azimuth: 180,
            exposure: 0.5,
            sunIntensity: 1,
        };

        this.updateSky();
    }

    updateSky() {
        const uniforms = this.sky.material.uniforms;
        uniforms['turbidity'].value = this.skyParams.turbidity;
        uniforms['rayleigh'].value = this.skyParams.rayleigh;
        uniforms['mieCoefficient'].value = this.skyParams.mieCoefficient;
        uniforms['mieDirectionalG'].value = this.skyParams.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad(90 - this.skyParams.elevation);
        const theta = THREE.MathUtils.degToRad(this.skyParams.azimuth);

        this.sun.setFromSphericalCoords(1, phi, theta);
        uniforms['sunPosition'].value.copy(this.sun);
        
        // Mise à jour de la position et intensité de la lumière directionnelle
        this.sunLight.position.copy(this.sun).multiplyScalar(50);
        this.sunLight.intensity = this.skyParams.sunIntensity;
        
        this.renderer.instance.toneMappingExposure = this.skyParams.exposure;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resize(); // Correctly use the resize method
        });
    }

    createEnvironment() {
        this.materials = {
            items: {
                wall: new THREE.MeshStandardMaterial({
                    color: 0x445566,
                    roughness: 0.5,
                }),
                floor: new THREE.MeshStandardMaterial({
                    color: 0x222222,
                    roughness: 0.7,
                    receiveShadow: true,
                }),
                ceiling: new THREE.MeshStandardMaterial({
                    color: 0x333333,
                    roughness: 0.8,
                }),
            },
        };

        this.room1 = new Room1(this.scene, this.materials, this);
        this.room2 = new Room2(this.scene, this.materials, this);
        this.corridor = new Corridor(this.scene, this.materials, this);
        this.room1.scene.position.set(30, 0, -32.5);
        this.room1.scene.rotation.y = Math.PI;
        this.room2.scene.position.set(0, 0, 0);
        this.corridor.scene.position.set(30, 0, -17.5);

        const cube = new THREE.BoxGeometry(1, 1, 1);

        // Gestion des collisions
        this.setupCollisions();

        // Éclairage ambiant réduit pour accentuer les ombres
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambient);

        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(0, 10, 0);
        this.scene.add(mainLight);

        // Helper pour Room2 uniquement
        const room2Helper = new THREE.BoxHelper(this.room2.scene, 0x0000ff);
        this.scene.add(room2Helper);

        // Debug des collisions
        this.walls.forEach((wall) => {
            const boxHelper = new THREE.BoxHelper(wall, 0xff0000);
            this.scene.add(boxHelper);
        });
    }

    setupCollisions() {
        // Fonction pour vérifier les collisions
        const checkCollisions = (position) => {
            const playerBoundingSphere = new THREE.Sphere(position, this.playerRadius);
            
            for (const wall of this.walls) {
                // Créer une boîte de collision pour le mur
                const wallBox = new THREE.Box3().setFromObject(wall);
                
                // Vérifier la collision
                if (wallBox.intersectsSphere(playerBoundingSphere)) {
                    return true;
                }
            }
            return false;
        };

        // Mettre à jour la méthode update des controls
        const originalUpdate = this.controls.update.bind(this.controls);
        this.controls.update = () => {
            const camera = this.controls.instance.object;
            const oldPosition = camera.position.clone();
            
            originalUpdate();
            
            // Si collision, revenir à l'ancienne position
            if (checkCollisions(camera.position)) {
                camera.position.copy(oldPosition);
            }
        };
    }

    cleanup() {
        window.removeEventListener('resize', () => {
            this.resize();
        });
        
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach((material) => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        this.renderer.instance.dispose();
    }


    // createPaintScene() {
    //     const geometry = new THREE.BoxGeometry(1, 1, 1);
    //     const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    //     const cube = new THREE.Mesh(geometry, material);
    
    //     cube.position.set(0, 0, 0);
    //     cube.position.setZ(2);
    //     this.paintScene.add(cube);

    
    //     // Positionner la caméra de peinture
    //     this.paintCamera.instance.position.set(0, 0, 0);  // Ajuste la position pour mieux voir le cube
    //     this.paintCamera.instance.lookAt(cube.position);
    // }
    

    animate = () => {
        requestAnimationFrame(this.animate);

        // Animation du soleil
        const elapsed = Date.now() - this.startTime;
        const progress = (elapsed % this.cycleDuration) / this.cycleDuration;
        
        // Fait tourner l'azimuth de 0 à 360 degrés
        this.skyParams.azimuth = progress * 360;
        this.updateSky();

        if (this.controls) {
            this.controls.update();
        }

        const canvasRect = this.canvas.getBoundingClientRect();
        // const paintRect = document.querySelector('.paint-content-visual').getBoundingClientRect();

        this.renderer.instance.setScissor(0, 0, canvasRect.width, canvasRect.height);
        this.renderer.instance.setViewport(0, 0, canvasRect.width, canvasRect.height);
        this.renderer.render(this.scene, this.camera.instance);
        
        // Rendu de la paintScene dans une section spécifique du canvas

        // const x = paintRect.left - canvasRect.left;
        // const y = canvasRect.height - (paintRect.bottom - canvasRect.top);
        
        // this.renderer.instance.setScissor(x, y, paintRect.width, paintRect.height);
        // this.renderer.instance.setViewport(x, y, paintRect.width, paintRect.height);
        // this.renderer.render(this.paintScene, this.paintCamera.instance);
    };

    toggleSound(isMuted) {
        //console.log('toggleSound appelé avec isMuted:', isMuted);
        if (this.sound && this.sound.isPlaying) {
            //console.log('État actuel du son - volume:', this.sound.getVolume());
            if (isMuted) {
                this.sound.setVolume(0);
            } else {
                this.sound.setVolume(1);
            }
            //console.log('Nouveau volume:', this.sound.getVolume());
        } else {
            console.log('Son non initialisé ou non en lecture');
        }
    }

    addSecondaryCanvas(canvas, container) {
        this.secondaryCanvas = canvas;
        this.secondaryContainer = container;
        
        // Créer un second renderer
        this.secondaryRenderer = new THREE.WebGLRenderer({
            canvas: this.secondaryCanvas,
            antialias: true,
            alpha: true
        });
        
        // Configurer le renderer
        this.secondaryRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.updateSecondarySize();

        // Créer un cube de test
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.testCube = new THREE.Mesh(geometry, material);
        this.testCube.position.set(0, 0, -3);
        this.scene.add(this.testCube);
    }

    updateSecondarySize() {
        if (this.secondaryContainer && this.secondaryRenderer) {
            const bounds = this.secondaryContainer.getBoundingClientRect();
            this.secondaryRenderer.setSize(bounds.width, bounds.height);
            
            // Mettre à jour la caméra pour ce viewport
            this.camera.aspect = bounds.width / bounds.height;
            this.camera.updateProjectionMatrix();
        }
    }

    removeSecondaryCanvas() {
        if (this.secondaryRenderer) {
            this.secondaryRenderer.dispose();
            this.secondaryRenderer = null;
        }
        if (this.testCube) {
            this.scene.remove(this.testCube);
            this.testCube.geometry.dispose();
            this.testCube.material.dispose();
        }
        this.secondaryCanvas = null;
        this.secondaryContainer = null;
    }

    update() {
        // Mettre à jour la scène principale
        this.renderer.render(this.scene, this.camera);
        
        // Mettre à jour le canvas secondaire s'il existe
        if (this.secondaryRenderer) {
            this.secondaryRenderer.render(this.scene, this.camera);
            
            // Optionnel : faire tourner le cube
            if (this.testCube) {
                this.testCube.rotation.y += 0.01;
            }
        }
    }
}
