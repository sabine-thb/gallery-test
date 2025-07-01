<template>
  <div v-if="isVisible" class="paint">
    <div class="paint-content">
      <div class="paint-content-text">
        <h1 v-html="tableauTitle"></h1>
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
// N'importe plus GLTFLoader et MeshBVH ici, on ne s'en sert pas directement dans ce composant
import { onSelectionChange, setSelectedObject } from '../utils/selectionBridge';
import oeuvresData from '../../data/oeuvres.js';

const isVisible = ref(false);
const tableauTitle = ref("");
const tableauDescription = ref("");
const selectedOeuvre = ref(null); // Ajout d'une ref pour stocker l'œuvre sélectionnée

const canvasContainer = ref(null);
const paintCanvas = ref(null);

let renderer, scene, camera, cube;
let animationFrameId;

let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;

const hidePaint = () => {
  isVisible.value = false;
  setSelectedObject(null);
  window.experience?.deselectTableau();
};

const handleKeydown = (event) => {
  if (event.key === 'x' || event.key === 'X') {
    hidePaint();
  }
};

async function init() {
  const container = canvasContainer.value;
  const canvas = paintCanvas.value;
  if (!container || !canvas || !selectedOeuvre.value) return; // Vérifie si selectedOeuvre est défini

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
  const width = selectedOeuvre.value.width;
  const height = selectedOeuvre.value.height;
  const depth = selectedOeuvre.value.depth;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
  camera.position.z = 12;

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(containerWidth, containerHeight);

  const geometry = new THREE.BoxGeometry(height, width, depth);
  const material = [
    new THREE.MeshStandardMaterial({ color: 0xf0f0f0 }),
    new THREE.MeshStandardMaterial({ color: 0xf0f0f0 }),
    new THREE.MeshStandardMaterial({ color: 0xf0f0f0 }),
    new THREE.MeshStandardMaterial({ color: 0xf0f0f0 }),
    new THREE.MeshBasicMaterial(),
    new THREE.MeshStandardMaterial({ color: 0x000000 })
  ];
  cube = new THREE.Mesh(geometry, material);
  cube.rotation.z = -Math.PI / 2;
  cube.rotation.x = -Math.PI / 0.5;
  const scale = 1;
  cube.scale.set(scale, scale, scale);

  scene.add(cube);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 50, 50);
  scene.add(directionalLight);

  // Chargement de la texture ici
  const textureLoader = new THREE.TextureLoader();
  try {
    const texture = await textureLoader.loadAsync(selectedOeuvre.value.tableauImg);

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;

    if (cube && Array.isArray(cube.material)) {
      cube.material[4] = new THREE.MeshBasicMaterial({
        map: texture
      });
      cube.material[4].map.rotation = Math.PI / 2;
      cube.material[4].map.center.set(0.5, 0.5);
      cube.material[4].needsUpdate = true;
    }
  } catch (error) {
    console.error("Erreur de chargement de la texture:", error);
  }

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const normalizedX = (mouseX / rect.width) * 2 - 1;
    const normalizedY = -(mouseY / rect.height) * 2 + 1;

    const MAX_ROTATION = Math.PI / 4;

    targetRotationY = THREE.MathUtils.clamp(
      -normalizedX * MAX_ROTATION,
      -MAX_ROTATION,
      MAX_ROTATION
    );

    targetRotationX = THREE.MathUtils.clamp(
      normalizedY * MAX_ROTATION,
      -MAX_ROTATION,
      MAX_ROTATION
    );
  });

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
  const time = performance.now() * 0.001;

  if (cube) {
    const amplitudeX = 0.3;
    const amplitudeY = 0.8;
    const amplitudeZ = 0.3;

    const speedX = 1;
    const speedY = 1.2;
    const speedZ = 0.8;

    cube.position.x = Math.sin(time * speedX) * amplitudeX;
    cube.position.y = Math.sin(time * speedY) * amplitudeY;
    cube.position.z = Math.sin(time * speedZ) * amplitudeZ;

    const rotationAmplitudeX = 0.2;
    const rotationAmplitudeY = 0.6;
    const rotationSpeed = 0.5;

    cube.rotation.x = Math.sin(time * rotationSpeed) * rotationAmplitudeX;
    cube.rotation.y = Math.sin(time * rotationSpeed) * rotationAmplitudeY;
  }

  renderer?.render(scene, camera);
}

watch(isVisible, async (newVal) => {
  if (newVal) {
    await nextTick();
    if (selectedOeuvre.value) {
      init(); // Appelle init une fois que selectedOeuvre est défini
    }
    window.addEventListener('resize', updateSize);
    window.addEventListener('keydown', handleKeydown);
  } else {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', updateSize);
    window.removeEventListener('keydown', handleKeydown);

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
  onSelectionChange(async (selected) => {
    isVisible.value = !!selected;

    if (selected) {
      const oeuvre = oeuvresData.oeuvres.find(o => o.tableauId === selected);

      if (oeuvre) {
        tableauTitle.value = oeuvre.tableau;
        tableauDescription.value = oeuvre.description;
        selectedOeuvre.value = oeuvre; // Stocke l'œuvre sélectionnée
      }
    }
  });
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', updateSize);
  window.removeEventListener('keydown', handleKeydown);

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