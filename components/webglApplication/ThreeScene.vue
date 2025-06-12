<template>
  <canvas ref="canvas"></canvas>
</template>

<script>
import Experience from '../../webgl/scenes/experience.js'

export default {
  name: 'ThreeScene',
  emits: ['experience-ready'],
  data() {
    return {
      experience: null,
      resizeHandler: null
    }
  },
  mounted() {
    const canvas = this.$refs.canvas
    if (!canvas) return

    this.experience = new Experience(canvas)

    window.experience = this.experience;

    this.$emit('experience-ready', this.experience);

    this.resizeHandler = () => {
      if (this.experience) {
        this.experience.resize()
      }
    }

    window.addEventListener('resize', this.resizeHandler)
  },
  beforeUnmount() {
    if (this.experience) {
      this.experience.cleanup()
      this.experience = null
    }

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }
  }
}
</script>

<style scoped>
canvas {
  position: fixed;
  top: 0;
  left: 0;
  outline: none;
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>