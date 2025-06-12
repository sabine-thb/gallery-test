import * as THREE from 'three';
import MainCamera from '../modules/camera/mainCamera';
import Controls from '../modules/controls';
import Renderer from '../modules/render';
import { setSelectedObject } from '../../utils/selectionBridge';
import RoomMartin from '../components/SalleMartin/RoomMartin';
import RoomBrigitte from '../components/SalleBrigitte/RoomBrigitte';
import { oeuvres } from '/oeuvres.json';

export default class Experience {
    constructor(canvas) {
        if (!canvas) return;

        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new MainCamera();
        this.renderer = new Renderer(canvas);
        this.controls = new Controls(this.camera.instance, document.body, this);
        this.clock = new THREE.Clock();

        this.assetsLoaded = 0;
        this.totalAssets = 5;

        this.RoomMartin = null;
        this.RoomBrigitte = null;
        this.tableaux = [];
        this.collisionMeshes = [];
        this.debugMode = true;

        this.raycaster = new THREE.Raycaster();
        this.raycaster.firstHitOnly = true;

        this.modelsLoaded = false;
        this.audioLoaded = false;
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

        const geometry = new THREE.SphereGeometry(0.25, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });
        this.audioSphere = new THREE.Mesh(geometry, material);
        this.audioSphere.position.set(30, 1, 0);
        this.scene.add(this.audioSphere);

        this.sound = new THREE.PositionalAudio(this.listener);
        this.audioSphere.add(this.sound);
        this.sound.setVolume(0); // Le son est coupé au moment de l'initialisation
        this.audioLoaded = false;
    }

    loadAudio() {
        if (this.audioLoaded) {
            console.log("Audio déjà chargé.");
            return;
        }

        const loader = new THREE.AudioLoader();
        loader.load('/audio/song.wav', (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setRefDistance(0.25);
            this.sound.setLoop(true);
            this.audioLoaded = true;

            console.log("Buffer audio chargé.");

            // Une fois le buffer chargé, nous vérifions si le son doit être joué
            if (!this.isVideoPlaying && !this.isMutedFromButton) {
                this.sound.setVolume(1);
                this.sound.play();
                console.log("Audio joué car vidéo fermée et non muté.");
            } else {
                this.sound.setVolume(0);
                console.log("Audio chargé mais non joué car vidéo ouverte ou muté.");
            }

            this.sound.onError = (error) => {
                console.error('Audio playback error:', error);
            };
        }, undefined, (error) => {
            console.error('Audio loading failed:', error);
        });
    }

    toggleSound(isMuted) {
        this.isMutedFromButton = isMuted;

        if (!this.sound) {
            console.warn('Son non initialisé.');
            return;
        }

        if (!this.audioLoaded && !isMuted) {
            this.loadAudio();
            console.log("toggleSound: Appel de loadAudio car non chargé et non muté.");
        } else if (this.audioLoaded) {
            if (isMuted) {
                this.sound.setVolume(0);
                if (this.sound.isPlaying) {
                    this.sound.pause();
                }
                console.log("toggleSound: Son muté par l'utilisateur.");
            } else {
                if (!this.isVideoPlaying) {
                    this.sound.setVolume(1);
                    if (!this.sound.isPlaying) {
                        this.sound.play();
                    }
                    console.log("toggleSound: Son non muté et vidéo fermée, joué.");
                } else {
                    this.sound.setVolume(0);
                    if (this.sound.isPlaying) {
                        this.sound.pause();
                    }
                    console.log("toggleSound: Son non muté mais vidéo active, donc coupé.");
                }
            }
        }
    }

    handleVideoStateChange(isVideoActive) {
        this.isVideoPlaying = isVideoActive;
        console.log(`handleVideoStateChange: isVideoActive = ${isVideoActive}, isMutedFromButton = ${this.isMutedFromButton}`);

        if (isVideoActive) {
            if (this.sound && this.sound.isPlaying) {
                this.sound.setVolume(0);
                this.sound.pause();
                console.log("Vidéo ouverte, son du jeu coupé et mis en pause.");
            }
        } else {
            if (!this.isMutedFromButton) {
                if (!this.audioLoaded) {
                    this.loadAudio();
                    console.log("Vidéo fermée, son non chargé, appel de loadAudio.");
                } else if (this.sound) {
                    this.sound.setVolume(1);
                    if (!this.sound.isPlaying) {
                        this.sound.play();
                    }
                    console.log("Vidéo fermée, son déjà chargé, joué.");
                }
            } else {
                if (this.sound && this.sound.isPlaying) {
                    this.sound.setVolume(0);
                    this.sound.pause();
                }
                console.log("Vidéo fermée, son du jeu reste coupé car bouton en sourdine.");
            }
        }
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
            150, -20, 50,
        );

        await this.RoomBrigitte.init();

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
        this.checkCameraCollisions();

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