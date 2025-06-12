<template>
    <div id="startScreen">
        <video
            ref="videoElement"
            src="/public/video/intro-expo-test.mp4"
            class="video-intro"
            playsinline
            :controls="showControls"
        ></video>

        <div ref="contentElement" class="content" :class="{ 'fade-out': !showContent }">
            <img src="/public/images/logo-sentiers.png" alt="" class="logo-sentiers">
            <button @click="startExperience" id="startButton">Démarrer l'expérience</button>
        </div>
    </div>
</template>

<script setup>
    import { ref } from 'vue';
    import './style.css'; 

    const videoElement = ref(null);
    const contentElement = ref(null);
    const showControls = ref(false);
    const showContent = ref(true); 

    const emit = defineEmits(['start', 'videoEnded']);

    const startExperience = () => {
        showContent.value = false; 

        if (videoElement.value) {
            videoElement.value.play()
                .then(() => {
                    showControls.value = true; 

                    if (window.experience) {
                        window.experience.handleVideoStateChange(true); 
                    }

                    emit('start');

                    videoElement.value.addEventListener('ended', () => {
                        if (window.experience) {
                            window.experience.handleVideoStateChange(false); 
                        }
                        emit('videoEnded'); 
                    }, { once: true }); 
                })
                .catch(error => {
                    console.error("Erreur lors de la lecture de la vidéo:", error);
                    if (window.experience) {
                        window.experience.handleVideoStateChange(false);
                    }
                    emit('start');
                    emit('videoEnded'); 
                });
        } else {

            if (window.experience) {
                window.experience.handleVideoStateChange(false);
            }
            emit('start');
            emit('videoEnded');
        }
    };
</script>