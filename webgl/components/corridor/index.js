import * as THREE from 'three'

export default class Corridor {
    constructor(scene, materials, experience) {
        this.scene = scene
        this.experience = experience
        this.createCorridor(materials)
    }

    createCorridor(materials) {
        const width = 4
        const length = 20
        const height = 4
        const wallThickness = 1

        // Sol
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(width, length),
            materials.items.floor
        )
        floor.rotation.x = -Math.PI / 2
        floor.position.set(length/2, 0, 0)
        this.scene.add(floor)

        // Plafond
        const ceiling = floor.clone()
        ceiling.position.y = height
        this.scene.add(ceiling)

        // Murs latéraux
        const wallGeometry = new THREE.BoxGeometry(length, height, wallThickness)
        
        // Mur gauche
        const leftWall = new THREE.Mesh(wallGeometry, materials.items.wall)
        leftWall.position.set(length/2, height/2, width/2)
        leftWall.rotation.y = Math.PI / 2
        this.scene.add(leftWall)
        this.experience.walls.push(leftWall)

        // Mur droit
        const rightWall = leftWall.clone()
        rightWall.position.z = -width/2
        this.scene.add(rightWall)
        this.experience.walls.push(rightWall)
    }
}