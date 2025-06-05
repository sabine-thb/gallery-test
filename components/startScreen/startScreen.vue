<template>
    <div id="startScreen">
        <div class="content">
            <img src="/public/images/logo-sentiers.png" alt="" class="logo-sentiers">
            <button @click="$emit('start')" id="startButton">Démarrer l'expérience</button>
        </div>
      
    </div>
  </template>

<script setup>
    import './style.css'
</script>
  