import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'

export default class Room1 {
    constructor(scene, materials, experience) {
        this.scene = scene
        this.experience = experience
        this.createRoom()
    }

    createRoom() {
        const radius = 6
        const height = 6
        const segments = 64

        // Chargeur de textures
        const textureLoader = new THREE.TextureLoader()

        // Charger les textures du sol
        const floorBaseTexture = textureLoader.load('/textures/floor/wooden_floor.jpg')
        const floorNormalMap = textureLoader.load('/textures/floor/wooden_floor_normal.jpg')
        const floorRoughnessMap = textureLoader.load('/textures/floor/wooden_floor_roughness.jpg')

        // Configurer la répétition des textures
        const repeat = 4 // Ajustez ce nombre pour la taille de répétition
        floorBaseTexture.wrapS = floorBaseTexture.wrapT = THREE.RepeatWrapping
        floorBaseTexture.repeat.set(repeat, repeat)
        floorNormalMap.wrapS = floorNormalMap.wrapT = THREE.RepeatWrapping
        floorNormalMap.repeat.set(repeat, repeat)
        floorRoughnessMap.wrapS = floorRoughnessMap.wrapT = THREE.RepeatWrapping
        floorRoughnessMap.repeat.set(repeat, repeat)

        // Matériau du sol avec texture
        const floorMaterial = new THREE.MeshStandardMaterial({
            map: floorBaseTexture,
            normalMap: floorNormalMap,
            roughnessMap: floorRoughnessMap,
            normalScale: new THREE.Vector2(1, 1),
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.FrontSide
        })


        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.0,
            roughness: 0.7,
            side: THREE.BackSide
        })

        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.0,
            roughness: 0.5,
            side: THREE.BackSide
        })

        // Sol
        const floor = new THREE.Mesh(
            new THREE.CircleGeometry(radius, segments),
            floorMaterial
        )
        floor.rotation.x = -Math.PI / 2
        floor.position.y = 0.001
        floor.receiveShadow = true
        this.scene.add(floor)

        // Plafond
        const ceiling = new THREE.Mesh(
            new THREE.CircleGeometry(radius, segments),
            ceilingMaterial
        )
        ceiling.rotation.x = Math.PI / 2
        ceiling.position.y = height - 0.001
        ceiling.receiveShadow = true
        this.scene.add(ceiling)

        // Mur cylindrique
        const wallGeometry = new THREE.CylinderGeometry(
            radius,
            radius,
            height,
            segments,
            2,
            false
        )
        const wall = new THREE.Mesh(wallGeometry, wallMaterial)
        wall.position.y = height / 2
        wall.receiveShadow = true
        this.scene.add(wall)

        // Éclairage
        // Lumière ambiante faible
        const ambientLight = new THREE.AmbientLight(0xfff0e0, 0.2)
        this.scene.add(ambientLight)

        // Lumière principale au plafond
        const mainLight = new THREE.PointLight(0xffd700, 1, 15, 1)
        mainLight.position.set(0, height - 1, 0)
        mainLight.castShadow = true
        mainLight.shadow.mapSize.width = 1024
        mainLight.shadow.mapSize.height = 1024
        mainLight.shadow.radius = 2
        this.scene.add(mainLight)

        // Créer un halo lumineux autour de la lumière principale
        const glowGeometry = new THREE.SphereGeometry(0.1, 16, 16)
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.5
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        glow.position.copy(mainLight.position)
        this.scene.add(glow)

        // Lumières d'accent sur les murs
        const createWallLight = (angle) => {
            const light = new THREE.PointLight(0xffd700, 0.5, 4, 2)
            const x = Math.cos(angle) * (radius - 0.5)
            const z = Math.sin(angle) * (radius - 0.5)
            light.position.set(x, height / 2, z)

            // Créer un petit halo pour chaque lumière murale
            const smallGlow = new THREE.Mesh(
                new THREE.SphereGeometry(0.01, 16, 16),
                new THREE.MeshBasicMaterial({
                    color: 0xffd700,
                    transparent: true,
                    opacity: 0.4
                })
            )
            smallGlow.position.copy(light.position)

            return { light, glow: smallGlow }
        }

        // Ajouter les lumières murales
        const numLights = 6
        for (let i = 0; i < numLights; i++) {
            const angle = (i / numLights) * Math.PI * 2
            const { light, glow } = createWallLight(angle)
            this.scene.add(light)
            this.scene.add(glow)
        }

        // Léger brouillard pour l'ambiance
        this.scene.fog = new THREE.Fog(0x000000, 1, 20)




        //AJOUT DU TEXTE

// Créer une texture avec du texte
const canvas = document.createElement('canvas');
canvas.width = 2048;
canvas.height = 256;
const context = canvas.getContext('2d');

// Style du texte
context.fillStyle = 'white';
context.font = 'bold 80px Arial';
context.textAlign = 'center';
context.textBaseline = 'middle';

// Inverser le contexte horizontalement pour le texte en miroir
context.scale(-1, 1);
context.fillText('Bienvenue dans la galerie virtuelle', -canvas.width/2, canvas.height/2);

// Créer la texture
const texture = new THREE.CanvasTexture(canvas);
const textMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
});

// Créer un plan courbé pour le texte
const textGeometry = new THREE.CylinderGeometry(
    radius - 0.1,
    radius - 0.1,
    1.5,
    64,
    1,
    true,
    -Math.PI/2 - Math.PI/4, // Ajusté pour centrer
    Math.PI/2.5
);

// Créer le mesh
const textMesh = new THREE.Mesh(textGeometry, textMaterial);
textMesh.position.y = height/2;
textMesh.rotation.y = -Math.PI/2;


this.scene.add(textMesh);

    }
}