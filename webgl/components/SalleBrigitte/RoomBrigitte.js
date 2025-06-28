import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

export default class RoomBrigitte {
    constructor(scene, onAssetLoaded, experience, x, y, z) {
        this.scene = scene
        this.experience = experience
        this.onAssetLoaded = onAssetLoaded
        this.position = new THREE.Vector3(x, y, z)
        this.tableaux = []

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
        await this.loadArtSupport();
        await this.loadProjectors();
        await this.loadBushes(); 
        await this.loadPaintings();
    }

    loadTextures() {
        this.bakedTextureTree = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/ArbreColor.png');

        this.bakedTextureSocle = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/soclearble.png');

        this.bakedTextureFeuille = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/FeuilleBrancheColor02.png');

        this.bakedTextureFlower = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/Texture2/flowersColor.png');

        this.bakedTexturePlafond = this.textureLoader.load('textures/RoomBrigitte/SalleBrigitteBake/plafonColor.png');

        this.bakedTextureRoom = this.textureLoader.load('textures/RoomBrigitte/SalleBrigitteBake/RoomBColor.png');

        this.bakeTextureGrille = this.textureLoader.load('textures/RoomBrigitte/GrilleBake/GrilleColor.png');

        this.bakeTextureBoisB = this.textureLoader.load('textures/RoomBrigitte/ArbreBake/CadreSolColor.png');

        this.bakeTextureChevalet = this.textureLoader.load('textures/RoomBrigitte/TrespiedBake/trespiedcolor.png');

        const textures = [
            this.bakedTextureRoom,
            this.bakedTextureTree,
            this.bakedTextureSocle,
            this.bakedTextureFeuille,
            this.bakedTextureFlower,
            this.bakedTexturePlafond,
            this.bakeTextureGrille,
            this.bakeTextureBoisB,
            this.bakeTextureChevalet
        ]

        textures.forEach(tex => {
            tex.flipY = false
            tex.colorSpace = THREE.SRGBColorSpace
        })
    }

    loadRoom() {
        return new Promise((resolve) => {
            this.loader.load('/3dModels/RoomBrigitte/BrigitteRoom04.glb', (gltf) => {
                const grilleNames = ['Grille01', 'Grille02', 'Grille03']
                const boisNames = ['Cube001', 'Cube003', 'Cube006']

                gltf.scene.traverse((child) => {
                    if (grilleNames.includes(child.name)) {
                        child.material = new THREE.MeshStandardMaterial({
                            map: this.bakeTextureGrille,
                        })
                    }

                    if (child.name === 'Room_B') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: this.bakedTextureRoom,
                        })
                    }

                    if (child.name === 'Fauxplafon') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: this.bakedTexturePlafond,
                        })
                    }
                })

                gltf.scene.position.copy(this.position);
                this.scene.add(gltf.scene)

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
            });
        });
    }

    loadArtSupport() {
        return new Promise((resolve) => {
            this.loader.load('/3dModels/RoomBrigitte/ArtSupportBrigitte01.glb', (gltf) => {
                const chevaletMaterial = new THREE.MeshStandardMaterial({
                    map: this.bakeTextureChevalet
                });
                
                let easelFound = false;
                gltf.scene.traverse(child => {
                    if (child.isMesh && child.name === "EaselMerged") {
                        child.material = chevaletMaterial;
                        easelFound = true;
                    }
                });
                
                if (!easelFound) {
                    console.warn("L'objet 'EaselMerged' n'a pas été trouvé dans le modèle");
                }
                
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
                console.error('Erreur chargement ArtSupportBrigitte01:', error);
                resolve();
                this.onAssetLoaded();
            });
        });
    }

    loadTree() {
        return new Promise((resolve) => {
            this.loader.load('/3dModels/RoomBrigitte/Arbre03.glb', (gltf) => {

                gltf.scene.traverse((child) => {
                    if (child.name === 'Tree001') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: this.bakedTextureTree
                        })
                    }

                    if (child.name === 'Socle') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: this.bakedTextureSocle
                        })
                    }

                    if (child.name === 'Tree001|Brank|Dupli|') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: this.bakedTextureFeuille
                        })
                    }
                })

                gltf.scene.position.copy(this.position);
                this.scene.add(gltf.scene)

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
            });
        });
    }

    loadProjectors() {
        return new Promise((resolve) => {
            this.loader.load('/3dModels/RoomBrigitte/ProjecteursBrigitte.glb', (gltf) => {
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
                console.error('Erreur chargement ProjecteursBrigitte:', error);
                resolve();
                this.onAssetLoaded();
            });
        });
    }

    loadPaintings() {
        return new Promise((resolve) => {
            this.loader.load('/3dModels/RoomBrigitte/TableauxBrigitte02.glb', (gltf) => {
                //console.log("Début du chargement des tableaux de Brigitte");
                gltf.scene.traverse((child) => {
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

                gltf.scene.position.set(
                    this.position.x - 0.01,
                    this.position.y,
                    this.position.z
                );
                //console.log("Position des tableaux:", gltf.scene.position);
                this.scene.add(gltf.scene)
                //console.log("Tableaux ajoutés à la scène");

                // Ajouter les objets aux collisions
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

    loadBushes() {
        return new Promise((resolve) => {
            this.loader.load('/3dModels/RoomBrigitte/Buisson01.glb', (gltf) => {
                const bushMaterial = new THREE.MeshStandardMaterial({
                    map: this.bakedTextureFlower
                });
                
                gltf.scene.traverse(child => {
                    if (child.isMesh) {
                        child.material = bushMaterial;
                    }
                });
                
                // Positions des buissons
                const bushPositions = [
                    new THREE.Vector3(37.97147369384766, -0.5, -32.72630310058594),
                    new THREE.Vector3(38.29821014404297, -0.5, -31.5873908996582),
                    new THREE.Vector3(37.63019561767578, -0.5, -30.625675201416016),
                    new THREE.Vector3(36.86957550048828, -0.5, -33.12053680419922),
                    new THREE.Vector3(35.79415893554688, -0.5, -32.47785949707031),
                    new THREE.Vector3(35.7814712524414, -0.5, -31.16184997558594),
                    new THREE.Vector3(36.57107543945312, -0.5, -30.52993392944336)
                ];
                
                // Dupliquer et positionner les buissons
                bushPositions.forEach(position => {
                    const bushClone = gltf.scene.clone();
                    bushClone.position.copy(position);
                    this.scene.add(bushClone);
                    
                    // Ajouter chaque buisson aux collisions
                    if (this.experience?.addCollisionObjects) {
                        const collisionMeshes = [];
                        bushClone.traverse(child => {
                            if (child.isMesh) collisionMeshes.push(child);
                        });
                        this.experience.addCollisionObjects(collisionMeshes);
                    }
                });

                resolve();
                this.onAssetLoaded();
            }, undefined, (error) => {
                console.error('Erreur chargement Buisson:', error);
                resolve();
                this.onAssetLoaded();
            });
        });
    }
}
