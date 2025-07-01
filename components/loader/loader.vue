<template>
    <div v-if="isLoading" class="loader">
      <div class="loader-content">
        <div class="loader-animation">
          <img src="/icons/star-loader.svg" alt="Star">
          <img src="/icons/star-loader.svg" alt="Star">
          <img src="/icons/star-loader.svg" alt="Star">
        </div>
        <p class="loader-title">Chargement de <span>l'expérience...</span></p>
        <p class="loader-subtitle">Sentiers</p>
      </div>
      <img src="/icons/logo.svg" class="loader-logo" alt="Logo">
    </div>
  </template>
  
  <script setup>
    import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
  import './style.css'
  
  const isLoading = ref(true)
  const progress = ref({ loaded: 0, total: 0 })
  let checkInterval = null

// Calculer le pourcentage de progression
const progressPercent = computed(() => {
  if (progress.value.total === 0) return 0
  return Math.round((progress.value.loaded / progress.value.total) * 100)
})

// Vérifie périodiquement l'état de chargement
const checkLoadingState = () => {
  if (window.experience) {
    progress.value.loaded = window.experience.assetsLoaded || 0
    progress.value.total = window.experience.totalAssets || 0
    
    if (window.experience.modelsLoaded) {
      isLoading.value = false
      clearInterval(checkInterval)
    }
  }
}

onMounted(() => {
  // Vérifier toutes les 100ms si les modèles sont chargés
  checkInterval = setInterval(checkLoadingState, 100)
})

onBeforeUnmount(() => {
  if (checkInterval) {
    clearInterval(checkInterval)
  }
})
  </script>
