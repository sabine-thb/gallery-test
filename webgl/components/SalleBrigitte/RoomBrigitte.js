import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';

export default class RoomBrigitte {
    constructor(scene, onAssetLoaded, experience, x, y, z) {
        this.scene = scene
        this.experience = experience
        this.onAssetLoaded = onAssetLoaded
        this.position = new THREE.Vector3(x, y, z)
        this.tableaux = []
        this.bvhHelpers = []
        this.showBVHHelpers = experience?.debugMode || false; // Ajouté

        if (!THREE.BufferGeometry.prototype.computeBoundsTree) {
            THREE.BufferGeometry.prototype.computeBoundsTree = function() {
                this.boundsTree = new MeshBVH(this)
                return this.boundsTree
            }
            THREE.BufferGeometry.prototype.disposeBoundsTree = function() {
                this.boundsTree = null
            }
            THREE.Mesh.prototype.raycast = acceleratedRaycast
        }

        this.loader = new GLTFLoader()
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
        this.loader.setDRACOLoader(dracoLoader)

        this.textureLoader = new THREE.TextureLoader()

        this.loadTextures()
    }

    async init() {
        await this.loadRoom();
        await this.loadTree();
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

    loadTextures() {
        this.bakedTextureTree = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/ArbreColor.png')
        this.bakedTextureTreeRougness = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/Tree.001_Bake1_PBR_Roughness.jpg')

        this.bakedTextureSocle = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/soclearble.png')
        this.bakedTextureSocleNormal = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/socleNormal.png')
        this.bakedTextureSocleRougness = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/SocleRougness.png')

        this.bakedTextureFeuille = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/FeuilleBrancheColor02.png')
        this.bakedTextureFeuilleRougness = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/FeuilleRougness.png')

        this.bakedTextureFlower = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/Texture2/flowersColor.png')
        this.bakedTextureFlowerNormal = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/Texture2/FlowerNormal.png')
        this.bakedTextureFlowerRougness = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/Texture2/FlowerRougness.png')
        this.bakedTextureFlowerMetalic = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/Texture2/FlowerMetalic.png')

        this.bakedTexturePlafond = this.textureLoader.load('textures/RoomBrigitte/SalleBrigitteBake/plafonColor.png')

        this.bakedTextureRoom = this.textureLoader.load('textures/RoomBrigitte/SalleBrigitteBake/RoomBColor.png')
        this.bakedTextureRoomNormal = this.textureLoader.load('textures/RoomBrigitte/SalleBrigitteBake/BrigitteRoomNormal.png')
        this.bakedTextureRoomRoughness = this.textureLoader.load('textures/RoomBrigitte/SalleBrigitteBake/RoomRoughness.png')

        this.bakeTextureGrille = this.textureLoader.load('textures/RoomBrigitte/GrilleBake/GrilleColor.png')
        this.bakeTextureGrilleRougness = this.textureLoader.load('textures/RoomBrigitte/GrilleBake/GrilleRougness.png')

        this.bakeTextureBoisB = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/CadreSolColor.png')
        this.bakeTextureBoisBRougness = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/CadreSolRougness.png')

        this.bakeTextureChevalet = this.textureLoader.load('textures/RoomBrigitte/TrespiedBake/trespiedcolor.png')
        this.bakeTextureChevaletNormal = this.textureLoader.load('textures/RoomBrigitte/TrespiedBake/Wood_Normal.png')
        this.bakeTextureChevaletRoughness = this.textureLoader.load('textures/RoomBrigitte/TrespiedBake/Wood_Roughness.png')

        const textures = [
            this.bakedTextureRoom, this.bakedTextureRoomNormal, this.bakedTextureRoomRoughness,
            this.bakedTextureTree, this.bakedTextureTreeRougness, 
            this.bakedTextureSocle, this.bakedTextureSocleNormal, this.bakedTextureSocleRougness,
            this.bakedTextureFeuille, this.bakedTextureFeuilleRougness,
            this.bakedTextureFlower, this.bakedTextureFlowerNormal, this.bakedTextureFlowerRougness, this.bakedTextureFlowerMetalic,
            this.bakedTexturePlafond,
            this.bakeTextureGrille, this.bakeTextureGrilleRougness, 
            this.bakeTextureBoisB, this.bakeTextureBoisBRougness,
            this.bakeTextureChevalet, this.bakeTextureChevaletNormal, this.bakeTextureChevaletRoughness
        ]

        textures.forEach(tex => {
            tex.flipY = false
            tex.colorSpace = THREE.SRGBColorSpace
        })
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

    loadRoom() {
        return new Promise((resolve) => {
        this.loader.load('3dModels/RoomBrigitte/BrigitteRoom02.glb', (gltf) => {
        const grilleNames = ['Grille01', 'Grille02', 'Grille03']
        const boisNames = ['Cube001', 'Cube003', 'Cube006']

            gltf.scene.traverse((child) => {
                if (grilleNames.includes(child.name)) {
                    child.material = new THREE.MeshStandardMaterial({
                        map: this.bakeTextureGrille,
                        roughnessMap: this.bakeTextureGrilleRougness,
                    })
                }

                if (boisNames.includes(child.name)) {
                    child.material = new THREE.MeshStandardMaterial({
                        map: this.bakeTextureBoisB,
                        roughnessMap: this.bakeTextureBoisBRougness,
                    })
                }

                if (child.name === 'Room_B') {
                    child.material = new THREE.MeshStandardMaterial({
                        map: this.bakedTextureRoom,
                        normalMap: this.bakedTextureRoomNormal,
                        roughnessMap: this.bakedTextureRoomRoughness,
                    })
                }

                if (child.name === 'Fauxplafon') {
                    child.material = new THREE.MeshStandardMaterial({
                        map: this.bakedTexturePlafond,
                    })
                }
            })

            this.applyBVH(gltf);
            gltf.scene.position.copy(this.position);
            this.scene.add(gltf.scene)
        
            if (this.experience?.addCollisionObjects) {
                const collisionMeshes = [];
                gltf.scene.traverse(child => {
                    if (child.isMesh) collisionMeshes.push(child);
                });
                this.experience.addCollisionObjects(collisionMeshes);
            }

            resolve();
            this.onAssetLoaded();
        });
    });
}

    loadTree() {
        return new Promise((resolve) => {
            this.loader.load('3dModels/RoomBrigitte/Arbre02.glb', (gltf) => {
                const fleursTextures = ['Object_12', 'Object_13001', 'Object_13002',
            'Object_5003', 'Object_13004', 'Object_13005', 'Object_13006'
            ];

            gltf.scene.traverse((child) => {
                if (fleursTextures.includes(child.name)) {
                    child.material = new THREE.MeshStandardMaterial({
                        map: this.bakedTextureFlower,
                        normalMap: this.bakedTextureFlowerNormal,
                        roughnessMap: this.bakedTextureFlowerRougness,
                        metalnessMap: this.bakedTextureFlowerMetalic,
                    })
                }

                if (child.name === 'Tree001') {
                    child.material = new THREE.MeshStandardMaterial({
                        map: this.bakedTextureTree,
                        roughnessMap: this.bakedTextureTreeRougness,
                    })
                }

                if (child.name === 'Socle') {
                    child.material = new THREE.MeshStandardMaterial({
                        map: this.bakedTextureSocle,
                        normalMap: this.bakedTextureSocleNormal,
                        roughnessMap: this.bakedTextureSocleRougness,
                    })
                }

                if (child.name === 'Tree001|Brank|Dupli|') {
                    child.material = new THREE.MeshStandardMaterial({
                        map: this.bakedTextureFeuille,
                        roughnessMap: this.bakedTextureFeuilleRougness,
                    })
                }
            })

            this.applyBVH(gltf);
            gltf.scene.position.copy(this.position);
            this.scene.add(gltf.scene)

            if (this.experience?.addCollisionObjects) {
                const collisionMeshes = [];
                gltf.scene.traverse(child => {
                    if (child.isMesh) collisionMeshes.push(child);
                });
                this.experience.addCollisionObjects(collisionMeshes);
            }

            resolve();
            this.onAssetLoaded();
        });
    });
}

    loadPaintings() {
        return new Promise((resolve) => {
            this.loader.load('3dModels/RoomBrigitte/TableauxBrigitte04.glb', (gltf) => {
            //console.log("Début du chargement des tableaux de Brigitte");
            gltf.scene.traverse((child) => {
                //console.log(`Objet traversé: ${child.name} (${child.isMesh ? 'Mesh' : 'Autre'})`);

                if (child.name === 'EaselMerged') {
                    console.log("Chevalet trouvé:", child.name);
                    child.material = new THREE.MeshStandardMaterial({
                        map: this.bakeTextureChevalet,
                        roughnessMap: this.bakeTextureChevaletRoughness,
                    })
                }

                if (child.isMesh && /^FaceTableauBrigitte\d+$/.test(child.name)) {
                    //console.log("TABLEAU TROUVÉ:", child.name);
                    child.userData.originalName = child.name;
                    child.originalMaterial = child.material.clone();
                    child.material.side = THREE.DoubleSide;
                    child.castShadow = child.receiveShadow = true;
                    child.material.forceSinglePass = false;
                    child.userData.isTableau = true;
                    this.tableaux.push(child);
                }
            })

            this.applyBVH(gltf);
            gltf.scene.position.set(
                    this.position.x - 0.01,
                    this.position.y,
                    this.position.z
                );
            //console.log("Position des tableaux:", gltf.scene.position);
            this.scene.add(gltf.scene)
            //console.log("Tableaux ajoutés à la scène");

            if (this.experience?.addCollisionObjects) {
                const collisionMeshes = [];
                gltf.scene.traverse(child => {
                    if (child.isMesh) collisionMeshes.push(child);
                });
                this.experience.addCollisionObjects(collisionMeshes);
            }
            
            //console.log(`Nombre de tableaux collectés: ${this.tableaux.length}`);
            resolve();
            this.onAssetLoaded();
        }, undefined, (error) => {
                console.error("Erreur chargement tableaux Brigitte:", error);
                resolve();
                this.onAssetLoaded();
            });
        });
    }
}
