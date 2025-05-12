<template>
    <div v-if="isLoading" class="loader">
      <div class="loader-content">
        <div class="loader-animation">
          <img src="/icons/star-loader.svg" alt="Star">
          <img src="/icons/star-loader.svg" alt="Star">
          <img src="/icons/star-loader.svg" alt="Star">
        </div>
        <p class="loader-title">Chargement de <span>l'expérience...</span></p>
        <p class="loader-subtitle">Les sentiers</p>
      </div>
      <img src="/icons/logo.svg" class="loader-logo" alt="Logo">
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import Experience from '../../webgl/scenes/experience.js'
  import './style.css'
  
  const isLoading = ref(true)
let checkInterval = null
let timeoutFallback = null

// Vérifie périodiquement l'état de chargement
const checkLoadingState = () => {
  if (window.experience?.modelsLoaded) {
    isLoading.value = false
    clearInterval(checkInterval)
    clearTimeout(timeoutFallback)
  }
}

onMounted(() => {
  // Vérifie toutes les 100ms
  checkInterval = setInterval(checkLoadingState, 100)
  
  // Fallback après 4 secondes
  timeoutFallback = setTimeout(() => {
    isLoading.value = false
    clearInterval(checkInterval)
  }, 4000)
})

onBeforeUnmount(() => {
  clearInterval(checkInterval)
  clearTimeout(timeoutFallback)
})
  </script>
  