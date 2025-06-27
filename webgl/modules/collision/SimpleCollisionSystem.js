import * as THREE from 'three';

export default class SimpleCollisionSystem {
    constructor(camera) {
        this.camera = camera;
        this.collisionBoxes = [];
        this.playerSize = new THREE.Vector3(0.5, 1.7, 0.5); // Taille du joueur (plus petite)
        this.raycaster = new THREE.Raycaster();
        this.directions = [
            new THREE.Vector3(1, 0, 0),   // droite
            new THREE.Vector3(-1, 0, 0),  // gauche
            new THREE.Vector3(0, 0, 1),   // avant
            new THREE.Vector3(0, 0, -1),  // arrière
        ];
    }

    // Ajouter des objets de collision spécifiques
    addCollisionObject(object, name = 'unknown') {
        if (!object || !object.isMesh) return;
        
        // Calculer la bounding box
        object.geometry.computeBoundingBox();
        const box = new THREE.Box3().setFromObject(object);
        
        // Vérifier que la box est valide
        const size = box.getSize(new THREE.Vector3());
        if (size.x > 0.01 && size.y > 0.01 && size.z > 0.01) {
            this.collisionBoxes.push({
                box: box,
                mesh: object,
                name: name
            });
        }
    }

    // Vérifier collision avec raycast - plus simple et performant
    checkMovement(position, direction, distance = 0.6) {
        // Positions de test autour du joueur (à hauteur du torse et des pieds)
        const testPositions = [
            position.clone().add(new THREE.Vector3(0, 0, 0)),     // centre
            position.clone().add(new THREE.Vector3(0, -0.8, 0)),  // pieds
            position.clone().add(new THREE.Vector3(0, 0.5, 0)),   // torse
        ];

        for (const testPos of testPositions) {
            this.raycaster.set(testPos, direction.normalize());
            
            // Tester contre tous les objets de collision
            const meshes = this.collisionBoxes.map(col => col.mesh);
            const intersects = this.raycaster.intersectObjects(meshes);
            
            if (intersects.length > 0 && intersects[0].distance < distance) {
                return false; // Collision détectée
            }
        }
        
        return true; // Pas de collision
    }

    // Vérifier les collisions dans toutes les directions
    canMove(newPosition) {
        const currentPosition = this.camera.position.clone();
        const movement = newPosition.clone().sub(currentPosition);
        
        if (movement.length() < 0.001) return true; // Pas de mouvement
        
        const direction = movement.normalize();
        const distance = Math.min(movement.length() + 0.3, 0.8); // Distance de sécurité
        
        return this.checkMovement(currentPosition, direction, distance);
    }

    // Nettoyer le système
    clear() {
        this.collisionBoxes = [];
    }

    // Debug - afficher les bounding boxes
    showDebugBoxes(scene) {
        // Supprimer les anciennes debug boxes
        const existingBoxes = scene.children.filter(child => child.userData.isDebugBox);
        existingBoxes.forEach(box => scene.remove(box));

        // Créer de nouvelles debug boxes
        this.collisionBoxes.forEach((collisionData, index) => {
            const box = collisionData.box;
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            
            box.getSize(size);
            box.getCenter(center);
            
            const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
            const material = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                wireframe: true,
                transparent: true,
                opacity: 0.5
            });
            
            const debugBox = new THREE.Mesh(geometry, material);
            debugBox.position.copy(center);
            debugBox.userData.isDebugBox = true;
            debugBox.userData.name = collisionData.name;
            
            scene.add(debugBox);
        });
    }
}
