import * as THREE from 'three'

export default class Room2 {
    constructor(scene, materials, experience) {
        this.scene = scene
        this.experience = experience
        this.createRoom(materials)
    }

    createRoom(materials) {
        const width = 20
        const depth = 20
        const height = 4
        const wallThickness = 0.2
        const doorWidth = 3
        const roomPosition = new THREE.Vector3(30, 0, 0)

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(width, depth),
            materials.items.floor
        )
        floor.rotation.x = -Math.PI / 2
        floor.position.copy(roomPosition)
        this.scene.add(floor)

        const ceiling = floor.clone()
        ceiling.position.y = height
        this.scene.add(ceiling)

        const walls = [
            { pos: [roomPosition.x - width/1.75 + doorWidth, height/2, roomPosition.z - depth/2], rot: [0, 0, 0], size: [(width - doorWidth * 2), height, wallThickness] },
            { pos: [roomPosition.x + width/1.75 - doorWidth, height/2, roomPosition.z - depth/2], rot: [0, 0, 0], size: [(width - doorWidth * 2), height, wallThickness] },
            { pos: [roomPosition.x, height/2, roomPosition.z + depth/2], rot: [0, 0, 0], size: [width, height, wallThickness] },
            { pos: [roomPosition.x - width/2, height/2, roomPosition.z], rot: [0, Math.PI/2, 0], size: [depth, height, wallThickness] },
            { pos: [roomPosition.x + width/2, height/2, roomPosition.z], rot: [0, -Math.PI/2, 0], size: [depth, height, wallThickness] },
        ]

        walls.forEach(wall => {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(...wall.size),
                materials.items.wall
            )
            mesh.position.set(...wall.pos)
            mesh.rotation.set(...wall.rot)
            mesh.castShadow = true
            mesh.receiveShadow = true
            this.scene.add(mesh)
            this.experience.walls.push(mesh)
        })
    }
}