<template>
    <div id="joystick-container"></div>
  </template>
  
  <script>
  let nipplejs;
  import './style.css';
  
  export default {
    data() {
      return {
        joystick: null,
        isMobile: false, // Permet de limiter l'utilisation du joystick à mobile
      };
    },
    async mounted() {
      const module = await import('nipplejs');
      nipplejs = module.default || module;
  
      this.checkIfMobile();
  
      if (this.isMobile) {
        this.joystick = nipplejs.create({
          zone: document.getElementById('joystick-container'),
          mode: 'static',
          position: { left: '50px', bottom: '50px' },
          color: 'white',
        });
  
        this.joystick.on('move', this.onMove);
        this.joystick.on('end', this.onEnd);
      }
    },
    beforeUnmount() {
      if (this.joystick) {
        this.joystick.destroy();
        this.joystick = null;
      }
    },
    methods: {
      checkIfMobile() {
        if (typeof window !== 'undefined') {
          this.isMobile = window.innerWidth <= 540; // Utilisez une détection simple
        }
      },
      onMove(evt, data) {
        if (!window.experience || !window.experience.controls) return;
  
        const controls = window.experience.controls;
        const angle = data.angle.degree;
        const distance = data.distance;
  
        if (distance < 10) return; // Évitez les petits mouvements inutiles
  
        controls.moveForward = false;
        controls.moveBackward = false;
        controls.moveLeft = false;
        controls.moveRight = false;
  
        if (angle >= 45 && angle < 135) {
          controls.moveForward = true;
        } else if (angle >= 225 && angle < 315) {
          controls.moveBackward = true;
        } else if (angle >= 135 && angle < 225) {
          controls.moveLeft = true;
        } else if (angle >= 315 || angle < 45) {
          controls.moveRight = true;
        }
      },
      onEnd() {
        if (!window.experience || !window.experience.controls) return;
  
        const controls = window.experience.controls;
        controls.moveForward = false;
        controls.moveBackward = false;
        controls.moveLeft = false;
        controls.moveRight = false;
      },
    },
  };
  </script>
  