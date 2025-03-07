<template>
  <div>
    <transition name="fade">
      <startScreen v-if="!started" @start="startExperience" />
    </transition>
<<<<<<< Updated upstream
    <div id="experience">
      <ThreeScene v-if="started"/>
=======

    <div id="experience" v-if="started">
      <!-- La scène Three.js -->
      <ThreeScene />
      
      <!-- Contrôle du son -->
>>>>>>> Stashed changes
      <div
        class="sound-button"
        @click.stop="toggleMute"
        :class="{ muted: isMuted }"
      >
        <div class="sound-button-line"></div>
        <div class="sound-button-line"></div>
        <div class="sound-button-line"></div>
        <div class="sound-button-line"></div>
        <div class="sound-button-line"></div>
      </div>
    </div>
  </div>
</template>

<<<<<<< Updated upstream



=======
>>>>>>> Stashed changes
<script setup>
import { ref } from 'vue'
import ThreeScene from './components/webglApplication/ThreeScene.vue'
import startScreen from './components/startScreen/startScreen.vue'
import './style.css'

<<<<<<< Updated upstream
const started = ref(false)
const isMuted = ref(false)
let audioElement = null

=======
const started = ref(false)  // Contrôle de l'état du démarrage
const isMuted = ref(false)   // Contrôle du mute
>>>>>>> Stashed changes

// Démarre l'expérience
const startExperience = () => {
  started.value = true
  // Créer et jouer l'audio
  audioElement = new Audio('/audio/song.wav')
  audioElement.loop = true
  audioElement.play()
}

<<<<<<< Updated upstream
const toggleMute = () => {
  if (audioElement) {
    isMuted.value = !isMuted.value
    audioElement.muted = isMuted.value
  }
}

=======
// Change l'état du mute
const toggleMute = () => {
  isMuted.value = !isMuted.value
}
>>>>>>> Stashed changes
</script>
