import * as THREE from 'three'

export default class MainCamera {
    constructor() {
        this.instance = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        )
        this.instance.position.set(0, 0, 0)
    }

    resize() {
        this.instance.aspect = window.innerWidth / window.innerHeight
        this.instance.updateProjectionMatrix()
    }
}