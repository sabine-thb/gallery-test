import * as THREE from 'three'

export default class Room3 {
    constructor(scene, materials, experience) {
        this.scene = new THREE.Group()
        this.mainScene = scene
        this.experience = experience
        this.createRoom(materials)
        this.setupSpotLight()
    }

    setupSpotLight() {
        // Charger la texture
        const textureLoader = new THREE.TextureLoader()
        const texture = textureLoader.load('./textures/disturb.jpg')
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.generateMipmaps = false
        texture.colorSpace = THREE.SRGBColorSpace

        // Créer le spotlight avec les mêmes valeurs initiales que dans le GUI
        this.spotLight = new THREE.SpotLight(0xffffff, 500)
        this.spotLight.position.set(-4.3, 3.3, 3.1)
        this.spotLight.angle = 2
        this.spotLight.penumbra = 1
        this.spotLight.decay = 1
        this.spotLight.distance = 20
        this.spotLight.map = texture

        // Configuration des ombres avec de meilleurs paramètres
        this.spotLight.castShadow = true
        this.spotLight.shadow.mapSize.width = 2048
        this.spotLight.shadow.mapSize.height = 2048
        this.spotLight.shadow.camera.near = 0.1
        this.spotLight.shadow.camera.far = 30
        this.spotLight.shadow.focus = 1
        this.spotLight.shadow.bias = -0.0001
        this.spotLight.shadow.normalBias = 0.02

        // Créer et positionner la target du spotlight
        this.spotLight.target = new THREE.Object3D()
        this.spotLight.target.position.set(
            this.spotLight.position.x,
            0,
            this.spotLight.position.z
        )
        this.scene.add(this.spotLight.target)

        this.scene.add(this.spotLight)

        // Créer le helper et le stocker dans une propriété de classe
        this.lightHelper = new THREE.SpotLightHelper(this.spotLight)
        this.scene.add(this.lightHelper)
    }

    // Ajouter une méthode pour mettre à jour le helper
    updateHelper() {
        if (this.lightHelper) {
            this.lightHelper.update()
        }
    }

    createRoom(materials) {
        const segments = 32
        const radius = 5
        const height = 10
        const wallThickness = 0.01
        
        const geometry = new THREE.CylinderGeometry(
            radius,
            radius,
            height,
            segments,
            1,
            true,
            0,
            5.68
        )
        
        const wallMaterial = materials.items.wall.clone()
        wallMaterial.side = THREE.DoubleSide

        const radiusFloor = 7;
        
        const cylinder = new THREE.Mesh(geometry, wallMaterial)
        cylinder.position.y = height / 2
        cylinder.castShadow = true
        cylinder.receiveShadow = true
        cylinder.rotation.y = Math.PI / 1.30
        this.scene.add(cylinder)

        for (let i = 0; i < segments - 4; i++) {
            const angle = (i / segments) * Math.PI * 2
            const wallBox = new THREE.Mesh(
                new THREE.BoxGeometry(wallThickness, height, 2 * radius * Math.sin(Math.PI / segments)),
                new THREE.MeshBasicMaterial({ visible: false })
            )
            
            wallBox.position.set(
                radius * Math.cos(angle),
                height / 2,
                radius * Math.sin(angle)
            )
            wallBox.rotation.y = -angle - Math.PI / segments
            
            this.scene.add(wallBox)
            this.experience.walls.push(wallBox)
        }

        const floor = new THREE.Mesh(
            new THREE.CircleGeometry(radiusFloor, segments),
            materials.items.floor
        )
        floor.rotation.x = -Math.PI / 2
        floor.receiveShadow = true
        floor.position.y = 0.01
        this.scene.add(floor)

        const ceiling = floor.clone()
        ceiling.position.y = height
        this.scene.add(ceiling)

        this.mainScene.add(this.scene)
    }
}