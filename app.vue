<template>
  <div>
    <transition name="fade">
      <startScreen v-if="!started" @start="startExperience" />
    </transition>

    <transition name="fade">
      <controls v-if="started"  />
    </transition>

    <transition name="bottom">
      <loader/>
    </transition>

    <div id="experience">
      <ThreeScene v-if="started"/>
    </div>

  </div>
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
import './style.css'

const started = ref(false)

const startExperience = () => {
  started.value = true
}






</script>
