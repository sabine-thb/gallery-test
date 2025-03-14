<template>
    <div v-if="isVisible" class="paint">
      <div class="paint-content">
        <div class="paint-content-text">
          <h1>L’eau blabla <span>test</span></h1>
          <p>
            Un vent léger caressait les feuilles des arbres, apportant avec lui une douce odeur de terre humide. Au loin, le rire d’enfants résonnait, mêlé au chant mélancolique d’un oiseau solitaire. Chaque détail semblait murmurer une promesse de sérénité, comme si le temps lui-même avait choisi de ralentir, offrant un instant suspendu entre le rêve et la réalité. Parfois, ces moments fugaces suffisent à rappeler que la beauté réside souvent dans les choses simples, invisibles à l’œil pressé.
          </p>
        </div>
        <div class="paint-content-visual" ref="canvasContainer"></div>
      </div>
      <button @click="hidePaint" class="paint-close">
        <img src="/icons/close.svg" alt="close">
      </button>
      <p class="paint-close-indication">Pressez X pour fermer</p>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import './style.css';
  
  const isVisible = ref(true);
  
  const hidePaint = () => {
    isVisible.value = false;
  };
  
  const handleKeydown = (event) => {
    if (event.key === 'x' || event.key === 'X') { 
      hidePaint();
    }
  };
  
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });
  
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
  </script>
