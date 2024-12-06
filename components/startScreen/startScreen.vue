<template>
    <div id="startScreen">
        <div class="content">
            <h1>Welcome</h1>
            <p class="description">Dans <span>l’Art sans limites</span></p>
            <button @click="$emit('start')" id="startButton">Démarrer l'expérience</button>
        </div>
      
    </div>
  </template>

<script setup>
    import './style.css'
</script>
  