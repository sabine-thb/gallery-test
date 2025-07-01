import * as THREE from 'three';
import MainCamera from '../modules/camera/mainCamera';
import Controls from '../modules/controls';
import Renderer from '../modules/render';
import SimpleCollisionSystem from '../modules/collision/SimpleCollisionSystem';
import { setSelectedObject } from '../../utils/selectionBridge';
import RoomMartin from '../components/SalleMartin/RoomMartin';
import RoomBrigitte from '../components/SalleBrigitte/RoomBrigitte';
import RoomJCD from '../components/SalleJCD/RoomJCD';
import CouloirMusee from '../components/corridor/CouloirMusee';
import { oeuvres } from '../../data/oeuvres.js';

export default class Experience {
    constructor(canvas) {
        if (!canvas) {
            console.error("Experience: Le canvas fourni est null ou undefined.");
            return;
        }
        if (!(canvas instanceof HTMLCanvasElement)) {
            console.error("Experience: L'objet fourni n'est pas un élément HTMLCanvasElement.", canvas);
            return;
        }

        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new MainCamera();
        this.renderer = new Renderer(canvas);
        this.controls = new Controls(this.camera.instance, document.body, this);
        this.collisionSystem = new SimpleCollisionSystem(this.camera.instance);
        this.clock = new THREE.Clock();

        this.assetsLoaded = 0;
        this.totalAssets = 16;

        this.RoomMartin = null;
        this.RoomBrigitte = null;
        this.RoomJCD = null;
        this.tableaux = [];
        this.debugMode = true;
        this.debugCollisions = false; // Désactivé - pas d'helpers visibles

        this.raycaster = new THREE.Raycaster();
        this.raycaster.firstHitOnly = true;

        this.audioSources = [];

        this.modelsLoaded = false;
        this.audioLoaded = [false, false, false];
        this.projectionVideo = null; // Vidéo de projection
        this.mouse = new THREE.Vector2();
        this.hoveredTableau = null;
        this.tableauSelected = false;
        this.oeuvresData = oeuvres;
        this.tooltip = null;
        this.latestMouseEvent = null;

        this.isMutedFromButton = false;
        this.isVideoPlaying = true;

        this.createTooltip();
        this.initAudio();

        this.initEnvironment().then(() => {
            this.animate();
            this.handleVideoStateChange(this.isVideoPlaying);
        });

        this.camera.instance.position.set(36.92, 1.7, -4.72);
        this.camera.instance.rotation.y = -Math.PI / 2; // Rotation de 90° vers la droite
    }


    initAudio() {
        this.listener = new THREE.AudioListener();
        this.camera.instance.add(this.listener);

        const audioPositions = [
            new THREE.Vector3(36.88, 3, 29.16),  // Position pour Albumblatter-JCD
            new THREE.Vector3(6.39, 3, -5.66),   // Position pour Ravel-Martin
            new THREE.Vector3(36.14, 3, -34.86)  // Position pour Ladiaba-Brigitte
        ];

        this.audioSources = []; // Réinitialiser les sources audio

        for (let i = 0; i < 3; i++) {
            const geometry = new THREE.SphereGeometry(0.25, 32, 32);
            const invisibleMaterial = new THREE.MeshBasicMaterial({ 
                transparent: true, 
                opacity: 0 
            });
            
            const audioSphere = new THREE.Mesh(geometry, invisibleMaterial);
            audioSphere.position.copy(audioPositions[i]);
            this.scene.add(audioSphere);

            const sound = new THREE.PositionalAudio(this.listener);
            audioSphere.add(sound);
            sound.setVolume(0);
            
            // Configurer les paramètres de distance pour une meilleure spatialisation
            sound.setRefDistance(0.05); // Distance de référence très petite
            sound.setMaxDistance(20); // Distance maximale pour entendre le son
            sound.setDistanceModel('exponential'); // Modèle de distance exponentiel

            this.audioSources.push({
                sphere: audioSphere,
                sound: sound,
                loaded: false
            });
        }
    }

