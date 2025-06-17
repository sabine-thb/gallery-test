import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';

export default class RoomJCD {
    constructor(scene, onAssetLoaded, experience, x, y, z) {
        this.scene = scene;
        this.experience = experience;
        this.onAssetLoaded = onAssetLoaded;
        this.position = new THREE.Vector3(x, y, z);
        this.tableaux = [];
        this.bvhHelpers = [];
        this.showBVHHelpers = experience?.debugMode || false;

        // Initialisation BVH (identique à RoomBrigitte)
        if (!THREE.BufferGeometry.prototype.computeBoundsTree) {
            THREE.BufferGeometry.prototype.computeBoundsTree = function () {
                this.boundsTree = new MeshBVH(this);
                return this.boundsTree;
            };
            THREE.BufferGeometry.prototype.disposeBoundsTree = function () {
                this.boundsTree = null;
            };
            THREE.Mesh.prototype.raycast = acceleratedRaycast;
        }

        this.loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        this.loader.setDRACOLoader(dracoLoader);

        this.textureLoader = new THREE.TextureLoader();
        this.loadTextures();
    }

    async init() {
        await this.loadRoom();
        await this.loadChandeliers();
        await this.loadLibrary();
        await this.loadAlbums();
        await this.loadPaintings();
    }

    createBVHHelper(mesh) {
        if (!this.showBVHHelpers || !mesh.geometry?.boundsTree) return null;

        const helper = new THREE.Box3Helper(
            mesh.geometry.boundsTree.getBoundingBox(new THREE.Box3()),
            new THREE.Color(0xffff00)
        );
        helper.visible = true;
        helper.matrixAutoUpdate = false;
        helper.matrix.copy(mesh.matrixWorld);
        return helper;
    }

    toggleBVHHelpers(visible) {
        this.showBVHHelpers = visible;
        this.bvhHelpers.forEach(helper => {
            helper.visible = visible;
        });
    }

    applyBVH(gltf) {
        gltf.scene.traverse(child => {
            if (child.isMesh && child.geometry?.isBufferGeometry) {
                if (!child.geometry.boundsTree) {
                    child.geometry.computeBoundsTree();
                    child.raycast = acceleratedRaycast;

                    const helper = this.createBVHHelper(child);
                    if (helper) {
                        this.scene.add(helper);
                        this.bvhHelpers.push(helper);
                    }
                }
            }
        });
    }

