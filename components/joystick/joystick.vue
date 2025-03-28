<template>
  <div id="joystick-container"></div>
</template>

<script>
let nipplejs;
import "./style.css";

export default {
  data() {
    return {
      joystick: null,
      isMobile: false,
    };
  },
  async mounted() {
    const module = await import("nipplejs");
    nipplejs = module.default || module;

    this.checkIfMobile();
    window.addEventListener("resize", this.checkIfMobile);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.checkIfMobile);
    this.destroyJoystick();
  },
  methods: {
    checkIfMobile() {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth <= 540;

      if (this.isMobile && !wasMobile) {
        this.createJoystick();
      } else if (!this.isMobile && wasMobile) {
        this.destroyJoystick();
      }
    },
    createJoystick() {
      if (this.joystick) return;

      this.joystick = nipplejs.create({
        zone: document.getElementById("joystick-container"),
        mode: "static",
        position: { left: "50px", bottom: "50px" },
        color: "white",
      });

      this.joystick.on("move", this.onMove);
      this.joystick.on("end", this.onEnd);
    },
    destroyJoystick() {
      if (this.joystick) {
        this.joystick.destroy();
        this.joystick = null;
      }
    },
    onMove(evt, data) {
      if (!window.experience || !window.experience.controls) return;

      const controls = window.experience.controls;
      const angle = data.angle.degree;
      const distance = data.distance;

      if (distance < 10) return;

      controls.moveForward = angle >= 45 && angle < 135;
      controls.moveBackward = angle >= 225 && angle < 315;
      controls.moveLeft = angle >= 135 && angle < 225;
      controls.moveRight = angle >= 315 || angle < 45;
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