    loadAudio() {
        const audioFiles = [
            '/audio/Albumblatter-JCD.wav',
            '/audio/Ravel-Martin.wav',
            '/audio/Ladiaba-Brigitte.wav'
        ];

        const loader = new THREE.AudioLoader();
        
        for (let i = 0; i < this.audioSources.length; i++) {
            const source = this.audioSources[i];
            
            if (source.loaded) {
                continue;
            }

            loader.load(audioFiles[i], (buffer) => {
                source.sound.setBuffer(buffer);
                source.sound.setRefDistance(0.05); // Distance de référence réduite pour entendre moins loin
                source.sound.setLoop(true);
                source.loaded = true;
                this.audioLoaded[i] = true;

                // Jouer si conditions remplies
                if (!this.isVideoPlaying && !this.isMutedFromButton) {
                    source.sound.setVolume(8); // Volume augmenté pour les musiques
                    source.sound.play();
                } else {
                    source.sound.setVolume(0);
                }

                source.sound.onError = (error) => {
                    console.error(`Erreur de lecture audio ${i}:`, error);
                };
            }, undefined, (error) => {
                console.error(`Erreur de chargement audio ${i}:`, error);
                this.audioLoaded[i] = false;
            });
        }
    }

    toggleSound(isMuted) {
        this.isMutedFromButton = isMuted;

        this.audioSources.forEach((source, index) => {
            if (!source.sound) {
                return;
            }

            if (!source.loaded && !isMuted) {
                this.loadAudio();
            } else if (source.loaded) {
                if (isMuted) {
                    source.sound.setVolume(0);
                    if (source.sound.isPlaying) source.sound.pause();
                } else {
                    if (!this.isVideoPlaying) {
                        source.sound.setVolume(3); // Volume augmenté pour les musiques
                        if (!source.sound.isPlaying) source.sound.play();
                    } else {
                        source.sound.setVolume(0);
                        if (source.sound.isPlaying) source.sound.pause();
                    }
                }
            }
        });

        // Contrôler aussi la vidéo de projection
        if (this.projectionVideo) {
            this.projectionVideo.muted = isMuted;
        }
        
        // Contrôler l'audio spatialisé de la vidéo de projection
        if (this.Couloir && this.Couloir.videoAudio) {
            if (isMuted) {
                this.Couloir.videoAudio.setVolume(0);
            } else {
                this.Couloir.videoAudio.setVolume(0.005); // Volume très réduit pour la vidéo
            }
        }
    }

    handleVideoStateChange(isVideoActive) {
        this.isVideoPlaying = isVideoActive;

        this.audioSources.forEach((source, index) => {
            if (isVideoActive) {
                if (source.sound && source.sound.isPlaying) {
                    source.sound.setVolume(0);
                    source.sound.pause();
                }
            } else {
                if (!this.isMutedFromButton) {
                    if (!source.loaded) {
                        this.loadAudio();
                    } else if (source.sound) {
                        source.sound.setVolume(3); // Volume augmenté pour les musiques
                        if (!source.sound.isPlaying) source.sound.play();
                    }
                } else {
                    if (source.sound && source.sound.isPlaying) {
                        source.sound.setVolume(0);
                        source.sound.pause();
                    }
                }
            }
        });

        // Contrôler aussi la vidéo de projection
        if (this.projectionVideo) {
            if (isVideoActive) {
                this.projectionVideo.pause();
            } else {
                if (!this.isMutedFromButton) {
                    this.projectionVideo.play();
                }
            }
        }
        
        // Contrôler l'audio spatialisé de la vidéo de projection
        if (this.Couloir && this.Couloir.videoAudio) {
            if (isVideoActive) {
                this.Couloir.videoAudio.setVolume(0);
            } else {
                if (!this.isMutedFromButton) {
                    this.Couloir.videoAudio.setVolume(0.5); // Volume très réduit pour la vidéo
                }
            }
        }
    }

