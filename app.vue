<template>
  <div>
    <transition name="fade">
      <startScreen v-if="!started" @start="startExperience" />
    </transition>
    <transition name="fade">
      <controls v-if="started"  />
    </transition>
    <div id="experience">
      <ThreeScene v-if="started"/>
    </div>
  </div>
  <soundButton v-if="started" @click="toggleMute" :isMuted="isMuted"/>
</template>




<script setup>
import { ref } from 'vue'
import ThreeScene from './components/webglApplication/ThreeScene.vue'
import startScreen from './components/startScreen/startScreen.vue'
import controls from './components/controls/controls.vue'
import soundButton from './components/soundButton/soundButton.vue'
import './style.css'

const started = ref(false)

const startExperience = () => {
  started.value = true
}





</script>
