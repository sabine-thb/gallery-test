<template>
  <div>
    <transition name="fade">
      <startScreen v-if="!started" @start="startExperience" />
    </transition>

    <!-- <transition name="fade">
      <controls v-if="started"  />
    </transition> -->

    <transition name="bottom">
      <loader/>
    </transition>

    <div id="experience">
      <ThreeScene @experience-ready="onExperienceReady" :class="{ 'visible': started }"/>
    </div>

  </div>
  <transition name="fade" >
    <paint v-if="started"/>
  </transition>

  <soundButton v-if="started" @click="toggleMute" :isMuted="isMuted"/>
  <joystick v-if="started"/>
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

const started = ref(false)
const isMuted = ref(false)
const experienceInstance = ref(null)

const onExperienceReady = (experience) => {
  experienceInstance.value = experience
}

const startExperience = () => {
  started.value = true
  if (experienceInstance.value) {
    experienceInstance.value.loadAudio()
  }
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  if (experienceInstance.value) {
    experienceInstance.value.toggleSound(isMuted.value)
  }
}
</script>

<style>
#experience {
  width: 100%;
  height: 100%;
}

#experience canvas {
  opacity: 0;
  transition: opacity 0.5s ease;
}

#experience .visible {
  opacity: 1;
}
</style>