    resize() {
        this.camera?.resize();
        this.renderer?.resize();
    }

    // Enregistrer la vidéo de projection pour le contrôle du son
    registerProjectionVideo(video) {
        this.projectionVideo = video;
        
        // Écouter l'événement pour démarrer la vidéo après l'intro
        window.addEventListener('startExperience', () => {
            this.startProjectionVideo();
        });
        
        // Enregistrer aussi la référence au couloir pour l'audio spatialisé
        if (this.Couloir && this.Couloir.videoAudio) {
            this.projectionVideoAudio = this.Couloir.videoAudio;
        }
    }

    startProjectionVideo() {
        if (this.projectionVideo) {
            this.projectionVideo.currentTime = 0; // Remettre au début
            this.projectionVideo.play().catch(console.error);
        }
    }

    addCollisionObjects(meshes) {
        // Collision ajoutée en attente
    }

    initializeCollisions() {
        // Nettoyer les anciennes collisions
        if (this.collisionSystem) {
            this.collisionSystem.clear();
        }

        // Ajouter les collisions selon vos spécifications exactes
        this.addSpecificCollisions();
    }

    addSpecificCollisions() {
        let addedCount = 0;
        
        this.scene.traverse((child) => {
            if (!child.isMesh) return;
            
            // Brigitte - Room_B seulement dans loadRoom
            if (child.name === 'Room_B') {
                this.collisionSystem.addCollisionObject(child, 'Brigitte_Room_B');
                addedCount++;
            }
            
            // Brigitte - Socle seulement dans loadTree
            if (child.name === 'Socle') {
                this.collisionSystem.addCollisionObject(child, 'Brigitte_Socle');
                addedCount++;
            }
            
            // Brigitte - Tout le modèle loadArtSupport (chevalet)
            if (child.name === 'EaselMerged') {
                this.collisionSystem.addCollisionObject(child, 'Brigitte_ArtSupport');
                addedCount++;
            }
            
            // JCD - salleJCD et ugztdfmdw dans loadRoom
            if (child.name === 'salleJCD') {
                this.collisionSystem.addCollisionObject(child, 'JCD_salleJCD');
                addedCount++;
            }
            if (child.name === 'ugztdfmdw_LOD0_TIER2_000') {
                this.collisionSystem.addCollisionObject(child, 'JCD_ugztdfmdw');
                addedCount++;
            }
            
            // JCD - Tous les modèles loadMiddleWalls (murs du milieu)
            if (child.parent && child.parent.userData && 
                (child.parent.name?.includes('2mursJCD') || child.parent.userData.is2mursJCD)) {
                this.collisionSystem.addCollisionObject(child, `JCD_MiddleWalls_${child.name}`);
                addedCount++;
            }
            
            // JCD - Tous les modèles loadLibrary (bibliothèque)
            if (child.name && (
                child.name.includes('Album') ||
                child.name.includes('VictorianBookcase') ||
                child.name.includes('Library')
            )) {
                this.collisionSystem.addCollisionObject(child, `JCD_Library_${child.name}`);
                addedCount++;
            }
            
            // Martin - Cube010 et room dans loadRoom
            if (child.name === 'Cube010') {
                this.collisionSystem.addCollisionObject(child, 'Martin_Cube010');
                addedCount++;
            }
            if (child.name === 'room') {
                this.collisionSystem.addCollisionObject(child, 'Martin_room');
                addedCount++;
            }
            
            // Couloir - MuseTout, CouloirD, CouloirG, CouloirM
            if (['MuseTout', 'CouloirD', 'CouloirG', 'CouloirM'].includes(child.name)) {
                this.collisionSystem.addCollisionObject(child, `Couloir_${child.name}`);
                addedCount++;
            }
        });

        // Collisions initialisées
    }

    checkCameraCollisions() {
        if (!this.collisionSystem) return false;

        const currentPosition = this.camera.instance.position;
        return !this.collisionSystem.canMove(currentPosition);
    }

