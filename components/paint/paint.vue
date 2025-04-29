<template>
  <div v-if="isVisible" class="paint">
    <div class="paint-content">
      <div class="paint-content-text">
        <h1>{{ tableauTitle }}</h1>
        <p>{{ tableauDescription }}</p>
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
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { onSelectionChange, setSelectedObject } from '../utils/selectionBridge';
import oeuvres from '../oeuvres.json';

const isVisible = ref(false);
const tableauTitle = ref("");
const tableauDescription = ref("");

const canvasContainer = ref(null);
const paintCanvas = ref(null);

let renderer, scene, camera, cube;
let animationFrameId;

let controls;

const hidePaint = () => {
  isVisible.value = false;
  setSelectedObject(null); // Clear selection when closing
};

const handleKeydown = (event) => {
  if (event.key === 'x' || event.key === 'X') { 
    hidePaint();
  }
};

function init() {
  const container = canvasContainer.value;
  if (!container || !paintCanvas.value) return;

  // Nettoyer les ressources existantes
  if (renderer) {
    renderer.dispose();
    scene?.remove(cube);
    if (Array.isArray(cube?.material)) {
      cube.material.forEach(m => m?.dispose());
    } else {
      cube?.material?.dispose();
    }
  }

  scene = new THREE.Scene();
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 27;

  renderer = new THREE.WebGLRenderer({
    canvas: paintCanvas.value,
    alpha: true,
    antialias: true
  });
  renderer.setSize(width, height);

  const geometry = new THREE.BoxGeometry(25, 17, 2);
  const material = [
    new THREE.MeshBasicMaterial({ color: 0x000000 }), // Droite
    new THREE.MeshBasicMaterial({ color: 0x000000 }), // Gauche
    new THREE.MeshBasicMaterial({ color: 0x000000 }), // Haut
    new THREE.MeshBasicMaterial({ color: 0x000000 }), // Bas
    new THREE.MeshBasicMaterial(), // Face avant (index 4)
    new THREE.MeshBasicMaterial({ color: 0x000000 })  // Arrière
  ];
  cube = new THREE.Mesh(geometry, material);
  cube.rotation.z = -Math.PI / 2;
  cube.rotation.x = -Math.PI / 0.5;
  scene.add(cube);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false; // Désactive le zoom si besoin
  controls.enablePan = false; // Désactive le déplacement
  controls.rotateSpeed = 0.5; // Vitesse de rotation
  controls.enableDamping = true; // Ajoute de l'inertie
  controls.dampingFactor = 0.05;
  controls.update();

  updateSize();
  animate();
}

function updateSize() {
  if (canvasContainer.value && renderer && camera) {
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
  controls.update();
  renderer?.render(scene, camera);
}

watch(isVisible, async (newVal) => {
  if (newVal) {
    await nextTick();
    init();
    window.addEventListener('resize', updateSize);
  } else {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', updateSize);

    if (controls) controls.dispose();

    if (renderer) {
      renderer.dispose();
      if (cube) {
        cube.geometry?.dispose();
        if (Array.isArray(cube.material)) {
          cube.material.forEach(m => m.dispose());
        }
      }
      scene = null;
      camera = null;
      renderer = null;
    }
  }
});

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  
  onSelectionChange(async (selected) => {
    isVisible.value = !!selected;
    
    if (selected) {
      // Extract tableau ID from GLB model name format "FaceTableauMartinXX"
      const oeuvre = oeuvres.oeuvres.find(o => o.tableauId === selected);
        
        if (oeuvre) {
        // Mettre à jour les informations du tableau
        tableauTitle.value = oeuvre.tableau;
        tableauDescription.value = oeuvre.description;

        // Charger la texture
        const textureLoader = new THREE.TextureLoader();
        try {
          const texture = await textureLoader.loadAsync(oeuvre.tableauImg);
          if (cube && Array.isArray(cube.material)) {
            // Appliquer la texture sur la face avant seulement
            cube.material[4].map = texture;
            cube.material[4].needsUpdate = true;
            cube.material[4].color.set(0xffffff);
          }
        } catch (error) {
          console.error("Erreur de chargement de la texture:", error);
        }
       }
      }
    });
  });

  onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', updateSize);
  
  if (renderer) {
    renderer.dispose();
    if (cube) {
      cube.geometry?.dispose();
      if (Array.isArray(cube.material)) {
        cube.material.forEach(m => m.dispose());
      }
    }
  }
});
</script>
