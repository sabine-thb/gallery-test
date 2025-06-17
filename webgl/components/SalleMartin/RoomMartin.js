import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';

export default class RoomMartin {
    constructor(scene, onAssetLoaded, experience, x, y, z) {
        this.scene = scene
        this.experience = experience
        this.videos = []
        this.mixers = []
        this.animationActions = []
        this.onAssetLoaded = onAssetLoaded
        this.position = new THREE.Vector3(x, y, z)
        this.tableaux = []
        this.bvhHelpers = []; // Stocker les helpers BVH
    this.showBVHHelpers = experience?.debugMode || false; // Active les helpers si le debug est activé

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
        await this.loadPaintings();
        await this.loadAnimatedMartin();
    }

    createBVHHelper(mesh) {
        if (!this.showBVHHelpers || !mesh.geometry?.boundsTree) return null;
        
        const boundingBox = mesh.geometry.boundsTree.getBoundingBox(new THREE.Box3());
        if (!boundingBox) return null; 

        const helper = new THREE.Box3Helper(
            boundingBox,
            new THREE.Color(0xffff00)
        );
        helper.visible = true;
        helper.matrixAutoUpdate = false;
        helper.matrix.copy(mesh.matrixWorld);
        return helper;
    }

    loadTextures() {
        this.bakedTexture = this.textureLoader.load('textures/RoomMartin/CuivreBake/RaelCuivreBaseColor.jpg')
        this.bakedTextureNormal = this.textureLoader.load('textures/RoomMartin/CuivreBake/RaelCuivreNormal.jpg')
        this.bakedTextureRougness = this.textureLoader.load('textures/RoomMartin/CuivreBake/RaelCuivreRougness.jpg')
        this.bakedTexture2 = this.textureLoader.load('textures/RoomMartin/CuivreBake/RaelCuivreBaseColor.jpg')
        this.bakedTexture2Normal = this.textureLoader.load('textures/RoomMartin/CuivreBake/RaelCuivreNormal.jpg')
        this.bakedTexture2Rougness = this.textureLoader.load('textures/RoomMartin/CuivreBake/RaelCuivreRougness.jpg')
        this.bakedTextureRoom = this.textureLoader.load('textures/RoomMartin/RoomMartinBake/MartinRoomBC.png')
        this.bakedTextureRoomNormal = this.textureLoader.load('textures/RoomMartin/RoomMartinBake/MartinRoomNormal.png')
        this.bakedTextureRoomRougness = this.textureLoader.load('textures/RoomMartin/RoomMartinBake/MartinRoomRougness.png')
        this.bakedTexturelamp = this.textureLoader.load('textures/RoomMartin/LampColorBake/LampBake.png')
        this.bakedTextureMiniLamp = this.textureLoader.load('textures/RoomMartin/LampColorBake/LedC100_basecolor.png')
        this.bakedTextureMiniLampRougness = this.textureLoader.load('textures/RoomMartin/LampColorBake/LedC100_roughness.png')
        this.bakedTextureMiniLampEmissive = this.textureLoader.load('textures/RoomMartin/LampColorBake/LedC100_emissive.png')
        this.bakedTextureHublot = this.textureLoader.load('textures/RoomMartin/HublotBake/goldBC.png')
        this.bakedTextureHublotNormal = this.textureLoader.load('textures/RoomMartin/HublotBake/GoldNormal.png')
        this.bakedTextureHublotRougness = this.textureLoader.load('textures/RoomMartin/HublotBake/GoldRougness.png')
        this.bakedTextureBoulon = this.textureLoader.load('textures/RoomMartin/CuivreBake/BoulonBC.png')
        this.bakedTextureBoulonNormal = this.textureLoader.load('textures/RoomMartin/CuivreBake/BoulonNormal.png')
        this.bakedTextureBoulonRougness = this.textureLoader.load('textures/RoomMartin/CuivreBake/BoulonRougness.png')
        this.bakedTexturePresentoir = this.textureLoader.load('textures/RoomMartin/RoomMartinBake/Cubesol.png')

        const textures = [
            this.bakedTexture, this.bakedTextureNormal, this.bakedTextureRougness,
            this.bakedTexture2, this.bakedTexture2Normal, this.bakedTexture2Rougness,
            this.bakedTextureRoom, this.bakedTextureRoomNormal, this.bakedTextureRoomRougness,
            this.bakedTexturePresentoir, this.bakedTexturelamp, this.bakedTextureMiniLamp,
            this.bakedTextureMiniLampRougness, this.bakedTextureMiniLampEmissive,
            this.bakedTextureHublot, this.bakedTextureHublotNormal, this.bakedTextureHublotRougness,
            this.bakedTextureBoulon, this.bakedTextureBoulonNormal, this.bakedTextureBoulonRougness
        ]

        textures.forEach(tex => {
            tex.flipY = false
            tex.colorSpace = THREE.SRGBColorSpace
        })
    }

