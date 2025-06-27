import * as THREE from 'three';

export default class CollisionSystem {
    constructor(camera, experience) {
        this.camera = camera;
        this.experience = experience;
        this.collisionBoxes = []; // Stockage des Box3
        
        // Configuration AABB
        this.playerBox = new THREE.Box3();
        this.playerSize = new THREE.Vector3(0.6, 1.6, 0.6); // Réduit pour être moins sensible aux collisions
        
        // Cache temporel
        this.lastCheckTime = 0;
        this.checkInterval = 200; // Moins fréquent pour être moins agressif
        this.lastValidPosition = new THREE.Vector3();
        this.hasValidPosition = false;
        
        console.log("Système de collision AABB initialisé");
    }

    addCollisionMesh(object) {
        // Forcer la mise à jour de toute la hiérarchie PLUSIEURS FOIS pour s'assurer que les transformations sont appliquées
        object.updateMatrixWorld(true);
        object.updateWorldMatrix(true, true);
        
        // Attendre un frame pour s'assurer que toutes les transformations sont appliquées
        setTimeout(() => {
            object.updateMatrixWorld(true);
            object.updateWorldMatrix(true, true);
            
            // Parcourir récursivement tous les objets enfants
            object.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    // Forcer la mise à jour de la matrice monde de l'enfant
                    child.updateMatrixWorld(true);
                    child.updateWorldMatrix(true, true);
                    
                    // Calculer la bounding box locale
                    child.geometry.computeBoundingBox();
                    const localBox = child.geometry.boundingBox;
                    
                    if (localBox && localBox.min && localBox.max) {
                        // Utiliser la méthode Three.js qui prend en compte les transformations
                        const worldBox = new THREE.Box3().setFromObject(child);
                        
                        // Vérifier que la box est valide
                        const size = worldBox.getSize(new THREE.Vector3());
                        if (size.x > 0.01 && size.y > 0.01 && size.z > 0.01) {
                            // Stocker la bounding box
                            this.collisionBoxes.push({
                                box: worldBox,
                                mesh: child,
                                name: child.name || child.parent?.name || 'unnamed',
                                originalObject: object
                            });
                            
                            const center = worldBox.getCenter(new THREE.Vector3());
                            console.log(`✅ Collision ajoutée: ${child.name || child.parent?.name}`, {
                                center: center,
                                size: size,
                                min: worldBox.min,
                                max: worldBox.max,
                                childPosition: child.position,
                                childWorldPosition: child.getWorldPosition(new THREE.Vector3()),
                                parentPosition: object.position
                            });
                        } else {
                            console.warn(`⚠️ Box trop petite ignorée: ${child.name}`, size);
                        }
                    } else {
                        console.warn(`⚠️ Pas de bounding box pour: ${child.name}`);
                    }
                }
            });
        }, 100); // Attendre 100ms pour s'assurer que les transformations sont appliquées
    }

    addCollisionMeshes(meshes) {
        console.log(`🔧 Ajout de ${meshes.length} meshes aux collisions`);
        meshes.forEach((mesh, index) => {
            console.log(`Mesh ${index}: ${mesh.name || 'unnamed'}, type: ${mesh.type}`);
            this.addCollisionMesh(mesh);
        });
        console.log(`✅ Total bounding boxes: ${this.collisionBoxes.length}`);
    }

    // Met à jour la bounding box du joueur
    updatePlayerBox(position) {
        this.playerBox.setFromCenterAndSize(position, this.playerSize);
    }

    // Vérifie les collisions AABB
    checkCollision(currentPosition, moveDirection) {
        const currentTime = performance.now();
        
        // Cache temporel - réduire la fréquence pour les performances
        if (currentTime - this.lastCheckTime < this.checkInterval) {
            return false;
        }
        this.lastCheckTime = currentTime;
        
        if (this.collisionBoxes.length === 0) {
            // Pas de collisions chargées, position libre
            this.lastValidPosition.copy(currentPosition);
            this.hasValidPosition = true;
            return false;
        }

        // Mettre à jour la box du joueur
        this.updatePlayerBox(currentPosition);
        
        // DEBUG: Afficher les infos de collision périodiquement
        if (currentTime % 1000 < 200) { // Toutes les secondes environ
            console.log(`🔍 Position joueur: (${currentPosition.x.toFixed(2)}, ${currentPosition.y.toFixed(2)}, ${currentPosition.z.toFixed(2)})`);
            console.log(`📊 Collision boxes actives: ${this.collisionBoxes.length}`);
            
            // Afficher les 3 objets les plus proches
            const distances = this.collisionBoxes.map(collisionData => {
                const center = collisionData.box.getCenter(new THREE.Vector3());
                const distance = currentPosition.distanceTo(center);
                return {
                    name: collisionData.name,
                    distance: distance,
                    center: center
                };
            }).sort((a, b) => a.distance - b.distance).slice(0, 3);
            
            console.log("🎯 3 objets les plus proches:");
            distances.forEach((obj, i) => {
                console.log(`   ${i+1}. ${obj.name}: ${obj.distance.toFixed(2)}m - center(${obj.center.x.toFixed(2)}, ${obj.center.y.toFixed(2)}, ${obj.center.z.toFixed(2)})`);
            });
        }
        
        // Vérifier les intersections avec toutes les bounding boxes
        let collisionFound = false;
        let collisionDetails = [];
        
        for (let i = 0; i < this.collisionBoxes.length; i++) {
            const collisionData = this.collisionBoxes[i];
            const collisionBox = collisionData.box;
            
            if (this.playerBox.intersectsBox(collisionBox)) {
                const collisionCenter = collisionBox.getCenter(new THREE.Vector3());
                const collisionSize = collisionBox.getSize(new THREE.Vector3());
                
                // Filtrer les collisions avec des objets trop grands (probablement la salle entière)
                if (collisionSize.x > 100 || collisionSize.y > 100 || collisionSize.z > 100) {
                    console.log(`⚠️ Collision ignorée (objet trop grand): ${collisionData.name} - taille:`, collisionSize);
                    continue; // Ignorer cette collision
                }
                
                // Filtrer les collisions avec des objets au niveau du sol (plancher)
                if (collisionCenter.y < currentPosition.y - 1.5) {
                    console.log(`⚠️ Collision ignorée (plancher): ${collisionData.name} - Y:${collisionCenter.y.toFixed(2)}`);
                    continue; // Ignorer cette collision
                }
                
                // Filtrer les objets de décoration qui ne devraient pas bloquer le mouvement
                if (collisionData.name === 'MuseTout' || 
                    collisionData.name.includes('lamp') ||
                    collisionData.name.includes('Lamp') ||
                    collisionData.name.includes('eclairage') ||
                    collisionData.name.includes('light')) {
                    console.log(`⚠️ Collision ignorée (décoration): ${collisionData.name}`);
                    continue; // Ignorer cette collision
                }
                
                collisionDetails.push({
                    name: collisionData.name,
                    center: collisionCenter,
                    size: collisionSize
                });
                
                collisionFound = true;
            }
        }
        
        if (collisionFound) {
            console.log(`🔥 ${collisionDetails.length} COLLISION(S) DÉTECTÉE(S):`);
            collisionDetails.forEach(detail => {
                console.log(`   - ${detail.name}: center(${detail.center.x.toFixed(2)}, ${detail.center.y.toFixed(2)}, ${detail.center.z.toFixed(2)}) size(${detail.size.x.toFixed(2)}, ${detail.size.y.toFixed(2)}, ${detail.size.z.toFixed(2)})`);
            });
            
            // Si on a une position valide précédente, y retourner
            if (this.hasValidPosition) {
                console.log("↩️ Retour à la position précédente:", this.lastValidPosition.toArray());
                this.camera.position.copy(this.lastValidPosition);
                return true;
            } else {
                // Première collision - ne pas bloquer, juste sauvegarder la position actuelle comme valide
                console.log("⚠️ Première collision - accepter la position comme valide pour le moment");
                this.lastValidPosition.copy(currentPosition);
                this.hasValidPosition = true;
                return false; // Ne pas bloquer le mouvement
            }
        } else {
            // Position valide, la sauvegarder
            this.lastValidPosition.copy(currentPosition);
            this.hasValidPosition = true;
            
            // Log plus discret pour les positions valides
            if (currentTime % 2000 < 100) { // Toutes les 2 secondes environ
                console.log("✅ Position valide");
            }
        }
        
        return false;
    }

    // Trouve une position valide sans collision
    findValidPosition(targetPosition) {
        this.updatePlayerBox(targetPosition);
        
        // Vérifier si la position cible est valide
        for (const collisionData of this.collisionBoxes) {
            if (this.playerBox.intersectsBox(collisionData.box)) {
                return null; // Position invalide
            }
        }
        
        return targetPosition; // Position valide
    }

    // Debug : affiche les bounding boxes (optimisé)
    showDebugBoxes(scene) {
        // Forcer la mise à jour des debug boxes à chaque appel
        // Supprimer les anciens debug boxes
        const existingBoxes = scene.children.filter(child => child.userData.isDebugBox);
        existingBoxes.forEach(box => scene.remove(box));

        console.log(`🎯 Affichage de ${this.collisionBoxes.length} bounding boxes de debug`);

        // Afficher les bounding boxes des objets de collision
        this.collisionBoxes.forEach((collisionData, index) => {
            const box = collisionData.box;
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            
            box.getSize(size);
            box.getCenter(center);
            
            // Éviter les boxes trop petites ou invalides
            if (size.x < 0.01 || size.y < 0.01 || size.z < 0.01) {
                console.warn(`Box trop petite ignorée: ${collisionData.name}`, size);
                return;
            }
            
            const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
            const material = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                wireframe: true,
                transparent: true,
                opacity: 0.6 // Plus visible
            });
            
            const debugBox = new THREE.Mesh(geometry, material);
            debugBox.position.copy(center);
            debugBox.userData.isDebugBox = true;
            debugBox.userData.isCollisionBox = true;
            debugBox.userData.name = collisionData.name;
            
            scene.add(debugBox);
            
            console.log(`📦 Debug box ${index}: ${collisionData.name}`, {
                center: center.toArray(),
                size: size.toArray()
            });
        });

        // Afficher la bounding box du joueur
        const playerGeometry = new THREE.BoxGeometry(this.playerSize.x, this.playerSize.y, this.playerSize.z);
        const playerMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.8 // Plus visible
        });
        
        const playerDebugBox = new THREE.Mesh(playerGeometry, playerMaterial);
        playerDebugBox.position.copy(this.camera.position);
        playerDebugBox.userData.isDebugBox = true;
        playerDebugBox.userData.isPlayer = true;
        
        scene.add(playerDebugBox);
        
        console.log(`👤 Player debug box ajoutée à la position:`, this.camera.position.toArray());
        
        this.debugBoxesNeedUpdate = false;
    }

    clear() {
        this.collisionBoxes = [];
        this.lastCheckTime = 0;
        this.lastValidPosition.set(0, 0, 0);
        this.hasValidPosition = false;
        console.log("Système de collision AABB nettoyé");
    }
}
