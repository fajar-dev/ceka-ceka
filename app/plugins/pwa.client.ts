import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(() => {
  if (process.client && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('CekaCeka PWA Service Worker registered with scope:', registration.scope)
        })
        .catch((error) => {
          console.error('CekaCeka PWA Service Worker registration failed:', error)
        })
    })
  }
})