    loadTextures() {
        // Textures spécifiques à JCD
        this.bakedTextureRoom = this.textureLoader.load('textures/RoomJCD/SalleJCDBake/SalleJcdBC.png');
        this.bakedTextureRoomNormal = this.textureLoader.load('textures/RoomJCD/SalleJCDBake/SalleJcdNomral.png');
        this.bakedTextureRoomRoughness = this.textureLoader.load('textures/RoomJCD/SalleJCDBake/SalleJcdRougness.png');

        this.bakedTextureToit = this.textureLoader.load('textures/RoomJCD/SalleJCDBake/ToitJCDBC.png');
        this.bakedTextureToitNormal = this.textureLoader.load('textures/RoomJCD/SalleJCDBake/ToitJCDNormal.png');
        this.bakedTextureToitRoughness = this.textureLoader.load('textures/RoomJCD/SalleJCDBake/ToitJCDRougness.png');

        this.bakedTextureChandelier = this.textureLoader.load('textures/RoomJCD/ChandelierBake/Chandelier01BCtest.png');
        this.bakedTextureChandelierNormal = this.textureLoader.load('textures/RoomJCD/ChandelierBake/Chandelier01Normal.png');
        this.bakedTextureChandelierRoughness = this.textureLoader.load('textures/RoomJCD/ChandelierBake/Chandelier01Rougness.png');
        this.bakedTextureChandelierMetalic = this.textureLoader.load('textures/RoomJCD/ChandelierBake/ChandelierBC01Metalic.png');

        this.bakedTextureMurs = this.textureLoader.load('textures/RoomJCD/MursMiddleBake/MursJCDBC.png');
        this.bakedTextureMursRoughness = this.textureLoader.load('textures/RoomJCD/MursMiddleBake/MursJCDRougness.png');

        this.bakedTextureFenetre = this.textureLoader.load('textures/RoomJCD/FenetreBake/Modular_Interior_Window_Wall_ugztdfmdw_Mid_2K_BaseColor.jpg');
        this.bakedTextureFenetreNormal = this.textureLoader.load('textures/RoomJCD/FenetreBake/Modular_Interior_Window_Wall_ugztdfmdw_Mid_2K_Normal.jpg');
        this.bakedTextureFenetreRoughness = this.textureLoader.load('textures/RoomJCD/FenetreBake/Modular_Interior_Window_Wall_ugztdfmdw_Mid_2K_Roughness.jpg');

        // Textures pour la bibliothèque
        this.bakedTextureLibrary01 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library01BC.png');
        this.bakedTextureLibrary01Normal = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library01Normal.png');
        this.bakedTextureLibrary01Roughness = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library01Rougness.png');

        this.bakedTextureLibrary02 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library02BC.png');
        this.bakedTextureLibrary02Normal = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library02Normal.png');
        this.bakedTextureLibrary02Roughness = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library02Rougness.png');

        this.bakedTextureLibrary03 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library03BC.png');
        this.bakedTextureLibrary03Normal = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library03Normal.png');
        this.bakedTextureLibrary03Roughness = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library03Rougness.png');

        this.bakedTextureLibrary04 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library04BC.png');
        this.bakedTextureLibrary04Normal = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library04Normal.png');
        this.bakedTextureLibrary04Roughness = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library04Rougness.png');

        this.bakedTextureLibrary05 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library05BC.png');
        this.bakedTextureLibrary05Normal = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library05Normal.png');
        this.bakedTextureLibrary05Roughness = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library05Rougness.png');

        this.bakedTextureLibrary06 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library06BC.png');
        this.bakedTextureLibrary06Normal = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library06Normal.png');
        this.bakedTextureLibrary06Roughness = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library06Rougness.png');

        this.bakedTextureLibrary07 = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library07BC.png');
        this.bakedTextureLibrary07Normal = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library07Normal.png');
        this.bakedTextureLibrary07Roughness = this.textureLoader.load('textures/RoomJCD/LibraryBake/Library07Rougness.png');

        // Désactiver flipY et définir l'espace couleur
        const textures = [
            this.bakedTextureRoom, this.bakedTextureRoomNormal, this.bakedTextureRoomRoughness,
            this.bakedTextureToit, this.bakedTextureToitNormal, this.bakedTextureToitRoughness,
            this.bakedTextureChandelier, this.bakedTextureChandelierNormal, this.bakedTextureChandelierRoughness, this.bakedTextureChandelierMetalic,
            this.bakedTextureMurs, this.bakedTextureMursRoughness,
            this.bakedTextureFenetre, this.bakedTextureFenetreNormal, this.bakedTextureFenetreRoughness,
            this.bakedTextureLibrary01, this.bakedTextureLibrary01Normal, this.bakedTextureLibrary01Roughness,
            this.bakedTextureLibrary02, this.bakedTextureLibrary02Normal, this.bakedTextureLibrary02Roughness,
            this.bakedTextureLibrary03, this.bakedTextureLibrary03Normal, this.bakedTextureLibrary03Roughness,
            this.bakedTextureLibrary04, this.bakedTextureLibrary04Normal, this.bakedTextureLibrary04Roughness,
            this.bakedTextureLibrary05, this.bakedTextureLibrary05Normal, this.bakedTextureLibrary05Roughness,
            this.bakedTextureLibrary06, this.bakedTextureLibrary06Normal, this.bakedTextureLibrary06Roughness,
            this.bakedTextureLibrary07, this.bakedTextureLibrary07Normal, this.bakedTextureLibrary07Roughness
        ];
        textures.forEach(tex => {
            tex.flipY = false;
            tex.colorSpace = THREE.SRGBColorSpace;
        });
    }

    // ... Méthode applyBVH identique à RoomBrigitte ...

