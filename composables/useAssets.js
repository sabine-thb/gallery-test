export function useAssets() {
  // En développement, utiliser les chemins absolus
  // En production, s'assurer que les chemins sont corrects
  const getAssetPath = (path) => {
    // Enlever le slash initial si présent
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // En production sur Vercel, essayer d'abord avec le chemin absolu
    // Si cela échoue, essayer avec import.meta.url
    if (process.env.NODE_ENV === 'production') {
      return `/${cleanPath}`;
    }
    
    return `/${cleanPath}`;
  };

  const getModelPath = (modelPath) => getAssetPath(`3dModels/${modelPath}`);
  const getTexturePath = (texturePath) => getAssetPath(`textures/${texturePath}`);
  const getAudioPath = (audioPath) => getAssetPath(`audio/${audioPath}`);
  const getVideoPath = (videoPath) => getAssetPath(`video/${videoPath}`);

  return {
    getAssetPath,
    getModelPath,
    getTexturePath,
    getAudioPath,
    getVideoPath
  };
}
