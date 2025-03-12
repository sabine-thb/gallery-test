<template>
  <div>
    <transition name="fade">
      <startScreen v-if="!started" @start="startExperience" />
    </transition>
    <transition name="fade">
      <controls v-if="started" />
    </transition>
    <div id="experience">
      <ThreeScene v-if="started" @experience-ready="handleExperienceReady" />
    </div>
    <soundButton v-if="started" @click="toggleMute" :isMuted="isMuted" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ThreeScene from './components/webglApplication/ThreeScene.vue';
import startScreen from './components/startScreen/startScreen.vue';
import controls from './components/controls/controls.vue';
import soundButton from './components/soundButton/soundButton.vue';
import './style.css';

const started = ref(false);
const isMuted = ref(false);
const experience = ref(null); // Référence à l'instance de Experience

const startExperience = () => {
  started.value = true;
};

const handleExperienceReady = (exp) => {
  experience.value = exp; // Stocker l'instance de Experience
};

const toggleMute = () => {
  isMuted.value = !isMuted.value;
  if (experience.value) {
    experience.value.toggleMuteSound(isMuted.value); // Appeler la méthode de Experience
  }
};
</script>
