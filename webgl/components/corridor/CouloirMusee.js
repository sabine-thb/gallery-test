import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

export default class CouloirMusee {
    constructor(scene, onAssetLoaded, experience, x, y, z) {
        this.scene = scene;
        this.experience = experience;
        this.onAssetLoaded = onAssetLoaded;
        this.position = new THREE.Vector3(x, y, z);
        
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
}