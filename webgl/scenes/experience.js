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
        this.camera = new MainCamera();
        this.renderer = new Renderer(canvas);
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

        this.renderer.render(this.scene, this.camera.instance);
    };
}
