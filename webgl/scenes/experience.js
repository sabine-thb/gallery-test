import * as THREE from 'three'
import MainCamera from '../modules/camera/mainCamera'
import Controls from '../modules/controls'
import Renderer from '../modules/render'
import Room1 from '../components/room1'
import Room2 from '../components/room2'
import Corridor from '../components/corridor'

export default class Experience {
    constructor(canvas) {
        if (!canvas) return
        
        this.canvas = canvas
        this.walls = []
        this.playerRadius = 0.5
        
        this.scene = new THREE.Scene()
        this.camera = new MainCamera()
        this.renderer = new Renderer(canvas)
        this.renderer.instance.shadowMap.enabled = true
        this.renderer.instance.shadowMap.type = THREE.PCFSoftShadowMap
        this.controls = new Controls(this.camera.instance, document.body, this)
        
        // Définir la position initiale du joueur
        this.camera.instance.position.set(0, 1.7, 0)
        
        this.createEnvironment()
        this.setupEventListeners() // Changé de addEventListeners à setupEventListeners
        this.animate()
    }

    // Renommé en setupEventListeners et ajouté comme méthode de classe
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.resize()
            this.renderer.resize()
        })
    }

    // Méthode pour vérifier les collisions
    checkCollisions(position) {
        for (const wall of this.walls) {
            if (wall.geometry.type === 'CylinderGeometry') {
                // Pour un mur cylindrique
                const dx = position.x - wall.position.x
                const dz = position.z - wall.position.z
                const distance = Math.sqrt(dx * dx + dz * dz)
                
                // Rayon intérieur du cylindre (puisque nous sommes à l'intérieur)
                const radius = wall.geometry.parameters.radius
                const minDistance = radius - this.playerRadius - 0.2 // Marge de 0.2
    
                // Si nous sommes trop près du mur ou trop loin du centre
                if (distance > minDistance) {
                    return true // Collision détectée
                }
            }
            // ... gestion des autres types de murs ...
        }
        return false
    }


    createEnvironment() {
        this.materials = {
            items: {
                wall: new THREE.MeshStandardMaterial({
                    color: 0x445566,
                    roughness: 0.5
                }),
                floor: new THREE.MeshStandardMaterial({
                    color: 0x222222,
                    roughness: 0.7
                }),
                ceiling: new THREE.MeshStandardMaterial({
                    color: 0x333333,
                    roughness: 0.8
                })
            }
        }

        // Créer les pièces dans l'ordre de connexion
        this.room1 = new Room1(this.scene, this.materials, this)
        // this.corridor = new Corridor(this.scene, this.materials, this)
        // this.room2 = new Room2(this.scene, this.materials, this)

        // Éclairage
        const ambient = new THREE.AmbientLight(0xffffff, 0.5)
        this.scene.add(ambient)

        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
        mainLight.position.set(0, 10, 0)
        this.scene.add(mainLight)
    }

    animate() {
        requestAnimationFrame(() => this.animate())
        
        if (this.controls) {
            this.controls.update()
        }
        
        this.renderer.render(this.scene, this.camera.instance)
    }

    cleanup() {
        window.removeEventListener('resize', () => {
            this.camera.resize()
            this.renderer.resize()
        })
        
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose()
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose())
                } else {
                    object.material.dispose()
                }
            }
        })
        
        this.renderer.instance.dispose()
    }
}
    
