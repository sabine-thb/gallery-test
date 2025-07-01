import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export default class RoomJCD {
    constructor(scene, onAssetLoaded, experience, x, y, z) {
        this.scene = scene;
        this.experience = experience;
        this.onAssetLoaded = onAssetLoaded;
        this.position = new THREE.Vector3(x, y, z);
        this.tableaux = [];

        this.loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        this.loader.setDRACOLoader(dracoLoader);

        this.textureLoader = new THREE.TextureLoader();
        this.loadTextures();
    }

    async init() {
        await this.loadRoom();
        await this.loadMiddleWalls();
        await this.loadChandeliers();
        await this.loadLibrary();
        await this.loadAlbums();
        await this.loadPaintings();
    }

    loadTextures() {
        // Textures spécifiques à JCD
        this.bakedTextureRoom = this.textureLoader.load('textures/RoomJCD/SalleJCDBake/SalleJcdBC03.png');
        this.bakedTextureToit = this.textureLoader.load('textures/RoomJCD/SalleJCDBake/ToitJCDBC.png')
        this.bakedTextureChandelier = this.textureLoader.load('textures/RoomJCD/ChandelierBake/Chandelier01BCtest.png')
        this.bakedTextureMursJCD1 = this.textureLoader.load('textures/RoomJCD/MursMiddleBake/MursJCDBC03.png')
        this.bakedTextureFenetre = this.textureLoader.load('textures/RoomJCD/FenetreBake/Modular_Interior_Window_Wall_ugztdfmdw_Mid_2K_BaseColor.jpg')
        // Textures pour la bibliothèque
        this.bakedTextureAlbumLibrary01 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Album03BC.png')
        this.bakedTextureAlbumLibrary02 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Album04BC.png')
        this.bakedTextureLibrary01 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library01BC.png')
        this.bakedTextureLibrary02 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library02BC.png')
        this.bakedTextureLibrary03 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library03BC.png')
        this.bakedTextureLibrary04 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library04BC.png')
        this.bakedTextureLibrary05 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library05BC.png')
        this.bakedTextureLibrary06 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library06BC.png')
        this.bakedTextureLibrary07 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library07BC.png')
        // Désactiver flipY et définir l'espace couleur
        const textures = [
            this.bakedTextureRoom,
            this.bakedTextureToit,
            this.bakedTextureChandelier,
            this.bakedTextureMursJCD1,
            this.bakedTextureFenetre,
            this.bakedTextureAlbumLibrary01,
            this.bakedTextureAlbumLibrary02,
            this.bakedTextureLibrary01,
            this.bakedTextureLibrary02,
            this.bakedTextureLibrary03,
            this.bakedTextureLibrary04,
            this.bakedTextureLibrary05,
            this.bakedTextureLibrary06,
            this.bakedTextureLibrary07
        ];
        textures.forEach(tex => {
            tex.flipY = false;
            tex.colorSpace = THREE.SRGBColorSpace;
        });
    }

    loadRoom() {
        return new Promise((resolve) => {
            this.loader.load('/3dModels/RoomJCD/SalleJcd01.glb', (gltf) => {
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        if (child.name === 'salleJCD') {
                            child.material = new THREE.MeshStandardMaterial({
                                map: this.bakedTextureRoom
                            });
                        } else if (child.name === 'ugztdfmdw_LOD0_TIER2_000') {
                            child.material = new THREE.MeshStandardMaterial({
                                map: this.bakedTextureFenetre
                            });
                        } else if (child.name === 'salleJCDToit') {
                            child.material = new THREE.MeshStandardMaterial({
                                map: this.bakedTextureToit
                            });
                        }
                    }
                });

                gltf.scene.position.copy(this.position);
                this.scene.add(gltf.scene);

                // Ajouter les objets aux collisions
                if (this.experience?.addCollisionObjects) {
                    const collisionMeshes = [];
                    gltf.scene.traverse(child => {
                        if (child.isMesh) collisionMeshes.push(child);
                    });
                    this.experience.addCollisionObjects(collisionMeshes);
                }

                resolve();
                this.onAssetLoaded();
            }, undefined, (error) => {
                console.error('Erreur chargement JCDRoom2:', error);
                resolve();
                this.onAssetLoaded();
            });
        });
    }

    loadMiddleWalls() {
        return new Promise((resolve) => {
            this.loader.load('/3dModels/RoomJCD/2mursJCD.glb', (gltf) => {
                const material = new THREE.MeshStandardMaterial({
                    map: this.bakedTextureMursJCD1
                });
                
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        child.material = material;
                    }
                });
                
                gltf.scene.position.copy(this.position);
                this.scene.add(gltf.scene);
                
                // Ajouter les objets aux collisions
                if (this.experience?.addCollisionObjects) {
                    const collisionMeshes = [];
                    gltf.scene.traverse(child => {
                        if (child.isMesh) collisionMeshes.push(child);
                    });
                    this.experience.addCollisionObjects(collisionMeshes);
                }
                
                resolve();
                this.onAssetLoaded();
            }, undefined, (error) => {
                console.error('Erreur chargement 2mursJCD:', error);
                resolve();
                this.onAssetLoaded();
            });
        });
    }

    loadChandeliers() {
        return new Promise((resolve) => {
            this.loader.load('/3dModels/RoomJCD/JcdChandeliers02.glb', (gltf) => {
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        if (child.name.startsWith('Sphere')) {
                            child.material = new THREE.MeshStandardMaterial({
                                emissive: new THREE.Color(0x00ffff),
                                emissiveIntensity: 5.5
                            });
                        } else {
                            child.material = new THREE.MeshStandardMaterial({
                                map: this.bakedTextureChandelier,
                            });
                        }
                    }
                });

                gltf.scene.position.copy(this.position);
                this.scene.add(gltf.scene);

                // Ajouter les objets aux collisions
                if (this.experience?.addCollisionObjects) {
                    const collisionMeshes = [];
                    gltf.scene.traverse(child => {
                        if (child.isMesh) collisionMeshes.push(child);
                    });
                    this.experience.addCollisionObjects(collisionMeshes);
                }

                resolve();
                this.onAssetLoaded();
            }, undefined, (error) => {
                console.error('Erreur chargement JcdChandeliers:', error);
                resolve();
                this.onAssetLoaded();
            });
        });
    }

    loadLibrary() {
        return new Promise((resolve) => {
            this.loader.load('/3dModels/RoomJCD/LibraryJCD02.glb', (gltf) => {
                const textureMap = {
                    'Album03': [this.bakedTextureAlbumLibrary01],
                    'Album04': [this.bakedTextureAlbumLibrary02],
                    'VictorianBookcaseSmall001': [this.bakedTextureLibrary01],
                    'VictorianBookcaseSmall002': [this.bakedTextureLibrary02],
                    'VictorianBookcaseTall001': [this.bakedTextureLibrary03],
                    'VictorianBookcaseTall002': [this.bakedTextureLibrary04],
                    'VictorianBookcaseTall003': [this.bakedTextureLibrary05],
                    'VictorianBookcaseTall004': [this.bakedTextureLibrary06],
                    'VictorianBookcasTall005': [this.bakedTextureLibrary07]
                };

                gltf.scene.traverse((child) => {
                    if (child.isMesh && textureMap[child.name]) {
                        const [map] = textureMap[child.name];
                        child.material = new THREE.MeshStandardMaterial({ map });
                    }
                });

                gltf.scene.position.copy(this.position);
                this.scene.add(gltf.scene);

                // Ajouter les objets aux collisions
                if (this.experience?.addCollisionObjects) {
                    const collisionMeshes = [];
                    gltf.scene.traverse(child => {
                        if (child.isMesh) collisionMeshes.push(child);
                    });
                    this.experience.addCollisionObjects(collisionMeshes);
                }

                resolve();
                this.onAssetLoaded();
            }, undefined, (error) => {
                console.error('Erreur chargement LibraryJCD:', error);
                resolve();
                this.onAssetLoaded();
            });
        });
    }

    loadAlbums() {
        return new Promise((resolve) => {
            this.loader.load('/3dModels/RoomJCD/AlbumJCD02.glb', (gltf) => {
                gltf.scene.position.copy(this.position);
                this.scene.add(gltf.scene);
                
                // Ajouter les objets aux collisions
                if (this.experience?.addCollisionObjects) {
                    const collisionMeshes = [];
                    gltf.scene.traverse(child => {
                        if (child.isMesh) collisionMeshes.push(child);
                    });
                    this.experience.addCollisionObjects(collisionMeshes);
                }
                
                resolve();
                this.onAssetLoaded();
            }, undefined, (error) => {
                console.error('Erreur chargement AlbumJCD:', error);
                resolve();
                this.onAssetLoaded();
            });
        });
    }

    loadPaintings() {
        return new Promise((resolve) => {
            this.loader.load('/3dModels/RoomJCD/TableauJCD03.glb', (gltf) => {
                gltf.scene.traverse((child) => {
                    if (child.isMesh && /^FaceTableauJCD\d+$/.test(child.name)) {
                        child.userData.originalName = child.name;
                        child.originalMaterial = child.material.clone();
                        child.material.side = THREE.DoubleSide;
                        child.userData.isTableau = true;
                        this.tableaux.push(child);
                    }
                });

                gltf.scene.position.set(
                    this.position.x + 0.54,
                    this.position.y,
                    this.position.z
                );
                this.scene.add(gltf.scene);
                
                // Ajouter les objets aux collisions
                if (this.experience?.addCollisionObjects) {
                    const collisionMeshes = [];
                    gltf.scene.traverse(child => {
                        if (child.isMesh) collisionMeshes.push(child);
                    });
                    this.experience.addCollisionObjects(collisionMeshes);
                }
                
                resolve();
                this.onAssetLoaded();
            }, undefined, (error) => {
                console.error('Erreur chargement TableauJCD:', error);
                resolve();
                this.onAssetLoaded();
            });
        });
    }
}
