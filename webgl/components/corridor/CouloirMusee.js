import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

export default class CouloirMusee {
    constructor(scene, onAssetLoaded, experience, x, y, z) {
        this.scene = scene;
        this.experience = experience;
        this.onAssetLoaded = onAssetLoaded;
        this.position = new THREE.Vector3(x, y, z);
        this.video = null; // Stockage de la vidéo
        
        this.loader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        
        // Initialiser DRACOLoader
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        this.loader.setDRACOLoader(dracoLoader);
        
        this.loadModel();
    }

    loadTextures() {
        // Chargement des textures avec les chemins corrects
        const textureAccueil = this.textureLoader.load('/textures/Couloir/AcceuilBC.png');
        const textureCouloirs = this.textureLoader.load('/textures/Couloir/CouloirsBC.png');
        const textureLamps = this.textureLoader.load('/textures/Couloir/CouloirsLampsBC.png');
        const textureLampAccueil = this.textureLoader.load('/textures/Couloir/LampAcceuilBC.png');

        // Liste de toutes les textures pour configuration
        const textures = [
            textureAccueil,
            textureCouloirs,
            textureLamps,
            textureLampAccueil
        ];

        // Configuration commune pour toutes les textures
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
        this.loader.load('3dModels/Couloir/CouloirMusee04.glb', (gltf) => {
            gltf.scene.position.copy(this.position);
            this.scene.add(gltf.scene);
            
            // Charger et configurer les textures
            const textures = this.loadTextures();
            
            // Application des matériaux avec les nouvelles textures
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
                        //emissiveMap: textures.textureLamps
                    });
                }
                
                if (child.name === 'LampAcceuil01') {
                    child.material = new THREE.MeshStandardMaterial({ 
                        map: textures.textureLampAccueil,
                        emissive: 0xffffff,
                        emissiveIntensity: 5.5,
                        //emissiveMap: textures.textureLampAccueil
                    });
                }
                
                // Ajouter la vidéo sur l'écran de projection
                if (child.name === 'ecranprojection') {
                    console.log('Mesh ecranprojection trouvé:', child);
                    console.log('Geometry:', child.geometry);
                    console.log('Material original:', child.material);
                    this.setupProjectionScreen(child);
                }
            });
            
            // Ajouter les objets aux collisions
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
            this.onAssetLoaded();
        });
    }

    setupProjectionScreen(screenMesh) {
        // Créer l'élément vidéo
        this.video = document.createElement('video');
        this.video.src = '/video/teaser-sentiers.mp4';
        this.video.loop = true;
        this.video.muted = false; // Pas muté par défaut
        this.video.volume = 1.0; // Volume maximum (HTML5 max = 1.0)
        this.video.autoplay = false; // Ne pas démarrer automatiquement
        this.video.playsInline = true;
        this.video.setAttribute('webkit-playsinline', '');
        this.video.setAttribute('playsinline', '');

        // Créer la texture vidéo
        const videoTexture = new THREE.VideoTexture(this.video);
        videoTexture.colorSpace = THREE.SRGBColorSpace;
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.flipY = false;
        
        // Pivoter la texture de 90°
        videoTexture.center.set(0.5, 0.5);
        videoTexture.rotation = Math.PI / 2; // 90° en radians
        
        // Configuration pour voir la vidéo entière
        videoTexture.wrapS = THREE.ClampToEdgeWrapping;
        videoTexture.wrapT = THREE.ClampToEdgeWrapping;
        
        // Adapter la vidéo pour qu'elle soit entièrement visible (fit)
        videoTexture.repeat.set(1, 1);
        videoTexture.offset.set(0, 0);

        // Appliquer le matériau avec la vidéo
        screenMesh.material = new THREE.MeshStandardMaterial({
            map: videoTexture,
            emissive: new THREE.Color(0x222222),
            emissiveIntensity: 0.1,
            side: THREE.FrontSide // Afficher seulement sur la face avant
        });

        // Enregistrer cette vidéo auprès de l'experience pour le contrôle du son
        if (this.experience && this.experience.registerProjectionVideo) {
            this.experience.registerProjectionVideo(this.video);
        }
    }

    // Méthodes pour contrôler le son de la vidéo
    muteVideo() {
        if (this.video) {
            this.video.muted = true;
        }
    }

    unmuteVideo() {
        if (this.video) {
            this.video.muted = false;
        }
    }
}