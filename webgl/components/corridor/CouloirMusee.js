import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

export default class CouloirMusee {
    constructor(scene, onAssetLoaded, experience, x, y, z) {
        this.scene = scene;
        this.experience = experience;
        this.onAssetLoaded = onAssetLoaded;
        this.position = new THREE.Vector3(x, y, z);
        this.video = null;
        
        this.loader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        this.loader.setDRACOLoader(dracoLoader);
        
        this.loadModel();
    }

    loadTextures() {
        const textureAccueil = this.textureLoader.load('/textures/Couloir/AcceuilBC.png');
        const textureCouloirs = this.textureLoader.load('/textures/Couloir/CouloirsBC.png');
        const textureLamps = this.textureLoader.load('/textures/Couloir/CouloirsLampsBC.png');
        const textureLampAccueil = this.textureLoader.load('/textures/Couloir/LampAcceuilBC.png');

        const textures = [
            textureAccueil,
            textureCouloirs,
            textureLamps,
            textureLampAccueil
        ];

        textures.forEach(tex => {
            tex.flipY = false;
            tex.colorSpace = THREE.SRGBColorSpace;
        });

        return {
            textureAccueil,
            textureCouloirs,
            textureLamps,
            textureLampAccueil
        };
    }

    loadModel() {
        this.loader.load('/3dModels/Couloir/CouloirMusee05.glb', (gltf) => {
            gltf.scene.position.copy(this.position);
            this.scene.add(gltf.scene);
            
            const textures = this.loadTextures();
            
            gltf.scene.traverse((child) => {
                if (!child.isMesh) return;
                
                if (child.name === 'MuseTout') {
                    child.material = new THREE.MeshStandardMaterial({ 
                        map: textures.textureAccueil 
                    });
                }

                if (['CouloirD', 'CouloirG', 'CouloirM'].includes(child.name)) {
                    child.material = new THREE.MeshStandardMaterial({ 
                        map: textures.textureCouloirs 
                    });
                }

                if (['eclairageM', 'eclairageD', 'eclairageG'].includes(child.name)) {
                    child.material = new THREE.MeshStandardMaterial({ 
                        map: textures.textureLamps,
                        emissive: 0xffffff,
                        emissiveIntensity: 5.5,
                    });
                }

                if (child.name === 'LampAcceuil01') {
                    child.material = new THREE.MeshStandardMaterial({ 
                        map: textures.textureLampAccueil,
                        emissive: 0xffffff,
                        emissiveIntensity: 5.5,
                    });
                }
            });
            
            // Créer un écran de projection personnalisé
            this.createProjectionScreen();
            
            if (this.experience?.addCollisionObjects) {
                const collisionMeshes = [];
                gltf.scene.traverse(child => {
                    if (child.isMesh) collisionMeshes.push(child);
                });
                this.experience.addCollisionObjects(collisionMeshes);
            }

            this.onAssetLoaded();
        }, undefined, (error) => {
            console.error('Erreur chargement CouloirMusee:', error);
            console.error('Type d\'erreur:', error.constructor.name);
            console.error('Message d\'erreur:', error.message);
            if (error.target && error.target.responseText) {
                console.error('Réponse du serveur:', error.target.responseText.substring(0, 200));
            }
            this.onAssetLoaded();
        });
    }

    setupProjectionScreen(screenMesh) {
        this.video = document.createElement('video');
        this.video.src = '/video/teaser-sentiers.mp4';
        this.video.loop = true;
        this.video.muted = false;
        this.video.volume = 1.0;
        this.video.autoplay = false;
        this.video.playsInline = true;
        this.video.setAttribute('webkit-playsinline', '');
        this.video.setAttribute('playsinline', '');

        const videoTexture = new THREE.VideoTexture(this.video);
        videoTexture.colorSpace = THREE.SRGBColorSpace;
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.flipY = false;

        // Pas de répétition + cadrage exact
        videoTexture.wrapS = THREE.ClampToEdgeWrapping;
        videoTexture.wrapT = THREE.ClampToEdgeWrapping;
        videoTexture.repeat.set(1, 1);
        videoTexture.offset.set(0, 0);

        // Rotation de 90 degrés
        videoTexture.center.set(0.5, 0.5);
        videoTexture.rotation = Math.PI / 2; // 90 degrés en radians

        // Appliquer uniquement sur la face visible (avant)
        screenMesh.material = new THREE.MeshStandardMaterial({
            map: videoTexture,
            emissive: new THREE.Color(0x222222),
            emissiveIntensity: 0.1,
            side: THREE.FrontSide
        });

        if (this.experience && this.experience.registerProjectionVideo) {
            this.experience.registerProjectionVideo(this.video);
        }
   }

