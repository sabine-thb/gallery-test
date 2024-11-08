<template>
  <div>
    <ThreeScene />
  </div>
</template>

<script>
import ThreeScene from './components/webglApplication/ThreeScene.vue'

export default {
  name: 'App',
  components: {
    ThreeScene
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
}

body {
  overflow: hidden;
}
</style>