    loadRoom() {
        return new Promise((resolve) => {
            this.loader.load('3dModels/RoomJCD/JCDRoom02.glb', (gltf) => {
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        if (child.name === 'Cube005') {
                            child.material = new THREE.MeshStandardMaterial({
                                map: this.bakedTextureMurs,
                                roughnessMap: this.bakedTextureMursRoughness
                            });
                        } else if (child.name === 'salleJCD') {
                            child.material = new THREE.MeshStandardMaterial({
                                map: this.bakedTextureRoom,
                                normalMap: this.bakedTextureRoomNormal,
                                roughnessMap: this.bakedTextureRoomRoughness
                            });
                        } else if (child.name === 'ugztdfmdw_LOD0_TIER2_000') {
                            child.material = new THREE.MeshStandardMaterial({
                                map: this.bakedTextureFenetre,
                                normalMap: this.bakedTextureFenetreNormal,
                                roughnessMap: this.bakedTextureFenetreRoughness
                            });
                        } else if (child.name === 'salleJCDToit') {
                            child.material = new THREE.MeshStandardMaterial({
                                map: this.bakedTextureToit,
                                normalMap: this.bakedTextureToitNormal,
                                roughnessMap: this.bakedTextureToitRoughness
                            });
                        }
                    }
                });

                this.applyBVH(gltf);
                gltf.scene.position.copy(this.position);
                this.scene.add(gltf.scene);

                // Gestion des collisions
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

    loadChandeliers() {
        return new Promise((resolve) => {
            this.loader.load('3dModels/RoomJCD/JcdChandeliers.glb', (gltf) => {
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
                                normalMap: this.bakedTextureChandelierNormal,
                                roughnessMap: this.bakedTextureChandelierRoughness,
                                metalnessMap: this.bakedTextureChandelierMetalic
                            });
                        }
                    }
                });

                this.applyBVH(gltf);
                gltf.scene.position.copy(this.position);
                this.scene.add(gltf.scene);

                if (this.experience?.addCollisionObjects) {
                    // ... (identique à loadRoom)
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
            this.loader.load('3dModels/RoomJCD/LibraryJCD02.glb', (gltf) => {
                const textureMap = {
                    'Album03': [this.bakedTextureLibrary01, this.bakedTextureLibrary01Normal, this.bakedTextureLibrary01Roughness],
                    'Album04': [this.bakedTextureLibrary02, this.bakedTextureLibrary02Normal, this.bakedTextureLibrary02Roughness],
                    'VictorianBookcaseSmall001': [this.bakedTextureLibrary03, this.bakedTextureLibrary03Normal, this.bakedTextureLibrary03Roughness],
                    'VictorianBookcaseSmall002': [this.bakedTextureLibrary04, this.bakedTextureLibrary04Normal, this.bakedTextureLibrary04Roughness],
                    'VictorianBookcaseTall001': [this.bakedTextureLibrary05, this.bakedTextureLibrary05Normal, this.bakedTextureLibrary05Roughness],
                    'VictorianBookcaseTall002': [this.bakedTextureLibrary06, this.bakedTextureLibrary06Normal, this.bakedTextureLibrary06Roughness],
                    'VictorianBookcasTall003': [this.bakedTextureLibrary07, this.bakedTextureLibrary07Normal, this.bakedTextureLibrary07Roughness]
                };

                gltf.scene.traverse((child) => {
                    if (child.isMesh && textureMap[child.name]) {
                        const [map, normalMap, roughnessMap] = textureMap[child.name];
                        child.material = new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap });
                    }
                });

                this.applyBVH(gltf);
                gltf.scene.position.copy(this.position);
                this.scene.add(gltf.scene);

                // ... (gestion collisions identique)

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
            this.loader.load('3dModels/RoomJCD/AlbumJCD.glb', (gltf) => {
                this.applyBVH(gltf);
                gltf.scene.position.copy(this.position);
                this.scene.add(gltf.scene);
                // ... (gestion collisions)
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
            this.loader.load('3dModels/RoomJCD/TableauJCD02.glb', (gltf) => {
                gltf.scene.traverse((child) => {
                    if (child.isMesh && /^FaceTableauJCD\d+$/.test(child.name)) {
                        child.userData.originalName = child.name;
                        child.originalMaterial = child.material.clone();
                        child.material.side = THREE.DoubleSide;
                        child.userData.isTableau = true;
                        this.tableaux.push(child);
                    }
                });

                this.applyBVH(gltf);
                gltf.scene.position.set(
                    this.position.x + 0.1,
                    this.position.y,
                    this.position.z
                );
                this.scene.add(gltf.scene);
                // ... (gestion collisions)
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