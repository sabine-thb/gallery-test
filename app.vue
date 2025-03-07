<template>
  <div>
    <transition name="fade">
      <startScreen v-if="!started" @start="startExperience" />
    </transition>
    <div id="experience">
      <ThreeScene v-if="started"/>
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
  <soundButton v-if="started" @click="toggleMute" :isMuted="isMuted"/>
</template>

<<<<<<< Updated upstream



=======
>>>>>>> Stashed changes
<script setup>
import { ref } from 'vue'
import ThreeScene from './components/webglApplication/ThreeScene.vue'
import startScreen from './components/startScreen/startScreen.vue'
import controls from './components/controls/controls.vue'
import soundButton from './components/soundButton/soundButton.vue'
import './style.css'

<<<<<<< Updated upstream
const started = ref(false)
const isMuted = ref(false)
let audioElement = null


// Démarre l'expérience
const startExperience = () => {
  started.value = true
  // Créer et jouer l'audio
  audioElement = new Audio('/audio/song.wav')
  audioElement.loop = true
  audioElement.play()
}

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
