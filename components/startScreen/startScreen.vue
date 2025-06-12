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
    import './style.css'; // Assure-toi que ton CSS contient les styles pour .fade-out

    const videoElement = ref(null);
    const contentElement = ref(null);
    const showControls = ref(false);
    const showContent = ref(true); // Contrôle la visibilité du div .content

    const emit = defineEmits(['start', 'videoEnded']);

    // Cette fonction est appelée quand l'utilisateur clique sur "Démarrer l'expérience"
    const startExperience = () => {
        showContent.value = false; // Cache le contenu avec le bouton

        if (videoElement.value) {
            videoElement.value.play()
                .then(() => {
                    showControls.value = true; // Active les contrôles une fois que la lecture démarre

                    // --- IMPORTANT : Informe Experience que la vidéo est active (son du jeu coupé) ---
                    if (window.experience) {
                        window.experience.handleVideoStateChange(true); // 'true' signifie que la vidéo joue
                    }

                    // Émet l'événement 'start' à ton composant parent (ex: App.vue)
                    // pour qu'il puisse lancer ton expérience Three.js
                    emit('start');

                    // Écoute la fin de la vidéo
                    videoElement.value.addEventListener('ended', () => {
                        // --- IMPORTANT : Informe Experience que la vidéo est terminée (son du jeu autorisé) ---
                        if (window.experience) {
                            window.experience.handleVideoStateChange(false); // 'false' signifie que la vidéo est terminée
                        }
                        emit('videoEnded'); // Émet l'événement 'videoEnded'
                    }, { once: true }); // L'écouteur est supprimé après le premier déclenchement
                })
                .catch(error => {
                    console.error("Erreur lors de la lecture de la vidéo:", error);
                    // Si la lecture automatique échoue (ex: restrictions navigateur) ou autre erreur
                    // On suppose que la vidéo ne se lance pas ou est ignorée.
                    // Donc, le son du jeu peut être activé immédiatement.
                    if (window.experience) {
                        window.experience.handleVideoStateChange(false); // 'false' signifie que la vidéo n'est pas jouée/est terminée
                    }
                    emit('start');
                    emit('videoEnded'); // Émet directement videoEnded si la lecture échoue
                });
        } else {
            // Au cas où videoElement.value est null (ce qui ne devrait pas arriver avec ref)
            // On lance l'expérience et le son du jeu directement.
            if (window.experience) {
                window.experience.handleVideoStateChange(false);
            }
            emit('start');
            emit('videoEnded');
        }
    };
</script>