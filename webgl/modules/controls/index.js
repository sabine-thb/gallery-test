import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

export default class Controls {
  constructor(camera, domElement, experience) {
    this.experience = experience;
    this.instance = new PointerLockControls(camera, domElement);

    camera.position.y = 1.7;

    this.moveSpeed = 0.2;
    this.velocity = new THREE.Vector3();
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

    this.velocity.set(0, 0, 0);
    const camera = this.instance.object;

    // Déplacement avant/arrière
    if (this.moveForward) {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0; // Déplacement horizontal uniquement
      forward.normalize();
      this.velocity.add(forward.multiplyScalar(this.moveSpeed));
    }
    if (this.moveBackward) {
      const backward = new THREE.Vector3();
      camera.getWorldDirection(backward);
      backward.y = 0;
      backward.normalize();
      this.velocity.add(backward.multiplyScalar(-this.moveSpeed));
    }

    // Rotation gauche/droite
    if (this.moveLeft) {
      camera.rotation.y += delta ;
    }
    if (this.moveRight) {
      camera.rotation.y -= delta ;
    }

    camera.position.add(this.velocity);
    this.lastTime = time;
  }
}
