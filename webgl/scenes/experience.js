import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import MainCamera from '../modules/camera/mainCamera';
import Controls from '../modules/controls';
import Renderer from '../modules/render';
import { setSelectedObject } from '../../utils/selectionBridge';
// import Room1 from '../components/room1';
// import Room2 from '../components/room2';
//import Corridor from '../components/corridor';

THREE.Mesh.prototype.raycast = acceleratedRaycast;

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
        
        // Création du cube de collision du joueur
        const playerGeometry = new THREE.BoxGeometry(1, 1.7, 1);
        const playerMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.0
        });
        this.playerCollider = new THREE.Mesh(playerGeometry, playerMaterial);
        this.scene.add(this.playerCollider);
        
        this.renderer = new Renderer(canvas);
        // this.renderer.instance.setScissorTest(true);

        // Raycaster pour l'interaction avec les tableaux
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredTableau = null;
        this.tableaux = [];
        
        //Initialisation de l'audio - mais pas de chargement immédiat
        this.listener = new THREE.AudioListener();
        this.camera.instance.add(this.listener);

        // Création de la sphère audio
        const sphereGeometry = new THREE.SphereGeometry(0.25, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.0, });
        this.audioSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.audioSphere.position.set(30, 1, 0);
        this.scene.add(this.audioSphere);
        
        // Configuration du son positionnel, mais pas de chargement
        this.sound = new THREE.PositionalAudio(this.listener);
        this.audioLoaded = false;
        
        this.renderer.instance.shadowMap.enabled = false;
        this.renderer.instance.physicallyCorrectLights = false;
        
        // Créer les contrôles et sauvegarder la méthode update originale
        this.controls = new Controls(this.camera.instance, document.body, this);
        this.originalControlsUpdate = this.controls.update.bind(this.controls);
        
        // Position initiale du joueur dans la première pièce
        this.camera.instance.position.set(29.79, 1.7, 0.65);
        
        this.createEnvironment();
        
        // Drapeaux pour suivre le chargement des modèles
        this.modelsLoaded = false;
        
        // Démarrer l'animation sans l'audio
        this.animate();

        // this.createPaintScene();
    }

    // Nouvelle méthode pour charger l'audio séparément
    loadAudio() {
        if (this.audioLoaded) return; // Éviter le double chargement
        
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('/audio/song.wav', (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setRefDistance(0.25);
            this.sound.setLoop(true);
            this.sound.setVolume(1);
            this.sound.play();
            this.audioLoaded = true;
        });
        this.audioSphere.add(this.sound);
    }

    resize() {
        if (this.camera && this.renderer) {
            this.camera.resize();
            this.renderer.resize();
        }
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
                invisible: new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    transparent: true,
                    opacity: 0.2,
                })
            },
        };

        // Chargement du modèle GLB du musée
        Promise.all([
            this.loadMuseumModel(),
            this.loadTableauxModel()
        ]).then(() => {
            this.setupCollisionDetection();
            this.modelsLoaded = true;
        });

        // this.room1 = new Room1(this.scene, this.materials, this);
        // this.room2 = new Room2(this.scene, this.materials, this);
        //this.corridor = new Corridor(this.scene, this.materials, this);
        // this.room1.scene.position.set(30, 0, -32.5);
        // this.room1.scene.rotation.y = Math.PI;
        // this.room2.scene.position.set(0, 0, 0);
        //this.corridor.scene.position.set(30, 0, -17.5);

        //const cube = new THREE.BoxGeometry(1, 1, 1);

        // Gestion des collisions

        // Éclairage ambiant amélioré
        const ambient = new THREE.AmbientLight(0xffffff, 0.35); // Légèrement réduit
        this.scene.add(ambient);
    }

    load(callback) {
        Promise.all([
            this.loadMuseumModel(),
            this.loadTableauxModel()
        ]).then(() => {
            this.setupCollisionDetection();
            this.modelsLoaded = true;
            if (callback) callback();
        }).catch(error => {
            console.error('Erreur de chargement:', error);
        });
    }

    
    loadMuseumModel() {
        if (this.modelsLoaded) return; // Éviter le double chargement

        return new Promise((resolve, reject) => {
            if (this.modelsLoaded) {
                resolve();
                return;
            }

        const loader = new GLTFLoader();
        
        // Chargement du modèle du musée
        loader.load('/MUSEE/BLENDER/RENDUS/V1/SALLES/MUSEE_DJERBAMOOD.glb', (gltf) => {
            this.museumModel = gltf.scene;
            
            // Positionner le modèle
            this.museumModel.position.set(145, -17, 0.65);
            
            this.scene.add(this.museumModel);

            // Initialisation du BVH pour chaque mesh
            this.museumModel.traverse((child) => {
                if (child.isMesh) {
                    // Appliquer le BVH au mesh
                    child.geometry.boundsTree = new MeshBVH(child.geometry, { lazyGeneration: false });
                    
                    // Configuration du matériau
                    child.material.side = THREE.DoubleSide;
                    child.material.shadowSide = THREE.DoubleSide;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Détection des sols (objets plats et bas)
                    const box = new THREE.Box3().setFromObject(child);
                    const size = box.getSize(new THREE.Vector3());
                    const isFlat = size.y < size.x * 0.3 && size.y < size.z * 0.3;
                    const isBottom = box.min.y < -16.5;
                    
                    // Marquer les sols pour la détection de collision
                    if (isFlat && isBottom) {
                        child.userData.isFloor = true;
                        // Optionnel: Créer un helper pour visualiser les sols
                        const helper = new THREE.Box3Helper(box, 0x0000ff);
                        this.scene.add(helper);
                    } else {
                        child.userData.isFloor = false;
                        // Optionnel: Créer un helper pour visualiser les murs
                        const helper = new THREE.Box3Helper(box, 0xff0000);
                        this.scene.add(helper);
                    }
                }
            });

            resolve();
        },
        undefined, // Pas de suivi de progression
            (error) => {
                console.error('Erreur de chargement du musée:', error);
                reject(error);
            })

            // Chargement et positionnement des tableaux après avoir chargé le musée
            this.loadTableauxModel();
            
            this.setupCollisionDetection();
            this.modelsLoaded = true;
     });
    }
    
    loadTableauxModel() {

        return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        
        // Chargement du modèle des tableaux
        loader.load('/MUSEE/BLENDER/RENDUS/V1/TABLEAUX/TableauxMartinOptimizer.glb', (gltf) => {
            this.tableauxModel = gltf.scene;
            
            // Positionner les tableaux près du joueur
            this.tableauxModel.position.set(145, -17, 0.65);
            
            // Ajouter les tableaux à la scène
            this.scene.add(this.tableauxModel);
            
            //console.log("Tableaux chargés et positionnés à", this.tableauxModel.position);
            
            // Configuration des matériaux pour les tableaux
            this.tableauxModel.traverse((child) => {
                if (child.isMesh && child.name.startsWith("FaceTableauMartin")) {
                    // Store original name for texture matching
                    child.userData.originalName = child.name;
                    // Stocker le matériau original pour pouvoir revenir à son état initial
                    child.originalMaterial = child.material.clone();
                    
                    child.material.side = THREE.DoubleSide;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Marquer comme tableau pour l'interaction
                    child.userData.isTableau = true;
                    
                    // Ajouter à la liste des tableaux pour l'interaction
                    this.tableaux.push(child);
                }
            });
            
            // Ajouter les écouteurs d'événements pour l'interaction
            this.setupTableauxInteraction();
            resolve();
                },
                undefined,
                (error) => {
                    console.error('Erreur de chargement des tableaux:', error);
                    reject(error);
                }
            );
        });
    }
    
    setupTableauxInteraction() {
        // Gestion du survol
        this.canvas.addEventListener('mousemove', (event) => {
            // Normaliser la position de la souris
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
        
        // Gestion du clic
        this.canvas.addEventListener('click', () => {
            if (this.hoveredTableau) {
                setSelectedObject(this.hoveredTableau.userData.originalName);
                console.log("Tableau sélectionné:", this.hoveredTableau.userData.originalName);
            }
        });
    }
    
    checkTableauxInteraction() {
        // Vérifier la distance entre le joueur et les tableaux
        const MAX_INTERACTION_DISTANCE = 15;
        
        // Si on avait un tableau en survol avant, restaurer son matériau
        if (this.hoveredTableau) {
            this.hoveredTableau.material = this.hoveredTableau.originalMaterial.clone();
            this.hoveredTableau = null;
        }
        
        // Vérifier si des tableaux sont présents
        if (!this.tableaux || this.tableaux.length === 0) return;
        
        // Calculer la position du joueur
        const playerPosition = this.camera.instance.position;
        
        // Vérifier si le joueur est suffisamment proche d'un tableau
        let nearTableaux = this.tableaux.filter(tableau => {
            const tableauWorldPos = new THREE.Vector3();
            tableau.getWorldPosition(tableauWorldPos);
            const distance = playerPosition.distanceTo(tableauWorldPos);
            return distance <= MAX_INTERACTION_DISTANCE;
        });
        
        if (nearTableaux.length > 0) {
            // Lancer un rayon depuis la caméra dans la direction du regard
            this.raycaster.setFromCamera(this.mouse, this.camera.instance);
            
            // Vérifier l'intersection avec les tableaux proches
            const intersects = this.raycaster.intersectObjects(nearTableaux);
            
            if (intersects.length > 0) {
                // Le premier objet intersecté est celui au premier plan
                this.hoveredTableau = intersects[0].object;
                
                // Créer un matériau pour la surbrillance (émissif)
                const highlightMaterial = this.hoveredTableau.material.clone();
                highlightMaterial.emissive = new THREE.Color(0x555555); // Couleur de la surbrillance
                highlightMaterial.emissiveIntensity = 0.5;
                
                // Appliquer le matériau avec surbrillance
                this.hoveredTableau.material = highlightMaterial;
            }
        }
    }

    setupCollisionDetection() {
        this.controls.update = () => {
            const camera = this.controls.instance.object;
            const oldPosition = camera.position.clone();

            // Appel de la méthode originale de mise à jour
            this.originalControlsUpdate();
            
            // Mettre à jour la position du collider
            this.playerCollider.position.copy(camera.position);

            if (this.checkCollisions(camera.position)) {
                camera.position.copy(oldPosition);
            }
        };
    }

    checkCollisions(position) {
        if (!this.museumModel) return false;
        
        const raycaster = new THREE.Raycaster();
        raycaster.far = 1.5; // Augmenter la distance max pour détecter une collision

        const directions = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(1, 0, 1).normalize(),
            new THREE.Vector3(-1, 0, 1).normalize(),
            new THREE.Vector3(1, 0, -1).normalize(),
            new THREE.Vector3(-1, 0, -1).normalize(),
        ];

        for (const dir of directions) {
            raycaster.set(position, dir);
            const intersects = [];

            // Vérifier les collisions avec le musée
            this.museumModel.traverse((child) => {
                if (child.isMesh) {
                    const hits = raycaster.intersectObject(child, true);
                    intersects.push(...hits);
                }
            });
            
            // Vérifier les collisions avec les tableaux
            if (this.tableauxModel) {
                this.tableauxModel.traverse((child) => {
                    if (child.isMesh) {
                        const hits = raycaster.intersectObject(child, true);
                        intersects.push(...hits);
                    }
                });
            }
            
            // Vérifier si d'autres objets individuels doivent être testés
            if (this.scene) {
                this.scene.traverse((child) => {
                    // Éviter de tester le joueur lui-même ou les objets déjà testés
                    if (child.isMesh && 
                        child !== this.playerCollider && 
                        !child.parent.uuid === this.museumModel?.uuid &&
                        !child.parent.uuid === this.tableauxModel?.uuid) {
                        const hits = raycaster.intersectObject(child, true);
                        intersects.push(...hits);
                    }
                });
            }

            if (intersects.length > 0) return true;
        }

        return false;
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


        // Mettre à jour la position du collider du joueur
        if (this.playerCollider) {
            this.playerCollider.position.copy(this.camera.instance.position);
        }

        // Vérifier l'interaction avec les tableaux
        this.checkTableauxInteraction();

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
        if (this.sound) {
            if (!this.audioLoaded && !isMuted) {
                // Si l'audio n'est pas encore chargé et qu'on veut l'activer
                this.loadAudio();
            } else if (this.sound.isPlaying) {
                //console.log('État actuel du son - volume:', this.sound.getVolume());
                if (isMuted) {
                    this.sound.setVolume(0);
                } else {
                    this.sound.setVolume(1);
                }
                //console.log('Nouveau volume:', this.sound.getVolume());
            }
        } else {
            console.log('Son non initialisé');
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
