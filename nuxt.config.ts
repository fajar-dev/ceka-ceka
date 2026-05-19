// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'BillSplit - Split Bill Tanpa Pusing',
      meta: [
        { name: 'description', content: 'Foto struk, bagi tagihan, selesai! BillSplit.' },
        { name: 'theme-color', content: '#F8F6F2' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap' }
      ]
    }
  },
  css: ['~/assets/css/main.css']
})
