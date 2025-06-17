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
        
        // Initialiser DRACOLoader
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        this.loader.setDRACOLoader(dracoLoader);
        
        this.loadModel();
    }

    loadModel() {
        this.loader.load('3dModels/Couloir/CouloirMusee.glb', (gltf) => {
            gltf.scene.position.copy(this.position);
            this.scene.add(gltf.scene);
            
            // Ajouter les meshes aux collisions
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