    createProjectionScreen() {
        // Créer la géométrie du plan avec des dimensions un peu plus grandes
        const planeGeometry = new THREE.PlaneGeometry(6.7, 4.7); // Largeur: 6, Hauteur: 4 (un peu plus grand)
        
        // Créer la vidéo
        this.video = document.createElement('video');
        this.video.src = '/video/teaser-sentiers.mp4';
        this.video.loop = true;
        this.video.muted = false;
        this.video.volume = 1.0;
        this.video.autoplay = false;
        this.video.playsInline = true;
        this.video.setAttribute('webkit-playsinline', '');
        this.video.setAttribute('playsinline', '');

        const videoTexture = new THREE.VideoTexture(this.video);
        videoTexture.colorSpace = THREE.SRGBColorSpace;
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.flipY = false;

        videoTexture.wrapS = THREE.ClampToEdgeWrapping;
        videoTexture.wrapT = THREE.ClampToEdgeWrapping;
        videoTexture.repeat.set(-1, 1); // Inverser horizontalement pour corriger l'effet miroir
        videoTexture.offset.set(0, 0);

        // Rotation de 180 degrés pour la vidéo
        videoTexture.center.set(0.5, 0.5);
        videoTexture.rotation = Math.PI; // 180° rotation complète

        // Matériau avec vidéo, uniquement sur le front
        const screenMaterial = new THREE.MeshStandardMaterial({
            map: videoTexture,
            emissive: new THREE.Color(0x222222),
            emissiveIntensity: 0.1,
            side: THREE.FrontSide
        });

        // Créer le mesh et le positionner à la position de spawn de la caméra
        const screenMesh = new THREE.Mesh(planeGeometry, screenMaterial);
        // Placer le plan à une distance confortable devant la position de spawn de la caméra
        screenMesh.position.set(42.6, 2.5, -5); // 7 unités devant la caméra pour voir le plan entier
        
        // Orienter le plan avec une rotation de 90° sur l'axe Y
        screenMesh.rotation.y = -Math.PI / 2; // Rotation de 90° autour de l'axe Y
        
        // Ajouter à la scène
        this.scene.add(screenMesh);
        
        console.log('Plane geometry créé à la position de spawn:', screenMesh.position);
        console.log('Dimensions du plan:', planeGeometry.parameters);

        // Ajouter l'audio spatialisé pour la vidéo
        this.setupVideoAudio(screenMesh);

        if (this.experience && this.experience.registerProjectionVideo) {
            this.experience.registerProjectionVideo(this.video);
        }
    }

    setupVideoAudio(screenMesh) {
        if (!this.experience || !this.experience.listener) {
            console.warn('Listener audio non disponible pour la vidéo');
            return;
        }

        // Créer une sphère invisible pour l'audio positionnel
        const audioGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const audioMaterial = new THREE.MeshBasicMaterial({ 
            transparent: true, 
            opacity: 0 
        });
        
        this.audioSphere = new THREE.Mesh(audioGeometry, audioMaterial);
        this.audioSphere.position.copy(screenMesh.position);
        this.scene.add(this.audioSphere);

        // Créer l'audio positionnel
        this.videoAudio = new THREE.PositionalAudio(this.experience.listener);
        this.audioSphere.add(this.videoAudio);
        
        // Configurer l'audio positionnel
        this.videoAudio.setMediaElementSource(this.video);
        this.videoAudio.setRefDistance(3); // Distance de référence réduite pour entendre moins loin
        this.videoAudio.setMaxDistance(8); // Distance maximale réduite
        this.videoAudio.setDistanceModel('exponential');
        this.videoAudio.setVolume(0.005); // Volume très réduit pour la vidéo

        console.log('Audio spatialisé configuré pour la vidéo du couloir');
    }

    muteVideo() {
        if (this.video) this.video.muted = true;
        if (this.videoAudio) this.videoAudio.setVolume(0);
    }

    unmuteVideo() {
        if (this.video) this.video.muted = false;
        if (this.videoAudio) this.videoAudio.setVolume(0.005); // Volume très réduit pour la vidéo
    }
}
