# Galerie 3D Sentiers - Expérience Immersive

Une galerie d'art virtuelle interactive développée avec Nuxt.js et Three.js, offrant une expérience immersive de navigation dans différentes salles d'exposition.

## 🎨 Fonctionnalités

### Navigation 3D
- **Contrôles FPS** : Navigation libre avec pointer lock
- **Système de collision** : Détection des collisions avec les murs et objets
- **Détection des tableaux** : Interaction avec les œuvres d'art par survol

### Architecture Modulaire
- **Chargement par salle** : Chaque pièce (Martin, Brigitte, JCD, Couloir) gère ses propres modèles
- **Gestion précise** : Contrôle individuel des emplacements, textures et matériaux
- **Optimisation** : Chargement progressif avec indicateur de progression

### Audio Immersif
- **Audio positionnel** : Son spatialisé en 3D pour chaque salle
- **Contrôle global** : Bouton de mute/unmute pour toute l'expérience
- **Vidéo de projection** : Écran de projection dans le couloir avec contrôle audio

### Données Centralisées
- **Configuration JSON** : Toutes les métadonnées des œuvres dans `oeuvres.json`
- **Gestion des assets** : Organisation structurée des modèles 3D, textures et audio

## 🚀 Installation

Installez les dépendances :

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## 🛠 Développement

Lancez le serveur de développement sur `http://localhost:3000` :

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## 🔧 Dépannage

### Problèmes de cache
Si l'expérience rencontre des problèmes, supprimez le dossier de cache Nuxt :

```bash
rm -rf .nuxt
```

Puis relancez le serveur de développement.

### Problèmes de chargement
- Vérifiez que tous les assets (modèles 3D, textures, audio) sont présents dans `/public/`
- Consultez la console du navigateur pour les erreurs de chargement
- Le loader affiche la progression du chargement des 16 assets

## 📁 Structure du Projet

```
├── components/          # Composants Vue (UI, contrôles, loader)
├── webgl/              # Système 3D Three.js
│   ├── scenes/         # Scene principale (experience.js)
│   ├── components/     # Salles 3D (Martin, Brigitte, JCD, Couloir)
│   └── modules/        # Modules (caméra, collision, contrôles, rendu)
├── public/             # Assets statiques
│   ├── 3dModels/       # Modèles 3D (.glb)
│   ├── textures/       # Textures par salle
│   ├── audio/          # Fichiers audio positionnels
│   └── video/          # Vidéos (intro + projection)
└── oeuvres.json        # Métadonnées des œuvres d'art
```

## 🎯 Salles Disponibles

1. **Salle Martin** : Exposition avec audio Ravel
2. **Salle Brigitte** : Exposition avec arbre 3D et audio Ladiaba
3. **Salle JCD** : Bibliothèque avec audio Albumblätter
4. **Couloir** : Hall d'accueil avec écran de projection

## 🏗 Production

Construire l'application pour la production :

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Prévisualiser la build de production :

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Consultez la [documentation de déploiement Nuxt](https://nuxt.com/docs/getting-started/deployment) pour plus d'informations.

## 🎮 Contrôles

- **WASD** : Déplacement
- **Souris** : Rotation de la caméra
- **Clic** : Verrouillage du pointeur / Sélection des tableaux
- **Survol** : Affichage des informations sur les œuvres

## 🔊 Audio

- Audio positionnel 3D dans chaque salle
- Contrôle global du volume
- Gestion automatique lors de la vidéo d'introduction
