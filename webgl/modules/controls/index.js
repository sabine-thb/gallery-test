import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'

export default class Controls {
    constructor(camera, domElement, experience) {
        this.experience = experience
        this.instance = new PointerLockControls(camera, domElement)

        // Définir la hauteur initiale de la caméra
        camera.position.y = 1.7

        this.moveSpeed = 0.08
        this.velocity = new THREE.Vector3()
        this.lastTime = performance.now()

        // États de mouvement
        this.moveForward = false
        this.moveBackward = false
        this.moveLeft = false
        this.moveRight = false

        // Créer les éléments UI s'ils n'existent pas
        // this.createUIElements()

        // Lier les méthodes
        this.onKeyDown = this.onKeyDown.bind(this)
        this.onKeyUp = this.onKeyUp.bind(this)
        this.onClick = this.onClick.bind(this)
        this.onLock = this.onLock.bind(this)
        this.onUnlock = this.onUnlock.bind(this)

        this.setupEventListeners()

        // Afficher le blocker au démarrage
        //this.showBlocker()
    }

    // createUIElements() {
    //     // Créer le blocker s'il n'existe pas
    //     if (!document.getElementById('blocker')) {
    //         const blocker = document.createElement('div')
    //         blocker.id = 'blocker'
    //         blocker.style.position = 'absolute'
    //         blocker.style.width = '100%'
    //         blocker.style.height = '100%'
    //         blocker.style.backgroundColor = 'rgba(0,0,0,0.5)'
    //         blocker.style.display = 'flex'
    //         blocker.style.justifyContent = 'center'
    //         blocker.style.alignItems = 'center'
    //         blocker.style.zIndex = '999'
    //         blocker.style.top = '0'
    //         blocker.style.left = '0'
    
    //         const instructions = document.createElement('div')
    //         instructions.id = 'instructions'
    //         instructions.style.color = '#ffffff'
    //         instructions.style.textAlign = 'center'
    //         instructions.style.fontSize = '24px'
    //         instructions.style.cursor = 'pointer'
    //         instructions.style.userSelect = 'none'
    //         instructions.innerHTML = `
    //             <span>Cliquez pour rejoindre l'expérience</span>
    //             <br/>
    //             <span style="font-size: 14px;">(ZQSD = Mouvement, SOURIS = Vue, ECHAP = Pause)</span>
    //         `
    
    //         blocker.appendChild(instructions)
    //         document.body.appendChild(blocker)
    //     }
    
    //     this.blocker = document.getElementById('blocker')
    //     this.instructions = document.getElementById('instructions')
    // }

    // showBlocker() {
    //     if (this.blocker) {
    //         this.blocker.style.display = 'flex'
    //     }
    // }

    // hideBlocker() {
    //     if (this.blocker) {
    //         this.blocker.style.display = 'none'
    //     }
    // }

    onClick() {
        if (!this.instance.isLocked) {
            this.instance.lock()
        }
    }

    onLock() {
        //console.log("onLock appelé", this.hideBlocker);
        //if (typeof this.hideBlocker === "function") {
            //this.hideBlocker();
        //} else {
            //console.error("hideBlocker n'est pas défini !");
        //}
    }    

    onUnlock() {
        //this.showBlocker()
    }

    setupEventListeners() {
        this.instance.pointerSpeed = 0.8

        // Gestionnaires d'événements
        document.addEventListener('click', this.onClick)
        document.addEventListener('keydown', this.onKeyDown)
        document.addEventListener('keyup', this.onKeyUp)

        // Gestionnaire spécifique pour Échap
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape' && this.instance.isLocked) {
                this.instance.unlock()
                //this.showBlocker()
            }
        })

        // Gestionnaire de verrouillage du pointeur
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === this.instance.domElement) {
                this.onLock()
            } else {
                this.onUnlock()
                // Réinitialiser les états
                this.moveForward = false
                this.moveBackward = false
                this.moveLeft = false
                this.moveRight = false
            }
        })
    }

    onKeyDown(event) {
        if (!this.instance.isLocked) return

        switch(event.code) {
            case 'ArrowUp':
            case 'KeyW':
            case 'KeyZ':
                this.moveForward = true
                break
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true
                break
            case 'ArrowLeft':
            case 'KeyA':
            case 'KeyQ':
                this.moveLeft = true
                break
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true
                break
        }
    }

    onKeyUp(event) {
        if (!this.instance.isLocked) return

        switch(event.code) {
            case 'ArrowUp':
            case 'KeyW':
            case 'KeyZ':
                this.moveForward = false
                break
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false
                break
            case 'ArrowLeft':
            case 'KeyA':
            case 'KeyQ':
                this.moveLeft = false
                break
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false
                break
        }
    }

    dispose() {
        // Nettoyer tous les événements
        document.removeEventListener('click', this.onClick)
        document.removeEventListener('keydown', this.onKeyDown)
        document.removeEventListener('keyup', this.onKeyUp)
        
        // Supprimer les éléments UI
        if (this.blocker) {
            document.body.removeChild(this.blocker)
        }
    }

    update() {
        if (!this.instance.isLocked) return

        const time = performance.now()
        const delta = (time - this.lastTime) / 1000

        // Obtenir la direction de la caméra
        const camera = this.instance.object
        const direction = new THREE.Vector3()
        camera.getWorldDirection(direction)
        
        // Créer une direction de mouvement horizontale
        const moveDirection = direction.clone()
        moveDirection.y = 0
        moveDirection.normalize()

        // Calculer le vecteur droit
        const right = new THREE.Vector3()
        right.crossVectors(moveDirection, new THREE.Vector3(0, 1, 0)).normalize()

        // Réinitialiser la vélocité
        this.velocity.set(0, 0, 0)

        // Ajouter les mouvements
        if (this.moveForward) {
            this.velocity.add(moveDirection.multiplyScalar(this.moveSpeed))
        }
        if (this.moveBackward) {
            this.velocity.add(moveDirection.multiplyScalar(-this.moveSpeed))
        }
        if (this.moveRight) {
            this.velocity.add(right.multiplyScalar(this.moveSpeed))
        }
        if (this.moveLeft) {
            this.velocity.add(right.multiplyScalar(-this.moveSpeed))
        }

        // Normaliser la vélocité
        if (this.velocity.lengthSq() > this.moveSpeed * this.moveSpeed) {
            this.velocity.normalize().multiplyScalar(this.moveSpeed)
        }

        // Calculer la nouvelle position
        const newPosition = camera.position.clone().add(this.velocity)

        // Vérifier les limites
        const distanceFromCenter = Math.sqrt(
            newPosition.x * newPosition.x + 
            newPosition.z * newPosition.z
        )
        const maxRadius = 105.5

        // Appliquer le mouvement si dans les limites
        if (distanceFromCenter < maxRadius) {
            camera.position.x += this.velocity.x
            camera.position.z += this.velocity.z
            camera.position.y = 1.7
        }

        this.lastTime = time
    }
}