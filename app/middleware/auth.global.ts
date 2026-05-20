import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useCekaAuth } from '../composables/useCekaAuth'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const auth = useCekaAuth()
  
  // Load session status from server on initial startup
  if (!auth.isLoaded.value) {
    await auth.fetchUser()
  }

  const isAuthPage = to.path.startsWith('/app')
  const isLandingPage = to.path === '/'

  if (isAuthPage && !auth.isLoggedIn.value) {
    return navigateTo('/')
  }

  if (isLandingPage && auth.isLoggedIn.value) {
    return navigateTo('/app')
  }
})
