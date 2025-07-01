// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  build: {
    transpile: ['three'],
  },
  nitro: {
    publicAssets: [
      {
        baseURL: '/',
        dir: 'public',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      }
    ]
  },
  app: {
    head: {
      meta: [
        {
          name: 'Cross-Origin-Embedder-Policy',
          content: 'credentialless'
        },
        {
          name: 'Cross-Origin-Opener-Policy',
          content: 'same-origin'
        }
      ]
    }
  }
});
