<template>
    <div v-if="isVisible" class="controls">
      <div class="controls-background"></div>
      <div class="controls-flex">
        <div class="controls-flex-item">
          <img src="/images/controls1.svg" class="controls-flex-img" alt="">
          <p>Utilisez les flèches pour naviguer</p>
        </div>
        <div class="controls-flex-text">ou</div>
        <div class="controls-flex-item">
          <img src="/images/controls2.svg" class="controls-flex-img" alt="">
          <p>Utilisez ZQSD pour naviguer</p>
        </div>
      </div>
      <button @click="hideControls" class="controls-close">
        <img src="/icons/close.svg" alt="close">
      </button>
      <p class="controls-close-indication">Pressez X pour fermer</p>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import './style.css';
  
  const isVisible = ref(true);
  
  const hideControls = () => {
    isVisible.value = false;
  };
  
  const handleKeydown = (event) => {
    if (event.key === 'x' || event.key === 'X') { 
      hideControls();
    }
  };
  
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });
  
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
  </script>
  
  <style>
  </style>
  