export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  // SPA: o app precisa abrir sem internet a partir do cache do service worker
  ssr: false,
  devtools: { enabled: false },
  modules: ['nuxt-auth-utils', '@vite-pwa/nuxt'],
  css: [
    '@fontsource/dm-sans/400.css',
    '@fontsource/dm-sans/500.css',
    '@fontsource/dm-sans/700.css',
    '~/assets/css/main.css',
  ],
  app: {
    pageTransition: { name: 'pagina', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      title: 'Protocolo IATF',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#1F5C45' },
        { name: 'description', content: 'DG e protocolo IATF em campo, mesmo sem internet.' },
      ],
      link: [
        { rel: 'icon', href: '/icon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/icon-192.png' },
      ],
    },
  },
  runtimeConfig: {
    session: { maxAge: 60 * 60 * 24 * 60 },
  },
  nitro: {
    prerender: { routes: ['/'] },
    // São Paulo, perto do banco no Neon (aws-sa-east-1)
    vercel: { functions: { regions: ['gru1'] } },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Protocolo IATF',
      short_name: 'IATF',
      description: 'DG e protocolo IATF em campo, mesmo sem internet.',
      lang: 'pt-BR',
      theme_color: '#1F5C45',
      background_color: '#F2F5F1',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api\//],
      globPatterns: ['**/*.{js,css,html,woff2,woff,png,svg,ico}'],
    },
    // Guarda o pedido de instalação do navegador para o botão "Instalar app" (CartaoInstalar)
    client: { installPrompt: true },
    devOptions: { enabled: false },
  },
})
