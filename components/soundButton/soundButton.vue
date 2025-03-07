<template>
    <div
      class="sound-button"
      @click.stop="toggleMute"
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
  import './style.css'
  
  const isMuted = ref(false)
  let audioElement = null
  
  const playMusic = () => {
    if (!audioElement) {
      audioElement = new Audio('/audio/song.wav')
      audioElement.loop = true
    }
  
    audioElement.play().catch(err => console.warn('Playback blocked:', err))
  }
  
  const toggleMute = () => {
    if (audioElement) {
      isMuted.value = !isMuted.value
      audioElement.muted = isMuted.value
    }
  }
  
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
  