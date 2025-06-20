import * as THREE from 'three';
import MainCamera from '../modules/camera/mainCamera';
import Controls from '../modules/controls';
import Renderer from '../modules/render';
import { setSelectedObject } from '../../utils/selectionBridge';
import RoomMartin from '../components/SalleMartin/RoomMartin';
import RoomBrigitte from '../components/SalleBrigitte/RoomBrigitte';
import RoomJCD from '../components/SalleJCD/RoomJCD';
import CouloirMusee from '../components/corridor/CouloirMusee';
import { oeuvres } from '/oeuvres.json';

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
        console.log("Experience: Initialisation avec le canvas :", canvas);

        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new MainCamera();
        this.renderer = new Renderer(canvas); // Le problème se produit probablement à l'intérieur de ce constructeur
        this.controls = new Controls(this.camera.instance, document.body, this);
        this.clock = new THREE.Clock();

        this.assetsLoaded = 0;
        this.totalAssets = 16;

        this.RoomMartin = null;
        this.RoomBrigitte = null;
        this.RoomJCD = null;
        this.tableaux = [];
        this.collisionMeshes = [];
        this.debugMode = true;

        this.raycaster = new THREE.Raycaster();
        this.raycaster.firstHitOnly = true;

        this.audioSources = [];

        this.modelsLoaded = false;
        this.audioLoaded = [false, false, false];
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
            console.log("Environment initialized and animations started. Initial audio state set.");
        });

        this.camera.instance.position.set(29.79, 1.7, 0.65);
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
            const material = new THREE.MeshBasicMaterial({ 
                color: 0xff0000, 
                transparent: true, 
                opacity: this.debugMode ? 0.5 : 0 
            });
            
            const audioSphere = new THREE.Mesh(geometry, material);
            audioSphere.position.copy(audioPositions[i]);
            this.scene.add(audioSphere);

            const sound = new THREE.PositionalAudio(this.listener);
            audioSphere.add(sound);
            sound.setVolume(0);

            this.audioSources.push({
                sphere: audioSphere,
                sound: sound,
                loaded: false
            });

            console.log(`Source audio ${i} position:`, audioPositions[i]);
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
                console.log(`Audio ${i} déjà chargé.`);
                continue;
            }

            loader.load(audioFiles[i], (buffer) => {
                source.sound.setBuffer(buffer);
                source.sound.setRefDistance(0.25);
                source.sound.setLoop(true);
                source.loaded = true;
                this.audioLoaded[i] = true;

                console.log(`Buffer audio ${i} chargé.`);

                // Jouer si conditions remplies
                if (!this.isVideoPlaying && !this.isMutedFromButton) {
                    source.sound.setVolume(1);
                    source.sound.play();
                    console.log(`Audio ${i} joué car vidéo fermée et non muté.`);
                } else {
                    source.sound.setVolume(0);
                    console.log(`Audio ${i} chargé mais non joué car vidéo ouverte ou muté.`);
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
                console.warn(`Source audio ${index} non initialisée.`);
                return;
            }

            if (!source.loaded && !isMuted) {
                this.loadAudio();
                console.log(`toggleSound: Chargement audio ${index} déclenché.`);
            } else if (source.loaded) {
                if (isMuted) {
                    source.sound.setVolume(0);
                    if (source.sound.isPlaying) source.sound.pause();
                    console.log(`toggleSound: Audio ${index} muté.`);
                } else {
                    if (!this.isVideoPlaying) {
                        source.sound.setVolume(1);
                        if (!source.sound.isPlaying) source.sound.play();
                        console.log(`toggleSound: Audio ${index} joué (vidéo fermée).`);
                    } else {
                        source.sound.setVolume(0);
                        if (source.sound.isPlaying) source.sound.pause();
                        console.log(`toggleSound: Audio ${index} coupé (vidéo active).`);
                    }
                }
            }
        });
    }

    handleVideoStateChange(isVideoActive) {
        this.isVideoPlaying = isVideoActive;
        console.log(`handleVideoStateChange: isVideoActive = ${isVideoActive}, isMutedFromButton = ${this.isMutedFromButton}`);

        this.audioSources.forEach((source, index) => {
            if (isVideoActive) {
                if (source.sound && source.sound.isPlaying) {
                    source.sound.setVolume(0);
                    source.sound.pause();
                    console.log(`Audio ${index} coupé (vidéo ouverte).`);
                }
            } else {
                if (!this.isMutedFromButton) {
                    if (!source.loaded) {
                        this.loadAudio();
                        console.log(`Audio ${index} non chargé, chargement déclenché.`);
                    } else if (source.sound) {
                        source.sound.setVolume(1);
                        if (!source.sound.isPlaying) source.sound.play();
                        console.log(`Audio ${index} joué (vidéo fermée).`);
                    }
                } else {
                    if (source.sound && source.sound.isPlaying) {
                        source.sound.setVolume(0);
                        source.sound.pause();
                    }
                    console.log(`Audio ${index} reste coupé (sourdine activée).`);
                }
            }
        });
    }

    resize() {
        this.camera?.resize();
        this.renderer?.resize();
    }

    addCollisionObjects(meshes) {
        meshes.forEach(mesh => {
            if (mesh.geometry && !mesh.geometry.boundsTree) {
                mesh.geometry.computeBoundsTree();
            }
            this.collisionMeshes.push(mesh);
        });
    }

    onAssetLoaded() {
        this.assetsLoaded++;
        console.log(`Asset loaded (${this.assetsLoaded}/${this.totalAssets})`);

        if (this.assetsLoaded === this.totalAssets) {
            console.log("All assets reported loaded by individual components.");
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

        console.log("Both rooms initialized");
        if (this.debugMode && this.RoomMartin && this.RoomBrigitte) {
            this.RoomMartin.toggleBVHHelpers(true);
            this.RoomBrigitte.toggleBVHHelpers(true);
            this.RoomJCD.toggleBVHHelpers(true);
        }
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
            console.log('Canvas cliqué');
            if (this.hoveredTableau) {
                setSelectedObject(this.hoveredTableau.userData.originalName);
                console.log("Tableau sélectionné:", this.hoveredTableau.userData.originalName);
                this.tooltip.style.opacity = '0';
                this.hoveredTableau = null;
                this.tableauSelected = true;
            }
        });
    }

    checkTableauxInteraction() {
        if (this.hoveredTableau && this.hoveredTableau.originalMaterial) {
            this.hoveredTableau.material = this.hoveredTableau.originalMaterial.clone();
            this.hoveredTableau = null;
        }

        if (this.tableauSelected || this.tableaux.length === 0) {
            this.tooltip.style.opacity = '0';
            document.body.style.cursor = 'auto';
            return;
        }

        if (this.tableaux.length === 0) {
            console.warn("Aucun tableau à interagir");
            return;
        }

        //console.log("Vérification interaction tableaux...");
        //console.log(`Tableaux totaux: ${this.tableaux.length}, Tableau sélectionné: ${this.tableauSelected}`);

        const playerPos = this.camera.instance.position;
        const worldPosition = new THREE.Vector3();
        const nearby = this.tableaux.filter(obj => {
            obj.getWorldPosition(worldPosition);
            return playerPos.distanceTo(worldPosition) <= 50;
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
        console.log("Collecte des tableaux...");
        this.tableaux = [];

        await new Promise(resolve => setTimeout(resolve, 500));

        if (this.RoomBrigitte?.tableaux) {
            console.log(`Found ${this.RoomBrigitte.tableaux.length} Brigitte tableaux`);
            this.tableaux.push(...this.RoomBrigitte.tableaux);
        }

        if (this.RoomJCD?.tableaux) {
            console.log(`Found ${this.RoomJCD.tableaux.length} JCD tableaux`);
            this.tableaux.push(...this.RoomJCD.tableaux);
        }

        // Utiliser les tableaux déjà collectés dans les salles
        if (this.RoomMartin?.tableaux) {
            console.log(`Found ${this.RoomMartin.tableaux.length} Martin tableaux`);
            this.tableaux.push(...this.RoomMartin.tableaux);
        }

        console.log("Tableaux collectés:", this.tableaux.length);

        console.log("Noms des tableaux:", this.tableaux.map(t => {
            return `${t.name} (original: ${t.userData?.originalName})`;
        }));
    }


    getOeuvreName(tableauName) {
        const oeuvreTrouve = this.oeuvresData.find(o => o.tableauId === tableauName);
        return oeuvreTrouve ? oeuvreTrouve.tableau : null;
    }

    checkCameraCollisions() {
        if (!this.collisionMeshes || this.collisionMeshes.length === 0) return;

        const origin = this.camera.instance.position.clone();
        let direction = new THREE.Vector3();
        this.controls.getMoveDirection(direction);

        const raycaster = new THREE.Raycaster(origin, direction, 0, 1.2);

        if (direction.length() > 0) {
            direction = direction.normalize();
        }

        raycaster.firstHitOnly = true;
        raycaster.params.UseBVH = true;
        const intersects = raycaster.intersectObjects(this.collisionMeshes, true);

        if (intersects.length > 0) {
            this.controls.preventForwardMotion();
        }
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
        this.controls.update();
        //this.checkCameraCollisions();

        const delta = this.clock.getDelta();

        if (this.RoomMartin) {
            this.RoomMartin.update(delta);
        }

        if (this.tableaux.length > 0 && !this.debugPrinted) {
            setTimeout(() => {
                this.tableaux.forEach(t => {
                });
                this.debugPrinted = true;
            }, 1000);
        }

        this.checkTableauxInteraction();
        this.renderer.instance.render(this.scene, this.camera.instance);
    };
}