import * as THREE from 'three'

export default class Renderer {
    constructor(canvas, options = {}) {
        if (!canvas) {
            console.error("Renderer: Le canvas fourni est null ou undefined.");
            return;
        }
        if (!(canvas instanceof HTMLCanvasElement)) {
            console.error("Renderer: L'objet fourni n'est pas un élément HTMLCanvasElement valide.", canvas);
            return;
        }
        console.log("Renderer: Initialisation avec le canvas :", canvas);

        this.instance = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false, // Désactiver la transparence pour avoir un fond opaque
            ...options
        })

        this.instance.setClearColor(0x000000, 1) // Fond noir opaque
        this.instance.setSize(window.innerWidth, window.innerHeight)
        this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        this.instance.shadowMap.enabled = true
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap
    }
    render(scene, camera) {
        if (this.instance) {
            this.instance.render(scene, camera)
        } else {
            console.warn("Renderer: Impossible de rendre, l'instance du renderer n'est pas initialisée.");
        }
    }

    resize() {
        if (this.instance) {
            this.instance.setSize(window.innerWidth, window.innerHeight)
            this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        } else {
            console.warn("Renderer: Impossible de redimensionner, l'instance du renderer n'est pas initialisée.");
        }
    }
}