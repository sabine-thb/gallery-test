import * as THREE from 'three';

export default class Controls {
  constructor(camera, domElement, experience) {
    this.experience = experience;
    this.instance = null;

    // Import dynamique pour PointerLockControls côté client uniquement
    if (typeof window !== 'undefined') {
      import('three/examples/jsm/controls/PointerLockControls').then(module => {
        const PointerLockControls = module.PointerLockControls;
        this.instance = new PointerLockControls(camera, domElement);
      });
    }

    camera.position.y = 1.7;

    this.moveSpeed = 0.15; // Réduit pour plus de fluidité
    this.lastTime = performance.now();

    // États de mouvement
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    // Bind des méthodes
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Gestion des touches pour desktop
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);

    // Optionnel : désactiver comportement lié au pointer lock si nécessaire
    document.addEventListener('pointerlockchange', () => {
      console.log('Pointer lock activé/désactivé.');
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
    
    const camera = this.instance.object;

    // Mouvement simple et direct
    const movement = new THREE.Vector3();

    // Déplacement avant/arrière
    if (this.moveForward) {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      movement.add(forward.multiplyScalar(this.moveSpeed));
    }
    if (this.moveBackward) {
      const backward = new THREE.Vector3();
      camera.getWorldDirection(backward);
      backward.y = 0;
      backward.normalize();
      movement.add(backward.multiplyScalar(-this.moveSpeed));
    }

    // Rotation gauche/droite
    if (this.moveLeft) {
      camera.rotation.y += delta;
    }
    if (this.moveRight) {
      camera.rotation.y -= delta;
    }

    // Appliquer le mouvement avec vérification de collision
    if (movement.length() > 0) {
      const newPosition = camera.position.clone().add(movement);
      
      // Vérifier les collisions via l'experience
      if (this.experience && this.experience.collisionSystem) {
        if (this.experience.collisionSystem.canMove(newPosition)) {
          camera.position.copy(newPosition);
        }
        // Si collision, ne pas bouger (le mouvement est bloqué)
      } else {
        // Pas de système de collision, mouvement libre
        camera.position.add(movement);
      }
    }
    
    this.lastTime = time;
  }
}
