<template>
    <div v-if="isVisible" class="paint">
      <div class="paint-content">
        <div class="paint-content-text">
          <h1>L’eau blabla <span>test</span></h1>
          <p>
            Un vent léger caressait les feuilles des arbres, apportant avec lui une douce odeur de terre humide. Au loin, le rire d’enfants résonnait, mêlé au chant mélancolique d’un oiseau solitaire. Chaque détail semblait murmurer une promesse de sérénité, comme si le temps lui-même avait choisi de ralentir, offrant un instant suspendu entre le rêve et la réalité. Parfois, ces moments fugaces suffisent à rappeler que la beauté réside souvent dans les choses simples, invisibles à l’œil pressé.
          </p>
        </div>
        <div class="paint-content-visual" ref="canvasContainer">
          <canvas ref="paintCanvas"></canvas>
        </div>
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
  import * as THREE from 'three';
  
  const isVisible = ref(true);
  
  const canvasContainer = ref(null);
  const paintCanvas = ref(null);
  
  let renderer, scene, camera, cube;
  let animationFrameId;
  
  const hidePaint = () => {
    isVisible.value = false;
  };
  
  const handleKeydown = (event) => {
    if (event.key === 'x' || event.key === 'X') { 
      hidePaint();
    }
  };
  
  function init() {
    if (!paintCanvas.value) return;

    scene = new THREE.Scene();
    
    // Obtenir les dimensions initiales du conteneur
    const container = canvasContainer.value;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Initialiser la caméra avec le bon aspect ratio dès le début
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({
      canvas: paintCanvas.value,
      alpha: true,
      antialias: true
    });
    
    // Définir la taille initiale
    renderer.setSize(width, height);

    // Création du cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Ajuster la taille
    updateSize();
  }

  function updateSize() {
    if (canvasContainer.value && renderer) {
      const container = canvasContainer.value;
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    
    if (cube) {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
    }
    
    renderer?.render(scene, camera);
  }
  
  onMounted(() => {
    init();
    animate();
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('resize', updateSize);
  });
  
  onBeforeUnmount(() => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('resize', updateSize);
    
    // Nettoyage
    scene?.remove(cube);
    cube?.geometry.dispose();
    cube?.material.dispose();
    renderer?.dispose();
  });
  </script>