    toggleBVHHelpers(visible) {
        this.showBVHHelpers = visible;
        this.bvhHelpers.forEach(helper => {
            helper.visible = visible;
        });
    }

    applyBVH(gltf) {
        gltf.scene.traverse((child) => {
            if (child.isMesh && child.geometry?.isBufferGeometry) {
                if (!child.geometry.boundsTree) {
                    try {
                        child.geometry.computeBoundsTree();
                        child.raycast = acceleratedRaycast;
                    
                        const helper = this.createBVHHelper(child);
                        if (helper) {
                            this.scene.add(helper);
                            this.bvhHelpers.push(helper);
                        }
                    } catch (error) {
                        console.error("BVH computation failed for", child.name, error);
                    }
                }
            }
        });
    }

    loadRoom() {
        return new Promise((resolve) => {
        this.loader.load('3dModels/RoomMartin/MartinRoom05.glb', (gltf) => {
            const archeTextures = {
                group1: ['arche01005', 'arche01007', 'arche01001'],
                group2: ['arche01006', 'arche01008', 'arche01002'],
            };
            const excludedBoulons = new Set([
                'Boulon01.070', 'Boulon01.071', 'Boulon01.072',
                'Boulon01.073', 'Boulon01.074'
            ]);
            const foundArches = new Set();

            if (!gltf.scene) return;

            gltf.scene.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    if (archeTextures.group1.includes(child.name)) {
                        child.material = new THREE.MeshStandardMaterial({
                            map: this.bakedTexture,
                            normalMap: this.bakedTextureNormal,
                            roughnessMap: this.bakedTextureRougness,
                            metalness: 0,
                            roughness: 0,
                        });
                        foundArches.add(child.name);
                    } else if (archeTextures.group2.includes(child.name)) {
                        child.material = new THREE.MeshStandardMaterial({
                            map: this.bakedTexture2,
                            normalMap: this.bakedTexture2Normal,
                            roughnessMap: this.bakedTexture2Rougness,
                            metalness: 0,
                            roughness: 0,
                        });
                        foundArches.add(child.name);
                    }

                    if (child.name === 'room') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: this.bakedTextureRoom,
                            normalMap: this.bakedTextureRoomNormal,
                            roughnessMap: this.bakedTextureRoomRougness
                        });
                    }

                    if (child.name === 'thecube') {
                        child.material = new THREE.MeshPhysicalMaterial({
                            color: 0xafffff,
                            roughness: 0,
                            metalness: 0,
                            ior: 1.517,
                            thickness: 0.5,
                            transparent: true,
                            opacity: 0.5,
                            depthWrite: false
                        });
                    }

                    if (child.name === 'Eau') {
                        child.material = new THREE.MeshPhysicalMaterial({
                            color: 0xffffff,
                            roughness: 0.05,
                            metalness: 0,
                            ior: 1.33,
                            transparent: true,
                            opacity: 0.3,
                            clearcoat: 1,
                            clearcoatRoughness: 0,
                            side: THREE.DoubleSide
                        });
                    }

                    if (child.name === 'lamp') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: this.bakedTextureMiniLamp,
                            roughnessMap: this.bakedTextureMiniLampRougness,
                            emissiveMap: this.bakedTextureMiniLampEmissive,
                            emissive: new THREE.Color(0xffffff),
                            emissiveIntensity: 5.5
                        });
                    }

                    if (child.name === 'Cylinder') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: this.bakedTextureHublot,
                            normalMap: this.bakedTextureHublotNormal,
                            roughnessMap: this.bakedTextureHublotRougness
                        });
                    }

                    if (child.isMesh && child.name.includes('Boulon') && !excludedBoulons.has(child.name)) {
                        child.material = new THREE.MeshStandardMaterial({
                            map: this.bakedTextureBoulon,
                            normalMap: this.bakedTextureBoulonNormal,
                            roughnessMap: this.bakedTextureBoulonRougness
                        });
                    }

                    if (child.name === 'light' || child.name === 'light002') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: this.bakedTexturelamp,
                            emissive: new THREE.Color(0xffffff),
                            emissiveIntensity: 5.5,
                            emissiveMap: this.bakedTexturelamp
                        });
                    }

                    if (child.name === 'Cube010') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: this.bakedTexturePresentoir
                        });
                    }

                    if (child.name === 'Water001') {
                        const video = document.createElement('video');
                        video.src = 'textures/RoomMartin/VideoMartin/MovingWater.mp4';
                        video.loop = true;
                        video.muted = true;
                        video.autoplay = true;
                        video.playsInline = true;
                        video.setAttribute('webkit-playsinline', '');
                        video.setAttribute('playsinline', '');

                        const videoTexture = new THREE.VideoTexture(video);
                        videoTexture.colorSpace = THREE.SRGBColorSpace;
                        videoTexture.minFilter = THREE.LinearFilter;
                        videoTexture.magFilter = THREE.LinearFilter;

                        child.material = new THREE.MeshPhysicalMaterial({
                            map: videoTexture,
                            transparent: true,
                            opacity: 1.0,
                            metalness: 0.1,
                            roughness: 0.05,
                            ior: 9.33,
                            side: THREE.DoubleSide,
                            depthWrite: false
                        });

                        video.play().catch(() => {
                            document.addEventListener('click', () => video.play(), { once: true });
                        });

                        this.videos.push(video);
                    }
                }
            });
            this.applyBVH(gltf)

            if (this.showBVHHelpers) {
                this.toggleBVHHelpers(true);
            }

            gltf.scene.position.set(150, -19.74, 50);
            this.scene.add(gltf.scene);

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
        this.loader.load('3dModels/RoomMartin/TableauMartin04.glb', (gltf) => {
            gltf.scene.position.set(150, -19.75, 31.47);
            this.applyBVH(gltf)
            this.scene.add(gltf.scene);

            gltf.scene.traverse((child) => {
                if (child.isMesh && /^FaceTableauMartin\d+$/.test(child.name)) {
                    child.userData.originalName = child.name;
                    child.originalMaterial = child.material.clone();
                    child.material.side = THREE.DoubleSide;
                    child.castShadow = child.receiveShadow = true;
                    child.userData.isTableau = true;
                    this.tableaux.push(child);
                    //console.log("Tableau Martin ajouté:", child.name);
                }
            });

            this.applyBVH(gltf);

            if (this.showBVHHelpers) {
                this.toggleBVHHelpers(true);
            }

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

    loadAnimatedMartin() {
        return new Promise((resolve) => {
        this.loader.load('3dModels/RoomMartin/testemartin3.glb', (gltf) => {
            gltf.scene.position.set(150.5, -19.95, 50);

            const video = document.createElement('video');
            video.src = 'textures/RoomMartin/VideoMartin/PeintureAnimationMartin2.mp4';
            video.loop = true;
            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;
            video.setAttribute('webkit-playsinline', '');
            video.setAttribute('playsinline', '');

            const videoTexture = new THREE.VideoTexture(video);
            videoTexture.colorSpace = THREE.SRGBColorSpace;
            videoTexture.minFilter = THREE.LinearFilter;
            videoTexture.magFilter = THREE.LinearFilter;
            videoTexture.flipY = false;

            gltf.scene.traverse((child) => {
                if (child.isMesh && child.geometry && child.name === 'Cube001_1') {
                    child.material = new THREE.MeshStandardMaterial({
                        map: videoTexture,
                        transparent: true,
                        side: THREE.DoubleSide
                    });
                }
            });

            if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(gltf.scene);
                this.mixers.push(mixer);

                gltf.animations.forEach((clip) => {
                    if (
                        clip.name.includes('Humano_Anim_053-2187-ST3_01_LOD0-Skel|Humano_Anim_053-2187-.002') ||
                        clip.name.includes('Humano_Anim_053-2187-ST3_01_LOD0-Skel|Humano_Anim_053-2187-ST3_')
                    ) {
                        return;
                    }
                    const action = mixer.clipAction(clip);
                    this.animationActions.push(action);
                });
            }
            this.applyBVH(gltf)
            this.scene.add(gltf.scene);

            if (this.showBVHHelpers) {
                this.toggleBVHHelpers(true);
            }

            if (this.experience?.addCollisionObjects) {
                const collisionMeshes = [];
                gltf.scene.traverse(child => {
                    if (child.isMesh) collisionMeshes.push(child);
                });
                this.experience.addCollisionObjects(collisionMeshes);
            }

            this.videos.push(video);
            resolve();
            this.onAssetLoaded();
        });
      });
    }

    startMartinAnimation() {
        this.videos.forEach((video) => video.play());
        this.animationActions.forEach((action) => {
            action.reset();
            action.setLoop(THREE.LoopRepeat);
            action.play();
        });
    }

    update(delta) {
        this.mixers.forEach((mixer) => mixer.update(delta));
        
        this.bvhHelpers.forEach(helper => {
            // Mettre à jour la position des helpers
            helper.updateMatrixWorld(true);
        });
    }
}
