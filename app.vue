<template>
  <div>
    <transition name="fade">
      <startScreen
        v-if="!started"
        @start="handleStartButtonClick"
        @videoEnded="handleVideoEnded"
        @videoReady="handleVideoReady"
        @videoPlaying="handleVideoPlaying"  
      />
    </transition>

    <div id="experience">
      <ThreeScene @experience-ready="onExperienceReady" />
    </div>

    <transition name="bottom">
      <loader v-if="!videoReady" />
    </transition>

    <transition name="fade">
      <controls v-if="started" />
    </transition>

    <transition name="fade">
      <paint v-if="started" />
    </transition>

    <transition name="fade">
      <soundButton
        v-if="videoEnded"
        @click="toggleMute"
        :isMuted="isMuted"
      />
    </transition>

    <joystick v-if="started" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ThreeScene from './components/webglApplication/ThreeScene.vue'
import startScreen from './components/startScreen/startScreen.vue'
import controls from './components/controls/controls.vue'
import loader from './components/loader/loader.vue'
import soundButton from './components/soundButton/soundButton.vue'
import joystick from './components/joystick/joystick.vue'
import paint from './components/paint/paint.vue'
import './style.css'

const started = ref(false) // Montée complète de l’expérience
const videoEnded = ref(false) // Vidéo d'intro terminée
const videoReady = ref(false) // Vidéo chargée et prête à jouer
const isMuted = ref(false)
const experienceInstance = ref(null)

// --- FONCTIONS DE GESTION DES ÉVÉNEMENTS ---

// Appelé quand Three.js est prêt et a fourni son instance Experience
const onExperienceReady = (instance) => {
  experienceInstance.value = instance
  console.log("App.vue: Experience Three.js prête.")
  // Une fois que l'expérience est prête, on informe son état initial de la vidéo.
  // Au démarrage, la vidéo n'a pas encore commencé à jouer, donc le son du jeu devrait être coupé.
  // Cependant, si la vidéo est une introduction et ne doit pas commencer à jouer avant le clic,
  // alors initialement, `isVideoPlaying` dans Experience.js doit être `false`.
  // Si tu veux que le son du jeu soit muet AU DÉPART (avant même le clic sur "Démarrer"),
  // tu peux appeler `handleVideoStateChange(true)` ici.
  // Sinon, laisse Experience.js gérer son état initial en fonction de `this.isVideoPlaying` par défaut.
}


// Dès que l’utilisateur clique sur “Démarrer l'expérience” (dans startScreen)
const handleStartButtonClick = () => {
  console.log("App.vue: Bouton 'Démarrer l'expérience' cliqué.")
  // À ce stade, `startScreen` va tenter de lancer la vidéo.
  // Le son du jeu sera géré par l'événement `videoPlaying` émis par `startScreen`.
}

// Quand la vidéo est prête à jouer (preload fini, bufferisation OK)
const handleVideoReady = () => {
  console.log('App.vue: Vidéo prête, on masque le loader.')
  videoReady.value = true
}

// --- NOUVELLE FONCTION : Quand la vidéo commence réellement à jouer ---
const handleVideoPlaying = () => {
  console.log("App.vue: La vidéo a commencé à jouer.")
  // Informe l'instance de l'expérience que la vidéo est active
  if (experienceInstance.value) {
    experienceInstance.value.handleVideoStateChange(true) // true = la vidéo est en cours de lecture
  }
}

// Quand la vidéo est terminée
const handleVideoEnded = () => {
  console.log("App.vue: Vidéo terminée.")
  started.value = true // Affiche l'UI principale et le joystick
  videoEnded.value = true // Affiche le bouton son
  // Informe l'instance de l'expérience que la vidéo est terminée (son du jeu peut reprendre)
  if (experienceInstance.value) {
    experienceInstance.value.handleVideoStateChange(false) // false = la vidéo est terminée
  }
  
  // Émission de l'événement pour démarrer la vidéo de projection
  window.dispatchEvent(new CustomEvent('startExperience'));
}

// Mute/unmute le son via le bouton
const toggleMute = () => {
  isMuted.value = !isMuted.value
  // Transmet l'état de mute à l'instance Three.js
  experienceInstance.value?.toggleSound(isMuted.value)
}
</script>

<style>
#experience {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
}

/* Transitions douces */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.bottom-enter-active,
.bottom-leave-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}
.bottom-enter-from,
.bottom-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>