<template>
  <div
    class="sound-button"
    @click.prevent="toggleMute"
    :class="{ muted: isMuted }"
  >
    <div class="sound-button-line"></div>
    <div class="sound-button-line"></div>
    <div class="sound-button-line"></div>
    <div class="sound-button-line"></div>
    <div class="sound-button-line"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Experience from '../../webgl/scenes/experience.js'; // Importer Experience

import './style.css'

const isMuted = ref(false)
let experienceInstance = null;


const toggleMute = () => {
  isMuted.value = !isMuted.value;
  if (window.experience) {
    window.experience.toggleSound(isMuted.value);
  }
};

onMounted(() => {
  if (window.experience) {
    experienceInstance = window.experience;
  }
<<<<<<< Updated upstream
  
  onMounted(() => {
    playMusic()
  })
  
  onUnmounted(() => {
    if (audioElement) {
      audioElement.pause()
      audioElement = null
    }
  })
  </script>
=======
});

onUnmounted(() => {
  if (experienceInstance) {
    experienceInstance = null;
  }
})
</script>
>>>>>>> Stashed changes
