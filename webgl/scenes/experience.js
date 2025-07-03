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

        // Définir les zones géographiques pour chaque pièce
        this.roomZones = {
            jcd: {
                min: { x: 20, z: 15 },
                max: { x: 55, z: 45 }
            },
            martin: {
                min: { x: -10, z: -10 },
                max: { x: 20, z: 5 }
            },
            brigitte: {
                min: { x: 20, z: -50 },
                max: { x: 55, z: -15 }
            },
            couloir: {
                min: { x: 20, z: -15 },
                max: { x: 45, z: 15 }
            }
        };

        this.currentRoom = null;
        this.audioSources = []; // Réinitialiser les sources audio

        // Créer des sources audio non-spatiales (Audio simple au lieu de PositionalAudio)
        for (let i = 0; i < 3; i++) {
            const sound = new THREE.Audio(this.listener);
            sound.setVolume(0);

            this.audioSources.push({
                sound: sound,
                loaded: false,
                room: ['jcd', 'martin', 'brigitte'][i] // Associer chaque son à sa pièce
            });
        }
    }

    loadAudio() {
        const audioFiles = [
            'audio/Albumblatter-JCD.wav',
            'audio/Ravel-Martin.wav',
            'audio/Ladiaba-Brigitte.wav'
        ];

        const loader = new THREE.AudioLoader();
        
        for (let i = 0; i < this.audioSources.length; i++) {
            const source = this.audioSources[i];
            
            if (source.loaded) {
                continue;
            }

            loader.load(audioFiles[i], (buffer) => {
                source.sound.setBuffer(buffer);
                source.sound.setLoop(true);
                source.loaded = true;
                this.audioLoaded[i] = true;

                // Démarrer en pause, sera activé par checkRoomAudio
                source.sound.setVolume(0);

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
                    this.fadeOutAudio(source.sound);
                } else {
                    // Vérifier si on est dans la bonne pièce pour ce son
                    const currentRoom = this.getCurrentRoom();
                    if (currentRoom === source.room && !this.isVideoPlaying) {
                        this.fadeInAudio(source.sound, 0.8);
                    } else {
                        this.fadeOutAudio(source.sound);
                    }
                }
            }
        });

        // Contrôler aussi la vidéo de projection
        if (this.projectionVideo) {
            this.projectionVideo.muted = isMuted;
            if (!isMuted && this.getCurrentRoom() === 'couloir' && !this.isVideoPlaying) {
                this.projectionVideo.volume = 0.8; // Volume équilibré
            } else {
                this.projectionVideo.volume = 0;
            }
        }
        
        // Contrôler l'audio spatialisé de la vidéo de projection
        if (this.Couloir && this.Couloir.videoAudio) {
            if (isMuted) {
                this.Couloir.videoAudio.setVolume(0);
            } else if (this.getCurrentRoom() === 'couloir' && !this.isVideoPlaying) {
                this.Couloir.videoAudio.setVolume(0.8); // Volume équilibré
            } else {
                this.Couloir.videoAudio.setVolume(0);
            }
        }
    }

    handleVideoStateChange(isVideoActive) {
        this.isVideoPlaying = isVideoActive;

        this.audioSources.forEach((source, index) => {
            if (isVideoActive) {
                if (source.sound && source.sound.isPlaying) {
                    this.fadeOutAudio(source.sound);
                }
            } else {
                if (!this.isMutedFromButton) {
                    if (!source.loaded) {
                        this.loadAudio();
                    } else if (source.sound) {
                        // Vérifier si on est dans la bonne pièce pour ce son
                        const currentRoom = this.getCurrentRoom();
                        if (currentRoom === source.room) {
                            this.fadeInAudio(source.sound, 0.8);
                        }
                    }
                } else {
                    if (source.sound && source.sound.isPlaying) {
                        this.fadeOutAudio(source.sound);
                    }
                }
            }
        });

        // Contrôler aussi la vidéo de projection
        if (this.projectionVideo) {
            if (isVideoActive) {
                this.projectionVideo.pause();
            } else {
                if (!this.isMutedFromButton && this.getCurrentRoom() === 'couloir') {
                    this.projectionVideo.play();
                    this.projectionVideo.volume = 0.8; // Volume équilibré
                }
            }
        }
        
        // Contrôler l'audio spatialisé de la vidéo de projection
        if (this.Couloir && this.Couloir.videoAudio) {
            if (isVideoActive) {
                this.Couloir.videoAudio.setVolume(0);
            } else {
                if (!this.isMutedFromButton && this.getCurrentRoom() === 'couloir') {
                    this.Couloir.videoAudio.setVolume(0.8); // Volume équilibré
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

    // Méthode pour détecter dans quelle pièce se trouve la caméra
    getCurrentRoom() {
        const position = this.camera.instance.position;
        
        for (const [roomName, zone] of Object.entries(this.roomZones)) {
            if (position.x >= zone.min.x && position.x <= zone.max.x &&
                position.z >= zone.min.z && position.z <= zone.max.z) {
                return roomName;
            }
        }
        
        return null; // En dehors de toutes les pièces
    }

    // Méthode pour contrôler l'audio basé sur la pièce actuelle
    checkRoomAudio() {
        const newRoom = this.getCurrentRoom();
        
        // Si on change de pièce
        if (newRoom !== this.currentRoom) {
            const oldRoom = this.currentRoom;
            this.currentRoom = newRoom;
            
            // Fade out tous les sons actuels
            this.audioSources.forEach(source => {
                if (source.sound && source.sound.isPlaying) {
                    this.fadeOutAudio(source.sound);
                }
            });

            // Contrôler la vidéo du couloir
            if (this.projectionVideo) {
                if (newRoom === 'couloir') {
                    // On entre dans le couloir, activer la vidéo
                    if (!this.isMutedFromButton && !this.isVideoPlaying) {
                        this.projectionVideo.muted = false;
                        this.projectionVideo.volume = 0.8; // Volume équilibré avec les musiques
                    }
                } else {
                    // On sort du couloir, désactiver la vidéo
                    this.projectionVideo.muted = true;
                    this.projectionVideo.volume = 0;
                }
            }

            // Contrôler l'audio spatialisé de la vidéo du couloir
            if (this.Couloir && this.Couloir.videoAudio) {
                if (newRoom === 'couloir') {
                    if (!this.isMutedFromButton && !this.isVideoPlaying) {
                        this.Couloir.videoAudio.setVolume(0.8); // Volume équilibré
                    }
                } else {
                    this.Couloir.videoAudio.setVolume(0);
                }
            }
            
            // Démarrer le son de la nouvelle pièce si conditions remplies
            setTimeout(() => {
                if (newRoom && newRoom !== 'couloir' && !this.isVideoPlaying && !this.isMutedFromButton) {
                    const roomSource = this.audioSources.find(source => source.room === newRoom);
                    if (roomSource && roomSource.loaded) {
                        this.fadeInAudio(roomSource.sound, 0.8);
                    } else if (roomSource && !roomSource.loaded) {
                        this.loadAudio(); // Charger l'audio si pas encore fait
                    }
                }
            }, 500); // Attendre la fin du fade out
        }
    }

    // Méthode pour faire un fade in de l'audio
    fadeInAudio(sound, targetVolume) {
        if (!sound) return;
        
        sound.setVolume(0);
        if (!sound.isPlaying) {
            sound.play();
        }
        
        const fadeSteps = 20;
        const stepDuration = 50; // ms
        const volumeStep = targetVolume / fadeSteps;
        
        let currentStep = 0;
        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = volumeStep * currentStep;
            sound.setVolume(newVolume);
            
            if (currentStep >= fadeSteps) {
                clearInterval(fadeInterval);
                sound.setVolume(targetVolume);
            }
        }, stepDuration);
    }

    // Méthode pour faire un fade out de l'audio
    fadeOutAudio(sound) {
        if (!sound || !sound.isPlaying) return;
        
        const currentVolume = sound.getVolume();
        const fadeSteps = 20;
        const stepDuration = 25; // ms, plus rapide pour le fade out
        const volumeStep = currentVolume / fadeSteps;
        
        let currentStep = 0;
        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = currentVolume - (volumeStep * currentStep);
            sound.setVolume(Math.max(0, newVolume));
            
            if (currentStep >= fadeSteps || newVolume <= 0) {
                clearInterval(fadeInterval);
                sound.setVolume(0);
                sound.pause();
            }
        }, stepDuration);
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        
        // Mettre à jour les contrôles (appliquer le mouvement) AVANT la vérification
        this.controls.update();
        
        // Vérifier les collisions APRÈS le mouvement pour corriger si nécessaire
        this.checkCameraCollisions();

        // Vérifier l'audio par pièce
        this.checkRoomAudio();

        // Debug position toutes les 60 frames (environ 1 seconde)
        if (!this.frameCount) this.frameCount = 0;
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            const pos = this.camera.instance.position;
            const currentRoom = this.getCurrentRoom();
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
