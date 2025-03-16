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
  import './style.css'
  
  const isLoading = ref(true) 
  

  const simulateLoading = () => {
    setTimeout(() => {
      isLoading.value = false 
    }, 2000) 
  }
  
  simulateLoading()
  </script>
  