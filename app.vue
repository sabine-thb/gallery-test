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
</template>




<script setup>
import { ref } from 'vue'
import ThreeScene from './components/webglApplication/ThreeScene.vue'
import startScreen from './components/startScreen/startScreen.vue'
import './style.css'

const started = ref(false)
const isMuted = ref(false)
let audioElement = null


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

</script>
