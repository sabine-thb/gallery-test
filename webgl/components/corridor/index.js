import * as THREE from 'three'

export default class Corridor {
    constructor(scene, materials, experience) {
        this.scene = new THREE.Group()
        
        // Dimensions du corridor
        const width = 3  // Largeur du corridor
        const length = 15 // Longueur du corridor
        const height = 4  // Hauteur des murs
        
        // Sol
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.1, length),
            materials.items.floor
        )
        floor.position.y = -0.05
        floor.receiveShadow = true
        
        // Murs latéraux
        const wallGeometry = new THREE.BoxGeometry(0.1, height, length)
        
        // Mur gauche
        const leftWall = new THREE.Mesh(wallGeometry, materials.items.wall)
        leftWall.position.set(-width/2, height/2, 0)
        leftWall.castShadow = true
        leftWall.receiveShadow = true
        
        // Mur droit
        const rightWall = new THREE.Mesh(wallGeometry, materials.items.wall)
        rightWall.position.set(width/2, height/2, 0)
        rightWall.castShadow = true
        rightWall.receiveShadow = true
        
        // Plafond
        const ceiling = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.1, length),
            materials.items.ceiling
        )
        ceiling.position.y = height
        
        // Ajouter à la scène
        this.scene.add(floor, leftWall, rightWall, ceiling)
        scene.add(this.scene)
        
        // Ajouter les murs aux collisions
        experience.walls.push(leftWall, rightWall)
    }
}