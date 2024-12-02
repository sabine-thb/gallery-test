<template>
  <div>
    <div v-if="!started" id="startScreen">
      <button @click="startExperience" id="startButton">Cliquez pour rejoindre l'expérience</button>
      <div id="controls">
        ZQSD = Mouvement, SOURIS = Vue, ECHAP = Pause
      </div>
    </div>
    <div v-show="started" id="experience">
      <ThreeScene v-if="started" />
      <div class="music-button" @click.stop="toggleMute" :class="{ muted: isMuted }">
        <div class="music">
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ThreeScene from './components/webglApplication/ThreeScene.vue'

const started = ref(false)
const isMuted = ref(false)
let audioElement = null

const startExperience = () => {
  started.value = true
  
  // Créer et jouer l'audio
  audioElement = new Audio('/audio/song.wav')
  audioElement.loop = true
  audioElement.play()

  // La vidéo démarrera automatiquement au premier clic dans la scène
}

const toggleMute = () => {
  if (audioElement) {
    isMuted.value = !isMuted.value
    audioElement.muted = isMuted.value
  }
}
</script>

<style scoped>
#startScreen {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #000;
  z-index: 1000;
}

#startButton {
  padding: 15px 30px;
  font-size: 18px;
  background: transparent;
  color: #fff;
  border: 2px solid #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

#startButton:hover {
  background: #fff;
  color: #000;
}

#controls {
  margin-top: 20px;
  font-size: 14px;
  text-align: center;
  color: #fff;
}

#experience {
  width: 100%;
  height: 100vh;
}

.music-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  cursor: pointer;
  transform: scale(0.3);
  transform-origin: bottom right;
}

.music {
  width: 300px;
  height: 200px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
}

.music .bar {
  width: 12px;
  border-radius: 10px;
  background: #FFF;
  animation: loader 1.5s ease-in-out infinite;
}

.muted .bar {
  animation-play-state: paused;
  height: 2px !important;
}

@keyframes loader {
  0%, 100% {
    height: 2px;
  }
  50% {
    height: 80px;
  }
}

.music .bar:nth-child(1) {
  background: #0300a0;
  animation-delay: 1s;
}

.music .bar:nth-child(2) {
  background: #4e00df;
  animation-delay: 0.8s;
}

.music .bar:nth-child(3) {
  background: #1827ff;
  animation-delay: 0.6s;
}

.music .bar:nth-child(4) {
  background: #495bff;
  animation-delay: 0.4s;
}

.music .bar:nth-child(5) {
  background: #00ffdd;
  animation-delay: 0.2s;
}

.music .bar:nth-child(6) {
  background: #00ffdd;
  animation-delay: 0.2s;
}

.music .bar:nth-child(7) {
  background: #495bff;
  animation-delay: 0.4s;
}

.music .bar:nth-child(8) {
  background: #1827ff;
  animation-delay: 0.6s;
}

.music .bar:nth-child(9) {
  background: #1827ff;
  animation-delay: 0.8s;
}

.music .bar:nth-child(10) {
  background: #0300a0;
  animation-delay: 1s;
}
</style>