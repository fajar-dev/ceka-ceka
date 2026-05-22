import { useState } from '#app'
import { computed } from 'vue'

export interface User {
  id: string
  email: string
  name: string
  avatar: string
  google_contacts_email?: string
  google_contacts_synced_at?: string
  created_at: string
}

export const useCekaAuth = () => {
  const user = useState<User | null>('ceka_user', () => null)
  const isLoaded = useState<boolean>('ceka_auth_loaded', () => false)

  const isLoggedIn = computed(() => !!user.value)

  const fetchUser = async () => {
    try {
      const fetch = useRequestFetch()
      const data = await fetch<{ user: User | null }>('/api/auth/me')
      user.value = data.user
    } catch (e) {
      console.error('Failed to fetch authenticated user:', e)
      user.value = null
    } finally {
      isLoaded.value = true
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
      
      // Hapus seluruh history/data lokal di browser milik user sebelumnya, tapi pertahankan preferensi
      if (typeof window !== 'undefined') {
        const theme = window.localStorage.getItem('ceka_theme')
        const language = window.localStorage.getItem('ceka_language')
        const currency = window.localStorage.getItem('ceka_currency')

        window.localStorage.clear()
        window.sessionStorage.clear()

        if (theme) window.localStorage.setItem('ceka_theme', theme)
        if (language) window.localStorage.setItem('ceka_language', language)
        if (currency) window.localStorage.setItem('ceka_currency', currency)
      }
      
      window.location.href = '/'
    } catch (e) {
      console.error('Logout request failed:', e)
    }
  }

  return {
    user,
    isLoaded,
    isLoggedIn,
    fetchUser,
    logout
  }
}
