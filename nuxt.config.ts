// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'CekaCeka - Foto Struk, Bagi Tagihan, Selesai!',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'description', content: 'Foto struk, bagi tagihan, selesai! CekaCeka adalah aplikasi pembagi tagihan (bill splitter) cerdas yang praktis, cepat, dan akurat.' },
        { name: 'theme-color', content: '#F8F6F2' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'CekaCeka' },
        // Open Graph / Facebook SEO Card
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'CekaCeka - Foto Struk, Bagi Tagihan, Selesai!' },
        { property: 'og:description', content: 'Pindai struk belanja, bagi porsi patungan secara akurat, dan selesaikan tagihan tanpa selisih. CekaCeka praktis & transparan!' },
        { property: 'og:image', content: '/bg-card.png' },
        { property: 'og:url', content: 'https://cekaceka.app' },
        { property: 'og:site_name', content: 'CekaCeka' },
        // Twitter SEO Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'CekaCeka - Foto Struk, Bagi Tagihan, Selesai!' },
        { name: 'twitter:description', content: 'Pindai struk belanja, bagi porsi patungan secara akurat, dan selesaikan tagihan tanpa selisih. CekaCeka praktis & transparan!' },
        { name: 'twitter:image', content: '/bg-card.png' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'apple-touch-icon', href: '/icons/icon_192x192.png' }
      ]
    }
  },
  css: ['~/assets/css/main.css']
})
