<template>
  <canvas ref="canvas"></canvas>
</template>

<script>
import Experience from '../../webgl/scenes/experience.js'

export default {
  name: 'ThreeScene',
  data() {
    return {
      experience: null,
      resizeHandler: null
    }
  },
  mounted() {
    // S'assurer que le canvas est disponible
    const canvas = this.$refs.canvas
    if (!canvas) return

    // Initialiser l'expérience Three.js
    this.experience = new Experience(canvas)

    // Créer le gestionnaire de redimensionnement
    this.resizeHandler = () => {
      if (this.experience) {
        this.experience.resize()
      }
    }

    // Ajouter l'écouteur de redimensionnement
    window.addEventListener('resize', this.resizeHandler)
  },
  beforeUnmount() {
    // Nettoyer l'expérience Three.js
    if (this.experience) {
      this.experience.destroy()
      this.experience = null
    }

    // Supprimer l'écouteur de redimensionnement
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