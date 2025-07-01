<template>
    <div id="startScreen">
        <video
            ref="videoElement"
            src="/public/video/intro-expo1.mp4"
            class="video-intro"
            playsinline
            :controls="showControls"
        >
        </video>
        <p class="skip-intro" @click="skipIntro" v-if="showSkipButton">Skip intro</p> 

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
    const showSkipButton = ref(false); 

    const emit = defineEmits(['start', 'videoEnded']);

    const startExperience = () => {
        showContent.value = false; 

        if (videoElement.value) {
            videoElement.value.play()
                .then(() => {
                    showSkipButton.value = true; 


                    if (window.experience) {
                        window.experience.handleVideoStateChange(true); 
                    }

                    emit('start'); 

                    videoElement.value.addEventListener('ended', () => {
                        console.log("Vidéo terminée naturellement.");
                        showSkipButton.value = false; 

                        if (window.experience) {
                            window.experience.handleVideoStateChange(false);
                        }
                        emit('videoEnded'); 
                    }, { once: true }); 
                })
                .catch(error => {
                    console.error("Erreur lors de la lecture de la vidéo:", error);
                    showSkipButton.value = false; 

                    if (window.experience) {
                        window.experience.handleVideoStateChange(false);
                    }
                    emit('start'); 
                    setTimeout(() => emit('videoEnded'), 500); 
                });
        } else {
            console.warn("videoElement.value est null. Impossible de lancer la vidéo.");
            showSkipButton.value = false; 

            if (window.experience) {
                window.experience.handleVideoStateChange(false);
            }
            emit('start');
            setTimeout(() => emit('videoEnded'), 500);
        }
    };

    const skipIntro = () => {
        console.log("Bouton 'Skip intro' cliqué!");
        
        showSkipButton.value = false; 

        if (videoElement.value) {
            videoElement.value.pause(); 
            videoElement.value.currentTime = 0; 
        }

        if (window.experience) {
            window.experience.handleVideoStateChange(false); 
        }

        emit('videoEnded'); 
    };
</script>