    onAssetLoaded() {
        this.assetsLoaded++;

        if (this.assetsLoaded === this.totalAssets) {
            this.modelsLoaded = true;
            
            // Attendre que tous les modèles soient positionnés, puis initialiser les collisions
            setTimeout(() => {
                this.initializeCollisions(); // RÉACTIVÉ - Collisions réactivées
            }, 500);
            
            this.collectTableaux().then(async () => {
                this.setupTableauxInteraction();
                this.startAllAnimations();

                await new Promise((resolve) => {
                    const renderOnce = () => {
                        this.renderer.instance.render(this.scene, this.camera.instance);
                        resolve();
                        this.renderer.instance.setAnimationLoop(null);
                    };
                    this.renderer.instance.setAnimationLoop(renderOnce);
                });

                this.renderer.instance.render(this.scene, this.camera.instance);
                this.tableaux.forEach((tableau) => {
                    if (tableau.material) {
                        const dummy = new THREE.Mesh(tableau.geometry, tableau.material);
                        this.scene.add(dummy);
                        this.renderer.instance.compile(this.scene, this.camera.instance);
                        this.scene.remove(dummy);
                    }
                });
            });
        }
    }

    async initEnvironment() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 2));

        this.RoomBrigitte = new RoomBrigitte(
            this.scene,
            () => this.onAssetLoaded(),
            this,
            150, -20.5, 31,
        );

        await this.RoomBrigitte.init();

        this.Couloir = new CouloirMusee(
            this.scene,
            () => this.onAssetLoaded(),
            this,
            150, -20.5, 31,
        );

        this.RoomJCD = new RoomJCD(
            this.scene,
            () => this.onAssetLoaded(),
            this,
            150, -20.5, 31,
        );

        await this.RoomJCD.init();

        this.RoomMartin = new RoomMartin(
            this.scene,
            () => this.onAssetLoaded(),
            this,
            150, -19.05, 50,  // Position de la salle Martin
        );

        await this.RoomMartin.init();

        // All rooms initialized
    }

    startAllAnimations() {
        if (this.RoomMartin.startMartinAnimation) {
            this.RoomMartin.startMartinAnimation();
        }
    }

    createTooltip() {
        this.tooltip = document.querySelector('.tooltip');
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'tooltip';
            document.body.appendChild(this.tooltip);
        }
    }

    setupTableauxInteraction() {
        this.raycaster = new THREE.Raycaster();
        this.raycaster.firstHitOnly = true;

        document.body.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            if (this.tooltip) {
                this.tooltip.style.left = `${e.clientX + 50}px`;
                this.tooltip.style.top = `${e.clientY + 20}px`;
            }
            this.latestMouseEvent = e;
        });


        this.canvas.addEventListener('click', () => {
            if (this.hoveredTableau) {
                setSelectedObject(this.hoveredTableau.userData.originalName);
                this.tooltip.style.opacity = '0';
                this.hoveredTableau = null;
                this.tableauSelected = true;
            }
        });
    }

    checkTableauxInteraction() {
        // Optimisation : cache temporel pour les interactions
        if (!this.lastTableauCheckTime) this.lastTableauCheckTime = 0;
        const currentTime = performance.now();
        
        // Ne vérifier les tableaux que toutes les 100ms pour optimiser
        if (currentTime - this.lastTableauCheckTime < 100) {
            return;
        }
        this.lastTableauCheckTime = currentTime;

        if (this.hoveredTableau && this.hoveredTableau.originalMaterial) {
            this.hoveredTableau.material = this.hoveredTableau.originalMaterial.clone();
            this.hoveredTableau = null;
        }

        if (this.tableauSelected || this.tableaux.length === 0) {
            this.tooltip.style.opacity = '0';
            document.body.style.cursor = 'auto';
            return;
        }

        const playerPos = this.camera.instance.position;
        const worldPosition = new THREE.Vector3();
        
        // Optimisation : distance réduite et calcul plus simple
        const nearby = this.tableaux.filter(obj => {
            obj.getWorldPosition(worldPosition);
            const dx = playerPos.x - worldPosition.x;
            const dz = playerPos.z - worldPosition.z;
            return (dx * dx + dz * dz) <= 2500; // 50² optimisé
        });

        if (nearby.length === 0) {
            this.tooltip.style.opacity = '0';
            document.body.style.cursor = 'auto';
            return;
        }

        this.raycaster.params.Mesh.threshold = 0.1;

        if (!this.raycaster) {
            this.raycaster = new THREE.Raycaster();
            this.raycaster.firstHitOnly = true;
        }

        this.raycaster.setFromCamera(this.mouse, this.camera.instance);
        const intersects = this.raycaster.intersectObjects(nearby);

        if (intersects.length > 0) {
            this.hoveredTableau = intersects[0].object;
            document.body.style.cursor = 'pointer';

            //const oeuvreName = this.getOeuvreName(this.hoveredTableau.userData?.originalName);
            const originalName = this.hoveredTableau.userData?.originalName ||
                this.hoveredTableau.name;
            const oeuvreName = this.getOeuvreName(originalName);

            this.tooltip.innerHTML = oeuvreName || originalName;
            this.tooltip.style.opacity = '1';

            if (this.latestMouseEvent) {
                this.tooltip.style.left = `${this.latestMouseEvent.clientX + 50}px`;
                this.tooltip.style.top = `${this.latestMouseEvent.clientY + 20}px`;
            }
            return;
        }

        document.body.style.cursor = 'auto';
        this.tooltip.style.opacity = '0';
    }

    async collectTableaux() {
        this.tableaux = [];

        await new Promise(resolve => setTimeout(resolve, 500));

        if (this.RoomBrigitte?.tableaux) {
            this.tableaux.push(...this.RoomBrigitte.tableaux);
        }

        if (this.RoomJCD?.tableaux) {
            this.tableaux.push(...this.RoomJCD.tableaux);
        }

        // Utiliser les tableaux déjà collectés dans les salles
        if (this.RoomMartin?.tableaux) {
            this.tableaux.push(...this.RoomMartin.tableaux);
        }
    }


    getOeuvreName(tableauName) {
        const oeuvreTrouve = this.oeuvresData.find(o => o.tableauId === tableauName);
        return oeuvreTrouve ? oeuvreTrouve.tableau : null;
    }

    deselectTableau() {
        this.tableauSelected = false;
    }

    cleanup() {
        window.removeEventListener('resize', this.resize);
        this.scene.traverse((obj) => {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material?.dispose();
        });
        this.renderer.instance.dispose();
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        
        // Mettre à jour les contrôles (appliquer le mouvement) AVANT la vérification
        this.controls.update();
        
        // Vérifier les collisions APRÈS le mouvement pour corriger si nécessaire
        this.checkCameraCollisions();

        // Debug position toutes les 60 frames (environ 1 seconde)
        if (!this.frameCount) this.frameCount = 0;
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            const pos = this.camera.instance.position;
            //console.log(`Position: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)}`);
        }

        const delta = this.clock.getDelta();

        // Animations 3D seulement si nécessaire
        if (this.RoomMartin && delta > 0) {
            this.RoomMartin.update(delta);
        }

        // Debug tableaux seulement une fois
        if (this.tableaux.length > 0 && !this.debugPrinted) {
            setTimeout(() => {
                this.debugPrinted = true;
            }, 1000);
        }

        // Interactions tableaux (optimisé avec distance)
        this.checkTableauxInteraction();
        
        // Debug des collisions si activé
        if (this.debugCollisions && this.collisionSystem) {
            this.collisionSystem.showDebugBoxes(this.scene);
        }
        
        // Rendu final
        this.renderer.instance.render(this.scene, this.camera.instance);
    };
}