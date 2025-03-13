import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

export default class Controls {
    constructor(camera, domElement, experience) {
        this.experience = experience;
        this.instance = new PointerLockControls(camera, domElement);

        // Définir la hauteur initiale de la caméra
        camera.position.y = 1.7;

        this.moveSpeed = 0.08;
        this.velocity = new THREE.Vector3();
        this.lastTime = performance.now();

        // États de mouvement
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        // Lier les méthodes
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.instance.pointerSpeed = 0.8;

        // Supprimez la nécessité d'un clic
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);

        // Désactiver le comportement automatique lié au pointer lock
        document.addEventListener('pointerlockchange', () => {
            console.log('Pointer lock ignoré.');
        });
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
            case 'KeyZ':
                this.moveForward = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
            case 'KeyQ':
                this.moveLeft = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
            case 'KeyZ':
                this.moveForward = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
            case 'KeyQ':
                this.moveLeft = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }

    update() {
        const time = performance.now();
        const delta = (time - this.lastTime) / 1000;
    
        // Obtenir la direction de la caméra
        const camera = this.instance.getObject();
    
        // Réinitialiser la vélocité
        this.velocity.set(0, 0, 0);
    
        // Ajouter les mouvements avant et arrière
        if (this.moveForward) {
            const moveDirection = new THREE.Vector3();
            camera.getWorldDirection(moveDirection);
            moveDirection.y = 0; // S'assurer que le mouvement est horizontal
            moveDirection.normalize();
            this.velocity.add(moveDirection.multiplyScalar(this.moveSpeed));
        }
        if (this.moveBackward) {
            const moveDirection = new THREE.Vector3();
            camera.getWorldDirection(moveDirection);
            moveDirection.y = 0; // S'assurer que le mouvement est horizontal
            moveDirection.normalize();
            this.velocity.add(moveDirection.multiplyScalar(-this.moveSpeed));
        }
    
        // Rotation seulement pour "droite" et "gauche"
        if (this.moveRight) {
            camera.rotation.y -= delta * 1.5; // Ajustez le facteur (1.5) pour la vitesse de rotation
        }
        if (this.moveLeft) {
            camera.rotation.y += delta * 1.5; // Ajustez le facteur (1.5) pour la vitesse de rotation
        }
    
        // Appliquer le mouvement (avant/arrière uniquement)
        camera.position.add(this.velocity);
    
        this.lastTime = time;
    }
    
    
}
