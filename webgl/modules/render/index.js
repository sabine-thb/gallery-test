import * as THREE from 'three'

export default class Renderer {
    constructor(canvas, options = {}) {
        this.instance = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            ...options
        })
        
        this.instance.setSize(window.innerWidth, window.innerHeight)
        this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.instance.shadowMap.enabled = true
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap
    }

    render(scene, camera) {
        this.instance.render(scene, camera)
    }

    resize() {
        this.instance.setSize(window.innerWidth, window.innerHeight)
    }
}