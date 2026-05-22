<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useCekaSettings } from '~/composables/useCekaSettings'
import { useCekaAuth } from '~/composables/useCekaAuth'

const { loadSettings, t } = useCekaSettings()
const { fetchUser } = useCekaAuth()
const isLoggingIn = ref(false)

const openGooglePopup = () => {
  const width = 500
  const height = 620
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2
  isLoggingIn.value = true
  window.open(
    '/api/auth/google/login',
    'google_login',
    `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=yes`
  )
}

const onAuthMessage = async (event: MessageEvent) => {
  if (event.origin !== window.location.origin) return
  if (event.data?.type !== 'ceka_auth') return

  isLoggingIn.value = false
  if (event.data.status === 'success') {
    await fetchUser()
    navigateTo('/app')
  }
}

onMounted(() => {
  loadSettings()
  window.addEventListener('message', onAuthMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', onAuthMessage)
})
</script>

<template>
  <div class="neubrutal-container">
    <LandingIllustration />

    <main class="main-content">
      <div class="text-center">
        <h1 class="main-title" v-html="t('landingTitle')"></h1>
        <p class="subtitle">{{ t('landingSubtitle') }}</p>
      </div>

      <LandingTechBadges />

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="neubrutal-btn primary" :disabled="isLoggingIn" @click="openGooglePopup" style="color: #000; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;">
          <svg viewBox="0 0 21 20" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M20.3081 10.2303C20.3081 9.55056 20.253 8.86711 20.1354 8.19836H10.7031V12.0492H16.1046C15.8804 13.2911 15.1602 14.3898 14.1057 15.0879V17.5866H17.3282C19.2205 15.8449 20.3081 13.2728 20.3081 10.2303Z" fill="#3F83F8"></path><path d="M10.7019 20.0006C13.3989 20.0006 15.6734 19.1151 17.3306 17.5865L14.1081 15.0879C13.2115 15.6979 12.0541 16.0433 10.7056 16.0433C8.09669 16.0433 5.88468 14.2832 5.091 11.9169H1.76562V14.4927C3.46322 17.8695 6.92087 20.0006 10.7019 20.0006V20.0006Z" fill="#34A853"></path><path d="M5.08857 11.9169C4.66969 10.6749 4.66969 9.33008 5.08857 8.08811V5.51233H1.76688C0.348541 8.33798 0.348541 11.667 1.76688 14.4927L5.08857 11.9169V11.9169Z" fill="#FBBC04"></path><path d="M10.7019 3.95805C12.1276 3.936 13.5055 4.47247 14.538 5.45722L17.393 2.60218C15.5852 0.904587 13.1858 -0.0287217 10.7019 0.000673888C6.92087 0.000673888 3.46322 2.13185 1.76562 5.51234L5.08732 8.08813C5.87733 5.71811 8.09302 3.95805 10.7019 3.95805V3.95805Z" fill="#EA4335"></path></g></svg>
          <span style="margin-left: 8px;">{{ isLoggingIn ? 'Menunggu...' : t('loginGoogle') }}</span>
        </button>
      </div>

      <LandingFeatures />

      <footer class="landing-footer">
        <NuxtLink to="/privacy" class="footer-link">Privacy Policy</NuxtLink>
        <span class="footer-dot">•</span>
        <NuxtLink to="/terms" class="footer-link">Terms of Service</NuxtLink>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.main-content {
  padding: 0 24px 100px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-title {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 12px;
  color: #111;
}

.subtitle {
  font-size: 1.1rem;
  font-weight: 500;
  color: #444;
  margin-bottom: 24px;
}

.text-center { text-align: center; }

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.landing-footer {
  margin-top: auto;
  padding-top: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.footer-link {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-color-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: var(--text-color);
  text-decoration: underline;
}

.footer-dot {
  color: var(--text-color-muted);
  font-size: 0.85rem;
}
</style>
