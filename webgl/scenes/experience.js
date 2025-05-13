import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import MainCamera from '../modules/camera/mainCamera';
import Controls from '../modules/controls';
import Renderer from '../modules/render';
import { setSelectedObject } from '../../utils/selectionBridge';

// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';


THREE.Mesh.prototype.raycast = acceleratedRaycast;

export default class Experience {
    constructor(canvas) {
        if (!canvas) return;

        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new MainCamera();
        this.renderer = new Renderer(canvas);
        this.controls = new Controls(this.camera.instance, document.body, this);
        this.originalControlsUpdate = this.controls.update.bind(this.controls);

        this.playerRadius = 0.5;
        this.modelsLoaded = false;
        this.audioLoaded = false;
        this.tableaux = [];
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.hoveredTableau = null;
        this.tableauSelected = false;


        this.createTooltip();

        this.initPlayerCollider();
        this.initAudio();
        this.initEnvironment();

        this.camera.instance.position.set(29.79, 1.7, 0.65);
        this.animate();
    }

    initPlayerCollider() {
        const geometry = new THREE.BoxGeometry(1, 1.7, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0 });
        this.playerCollider = new THREE.Mesh(geometry, material);
        this.scene.add(this.playerCollider);
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
    }

    loadAudio() {
        if (this.audioLoaded) return;

        const loader = new THREE.AudioLoader();
        loader.load('/audio/song.wav', (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setRefDistance(0.25);
            this.sound.setLoop(true);
            this.sound.setVolume(1);
            this.sound.play();
            this.audioLoaded = true;
        });
    }

    resize() {
        this.camera?.resize();
        this.renderer?.resize();
    }

    initEnvironment() {
        this.materials = {
            items: {
                wall: new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.5 }),
                floor: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7, receiveShadow: true }),
                ceiling: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 }),
                invisible: new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.2 })
            }
        };

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));

        Promise.all([
            this.loadMuseumModel(),
            this.loadTableauxModel()
        ]).then(() => {
            this.setupCollisionDetection();
            this.modelsLoaded = true;
        });
    }

    loadMuseumModel() {
        if (this.modelsLoaded) return Promise.resolve();

        const loader = new GLTFLoader();
        return loader.loadAsync('/MUSEE/BLENDER/RENDUS/V1/SALLES/MUSEE_DJERBAMOOD.glb')
            .then(gltf => {
                this.museumModel = gltf.scene;
                this.museumModel.position.set(145, -17, 0.65);
                this.scene.add(this.museumModel);

                this.museumModel.traverse((child) => {
                    if (child.isMesh) {
                        child.geometry.boundsTree = new MeshBVH(child.geometry, { lazyGeneration: false });
                        child.material.side = child.material.shadowSide = THREE.DoubleSide;
                        child.castShadow = child.receiveShadow = true;

                        const box = new THREE.Box3().setFromObject(child);
                        const size = box.getSize(new THREE.Vector3());
                        const isFloor = size.y < size.x * 0.3 && size.y < size.z * 0.3 && box.min.y < -16.5;
                        child.userData.isFloor = isFloor;

                    }
                });
            });
    }

    loadTableauxModel() {
        const loader = new GLTFLoader();
        return loader.loadAsync('/MUSEE/BLENDER/RENDUS/V1/TABLEAUX/TableauxMartin.glb')
            .then(gltf => {
                this.tableauxModel = gltf.scene;
                this.tableauxModel.position.set(145, -17, 0.65);
                this.scene.add(this.tableauxModel);

                this.tableauxModel.traverse((child) => {
                    if (child.isMesh && child.name.startsWith('FaceTableauMartin')) {
                        child.userData.originalName = child.name;
                        child.originalMaterial = child.material.clone();
                        child.material.side = THREE.DoubleSide;
                        child.castShadow = child.receiveShadow = true;
                        child.userData.isTableau = true;
                        this.tableaux.push(child);
                    }
                });
                this.setupTableauxInteraction();
            });
    }

    setupTableauxInteraction() {
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
                console.log("Tableau sélectionné:", this.hoveredTableau.userData.originalName);
                this.tooltip.style.opacity = '0';
                this.hoveredTableau = null;
                this.tableauSelected = true;
            }
        });
    }


    createTooltip() {
        this.tooltip = document.querySelector('.tooltip');

        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'tooltip';
            document.body.appendChild(this.tooltip);
        }
    }


    checkTableauxInteraction() {
        if (this.hoveredTableau) {
            this.hoveredTableau.material = this.hoveredTableau.originalMaterial.clone();
            this.hoveredTableau = null;
        }

        if (this.tableauSelected) {
            this.tooltip.style.opacity = '0';
            document.body.style.cursor = 'auto';
            return;
        }

        if (!this.tableaux.length) {
            this.tooltip.style.opacity = '0';
            return;
        }


        const playerPos = this.camera.instance.position;
        const nearby = this.tableaux.filter(obj => playerPos.distanceTo(obj.getWorldPosition(new THREE.Vector3())) <= 50);

        if (nearby.length) {
            this.raycaster.setFromCamera(this.mouse, this.camera.instance);
            const intersects = this.raycaster.intersectObjects(nearby);

            if (intersects.length > 0) {
                this.hoveredTableau = intersects[0].object;

                document.body.style.cursor = 'pointer';

                const highlight = this.hoveredTableau.material.clone();
                highlight.emissiveIntensity = 0.5;
                this.hoveredTableau.material = highlight;

                this.tooltip.textContent = this.hoveredTableau.userData.originalName;
                this.tooltip.style.opacity = '1';

                // 🟡 Mise à jour de la position ici
                if (this.latestMouseEvent) {
                    this.tooltip.style.left = `${this.latestMouseEvent.clientX + 50}px`;
                    this.tooltip.style.top = `${this.latestMouseEvent.clientY + 20}px`;
                }

                return;
            }
        }

        document.body.style.cursor = 'auto';
        this.tooltip.style.opacity = '0';
    }



    setupCollisionDetection() {
        this.controls.update = () => {
            const camera = this.controls.instance.object;
            const prevPos = camera.position.clone();
            this.originalControlsUpdate();
            this.playerCollider.position.copy(camera.position);
            if (this.checkCollisions(camera.position)) {
                camera.position.copy(prevPos);
            }
        };
    }

    checkCollisions(position) {
        if (!this.museumModel) return false;

        const raycaster = new THREE.Raycaster();
        raycaster.far = 1.5;
        const directions = [
            new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(1, 0, 1).normalize(),
            new THREE.Vector3(-1, 0, 1).normalize(),
            new THREE.Vector3(1, 0, -1).normalize(),
            new THREE.Vector3(-1, 0, -1).normalize()
        ];

        for (const dir of directions) {
            raycaster.set(position, dir);
            const intersects = raycaster.intersectObjects(this.getAllCollisionMeshes(), true);
            if (intersects.length > 0) return true;
        }

        return false;
    }

    getAllCollisionMeshes() {
        const meshes = [];

        const gatherMeshes = (model) => {
            if (!model) return;
            model.traverse((child) => {
                if (child.isMesh && child !== this.playerCollider) {
                    meshes.push(child);
                }
            });
        };

        gatherMeshes(this.museumModel);
        gatherMeshes(this.tableauxModel);
        this.scene.traverse((child) => {
            if (child.isMesh && child !== this.playerCollider) meshes.push(child);
        });

        return meshes;
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

    deselectTableau() {
        this.tableauSelected = false;
    }



    animate = () => {
        requestAnimationFrame(this.animate);
        this.controls.update();
        this.checkTableauxInteraction();
        this.renderer.instance.render(this.scene, this.camera.instance);
    };
}