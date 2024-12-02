import * as THREE from 'three'

export default class Room1 {
    constructor(scene, materials, experience) {
        this.scene = new THREE.Group()
        this.experience = experience
        
        // Dimensions
        this.config = {
            width: 15,
            length: 15,
            height: 4,
            wallThickness: 0.2,
            doorWidth: 3
        }
        
        // Création de la texture vidéo
        this.video = document.createElement('video')
        this.video.src = '/video/video.mp4'
        this.video.loop = true
        this.video.muted = true
        this.video.playsInline = true
        this.video.crossOrigin = 'anonymous'
        
        // Créer la texture vidéo
        this.videoTexture = new THREE.VideoTexture(this.video)
        this.videoTexture.minFilter = THREE.LinearFilter
        this.videoTexture.magFilter = THREE.LinearFilter
        this.videoTexture.format = THREE.RGBFormat
        this.videoTexture.colorSpace = THREE.SRGBColorSpace

        // Shader personnalisé pour le blur sur les bords
        this.videoMaterial = new THREE.ShaderMaterial({
            uniforms: {
                videoTexture: { value: this.videoTexture },
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(1024, 512) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D videoTexture;
                varying vec2 vUv;

                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(vUv, center);
                    
                    // Effet de blur sur les bords
                    float blur = smoothstep(0.3, 0.7, dist);
                    
                    vec4 videoColor = texture2D(videoTexture, vUv);
                    gl_FragColor = mix(videoColor, vec4(0.0, 0.0, 0.0, 1.0), blur);
                }
            `
        });

        // Démarrer la vidéo quand l'expérience commence
        document.addEventListener('click', () => {
            this.video.play()
        }, { once: true })
        
        this.createStructure(materials)
        scene.add(this.scene)
    }

    createStructure(materials) {
        // Création du sol
        this.createFloor(materials.items.floor)
        
        // Création du plafond
        this.createCeiling(materials.items.ceiling)
        
        // Création des murs
        this.createWalls(materials.items.wall)
    }

    createFloor(material) {
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(
                this.config.width, 
                this.config.wallThickness, 
                this.config.length
            ),
            material
        )
        floor.position.y = -this.config.wallThickness / 2
        floor.receiveShadow = true
        this.scene.add(floor)
    }

    createCeiling(material) {
        const ceiling = new THREE.Mesh(
            new THREE.BoxGeometry(
                this.config.width, 
                this.config.wallThickness, 
                this.config.length
            ),
            material
        )
        ceiling.position.y = this.config.height + this.config.wallThickness / 2
        ceiling.receiveShadow = true
        this.scene.add(ceiling)
    }

    createWalls(material) {
        // Mur arrière (avec la vidéo)
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(
                this.config.width,
                this.config.height,
                this.config.wallThickness
            ),
            material
        )
        backWall.position.set(0, this.config.height/2, this.config.length/2)
        backWall.castShadow = true
        backWall.receiveShadow = true
        this.scene.add(backWall)
        this.experience.walls.push(backWall)

        // Mur avec vidéo (75% de la taille du mur)
        const videoWidth = this.config.width * 0.75
        const videoHeight = (videoWidth / 16) * 9 // Ratio 16:9
        const videoWall = new THREE.Mesh(
            new THREE.PlaneGeometry(videoWidth, videoHeight),
            this.videoMaterial
        )
        videoWall.position.set(
            0, 
            this.config.height/2, 
            this.config.length/2 - this.config.wallThickness - 0.01
        )
        videoWall.rotation.y = Math.PI
        videoWall.receiveShadow = true
        this.scene.add(videoWall)

        // Murs latéraux
        const sideWallGeometry = new THREE.BoxGeometry(
            this.config.wallThickness,
            this.config.height,
            this.config.length
        )

        // Mur gauche
        const leftWall = new THREE.Mesh(sideWallGeometry, material)
        leftWall.position.set(-this.config.width/2, this.config.height/2, 0)
        leftWall.castShadow = true
        leftWall.receiveShadow = true
        this.scene.add(leftWall)
        this.experience.walls.push(leftWall)

        // Mur droit
        const rightWall = new THREE.Mesh(sideWallGeometry, material)
        rightWall.position.set(this.config.width/2, this.config.height/2, 0)
        rightWall.castShadow = true
        rightWall.receiveShadow = true
        this.scene.add(rightWall)
        this.experience.walls.push(rightWall)

        // Nouveaux murs avant (similaires à Room2)
        const frontWalls = [
            // Mur avant gauche
            {
                geometry: new THREE.BoxGeometry((this.config.width - this.config.doorWidth * 2), this.config.height, this.config.wallThickness),
                position: [-this.config.width/1.68 + this.config.doorWidth, this.config.height/2, -this.config.length/2]
            },
            // Mur avant droit
            {
                geometry: new THREE.BoxGeometry((this.config.width - this.config.doorWidth * 2), this.config.height, this.config.wallThickness),
                position: [this.config.width/1.68 - this.config.doorWidth, this.config.height/2, -this.config.length/2]
            },
        ]

        frontWalls.forEach(wallConfig => {
            const wall = new THREE.Mesh(wallConfig.geometry, material)
            wall.position.set(...wallConfig.position)
            wall.castShadow = true
            wall.receiveShadow = true
            this.scene.add(wall)
            this.experience.walls.push(wall)
        })
    }

    update() {
        // Mettre à jour le temps pour le shader si nécessaire
        if (this.videoMaterial.uniforms) {
            this.videoMaterial.uniforms.time.value += 0.01
        }
    }
}