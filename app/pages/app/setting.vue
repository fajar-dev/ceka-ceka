<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Save, Globe, Sun, Moon, Coins, Check } from '@lucide/vue'
import { useCekaSettings } from '~/composables/useCekaSettings'
import { useCekaAuth } from '~/composables/useCekaAuth'

const { theme, language, currency, setTheme, setLanguage, setCurrency, t } = useCekaSettings()
const { user, isLoaded, fetchUser } = useCekaAuth()

const showSuccessMessage = ref(false)

const handleSave = () => {
  showSuccessMessage.value = true
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 2000)
}

const successToastMessage = ref('')
const isSyncing = ref(false)

const triggerToast = (msg: string) => {
  successToastMessage.value = msg
  showSuccessMessage.value = true
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 3000)
}

const connectGoogleContacts = () => {
  const width = 500
  const height = 620
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2
  
  isSyncing.value = true
  
  window.open(
    '/api/auth/google/contacts/login',
    'google_contacts_sync',
    `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=yes`
  )
}

const onAuthMessage = (event: MessageEvent) => {
  if (event.origin !== window.location.origin) return
  if (event.data?.type !== 'ceka_auth') return

  if (event.data?.query?.type === 'contacts' || event.data?.type === 'contacts') {
    isSyncing.value = false
    if (event.data.status === 'success') {
      fetchUser()
      triggerToast(
        language.value === 'en' 
          ? 'Google Contacts connected! Syncing in background...' 
          : 'Kontak Google terhubung! Sinkronisasi berjalan di latar belakang...'
      )
    } else {
      triggerToast(
        language.value === 'en' ? 'Failed to sync Google Contacts' : 'Gagal menyinkronkan Kontak Google'
      )
    }
  }
}

onMounted(() => {
  // Ensure settings are loaded
  if (process.client) {
    const savedTheme = (localStorage.getItem('ceka_theme') as 'light' | 'dark') || 'light'
    const savedLang = (localStorage.getItem('ceka_language') as 'id' | 'en') || 'id'
    const savedCurr = localStorage.getItem('ceka_currency') || 'Rp'
    setTheme(savedTheme)
    setLanguage(savedLang)
    setCurrency(savedCurr)
    window.addEventListener('message', onAuthMessage)
    fetchUser()
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('message', onAuthMessage)
  }
})

let autoSaveTimeout: any = null
const triggerAutoSave = () => {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout)
  triggerToast(t('saveSuccess'))
}

const updateTheme = (val: 'light' | 'dark') => {
  setTheme(val)
  triggerAutoSave()
}

const updateLanguage = (val: 'id' | 'en') => {
  setLanguage(val)
  triggerAutoSave()
}

const updateCurrency = (val: string) => {
  setCurrency(val)
  triggerAutoSave()
}
</script>

<template>
  <div class="neubrutal-container">
    <AppHeader :title="t('settingsTitle')" back-route="/app" />

    <main class="app-main">
      <section class="settings-content">
        
        <!-- Unified Settings Card -->
        <div class="settings-card neubrutal-box bg-white">
          <!-- Theme Setting Section -->
          <div class="setting-section">
            <div class="setting-item-header">
              <div class="setting-info">
                <h2 class="setting-label-title">
                  <Sun v-if="theme === 'light'" :size="18" />
                  <Moon v-else :size="18" />
                  {{ t('themeLabel') }}
                </h2>
                <p class="setting-desc">{{ t('themeDesc') }}</p>
              </div>
            </div>

            <div class="theme-toggle-grid">
              <button 
                type="button" 
                class="theme-btn neubrutal-box" 
                :class="{ active: theme === 'light' }"
                @click="updateTheme('light')"
              >
                <Sun :size="20" :stroke-width="2.5" />
                <span>{{ t('lightMode') }}</span>
              </button>
              
              <button 
                type="button" 
                class="theme-btn neubrutal-box" 
                :class="{ active: theme === 'dark' }"
                @click="updateTheme('dark')"
              >
                <Moon :size="20" :stroke-width="2.5" />
                <span>{{ t('darkMode') }}</span>
              </button>
            </div>
          </div>

          <div class="setting-divider"></div>

          <!-- Language Setting Section -->
          <div class="setting-section">
            <div class="setting-item-header">
              <div class="setting-info">
                <h2 class="setting-label-title"><Globe :size="18" /> {{ t('langLabel') }}</h2>
                <p class="setting-desc">{{ t('langDesc') }}</p>
              </div>
            </div>

            <div class="lang-selector-list">
              <button 
                type="button" 
                class="lang-btn neubrutal-box"
                :class="{ active: language === 'id' }"
                @click="updateLanguage('id')"
              >
                <span class="flag-icon">🇮🇩</span>
                <span class="lang-text">{{ t('langId') }}</span>
                <Check v-if="language === 'id'" :size="16" :stroke-width="3" class="check-icon" />
              </button>

              <button 
                type="button" 
                class="lang-btn neubrutal-box"
                :class="{ active: language === 'en' }"
                @click="updateLanguage('en')"
              >
                <span class="flag-icon">🇬🇧</span>
                <span class="lang-text">{{ t('langEn') }}</span>
                <Check v-if="language === 'en'" :size="16" :stroke-width="3" class="check-icon" />
              </button>
            </div>
          </div>

          <div class="setting-divider"></div>

          <!-- Currency Setting Section -->
          <div class="setting-section">
            <div class="setting-item-header">
              <div class="setting-info">
                <h2 class="setting-label-title"><Coins :size="18" /> {{ t('currLabel') }}</h2>
                <p class="setting-desc">{{ t('currDesc') }}</p>
              </div>
            </div>

            <div class="currency-grid">
              <button 
                v-for="curr in ['Rp', '$', 'S$', '€', '¥']" 
                :key="curr"
                type="button" 
                class="currency-btn neubrutal-box"
                :class="{ active: currency === curr }"
                @click="updateCurrency(curr)"
              >
                <span class="currency-symbol">{{ curr }}</span>
              </button>
            </div>
          </div>

          <div class="setting-divider"></div>

          <!-- Google Contacts Integration Section -->
          <div class="setting-section">
            <div class="setting-item-header">
              <div class="setting-info">
                <h2 class="setting-label-title">
                  <svg viewBox="0 0 21 20" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;"><g><path d="M20.3081 10.2303C20.3081 9.55056 20.253 8.86711 20.1354 8.19836H10.7031V12.0492H16.1046C15.8804 13.2911 15.1602 14.3898 14.1057 15.0879V17.5866H17.3282C19.2205 15.8449 20.3081 13.2728 20.3081 10.2303Z" fill="#3F83F8"></path><path d="M10.7019 20.0006C13.3989 20.0006 15.6734 19.1151 17.3306 17.5865L14.1081 15.0879C13.2115 15.6979 12.0541 16.0433 10.7056 16.0433C8.09669 16.0433 5.88468 14.2832 5.091 11.9169H1.76562V14.4927C3.46322 17.8695 6.92087 20.0006 10.7019 20.0006V20.0006Z" fill="#34A853"></path><path d="M5.08857 11.9169C4.66969 10.6749 4.66969 9.33008 5.08857 8.08811V5.51233H1.76688C0.348541 8.33798 0.348541 11.667 1.76688 14.4927L5.08857 11.9169V11.9169Z" fill="#FBBC04"></path><path d="M10.7019 3.95805C12.1276 3.936 13.5055 4.47247 14.538 5.45722L17.393 2.60218C15.5852 0.904587 13.1858 -0.0287217 10.7019 0.000673888C6.92087 0.000673888 3.46322 2.13185 1.76562 5.51234L5.08732 8.08813C5.87733 5.71811 8.09302 3.95805 10.7019 3.95805V3.95805Z" fill="#EA4335"></path></g></svg>
                  {{ language === 'en' ? 'Google Contacts Sync' : 'Sinkronisasi Kontak Google' }}
                </h2>
                <p class="setting-desc">
                  {{ language === 'en' ? 'Connect to Google Contacts to automatically import and sync split partners' : 'Hubungkan ke Kontak Google untuk impor & sinkronisasi otomatis daftar teman' }}
                </p>
              </div>
            </div>

            <!-- Connected Account State -->
            <div v-if="!isLoaded" class="connected-account-box neubrutal-box bg-white skeleton" style="min-height: 52px; border-color: transparent !important; margin-bottom: 8px;">
              <!-- Shimmer pulse connected account -->
            </div>
            <div v-else-if="user?.google_contacts_email" class="connected-account-box neubrutal-box bg-white">
              <div class="account-details-info">
                <span class="account-email-text">{{ user?.google_contacts_email }}</span>
                <span class="account-sync-time" v-if="user?.google_contacts_synced_at">
                  {{ language === 'en' ? 'Last synced: ' : 'Terakhir sinkron: ' }}
                  {{ new Date(user.google_contacts_synced_at).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
            </div>

            <div class="google-sync-wrapper">
              <NeubrutalButton 
                variant="primary" 
                custom-class="google-sync-btn" 
                @click="connectGoogleContacts"
                :disabled="isSyncing"
              >
                {{ isSyncing ? (language === 'en' ? 'Syncing in Background...' : 'Menyinkronkan di Latar Belakang...') : (user?.google_contacts_email ? (language === 'en' ? 'Re-sync Contacts' : 'Sinkron Ulang Kontak') : (language === 'en' ? 'Connect & Sync Google Contacts' : 'Hubungkan & Sinkronkan Kontak Google')) }}
              </NeubrutalButton>
            </div>
          </div>

          <!-- Floating Auto-save toast -->
          <transition name="fade">
            <div class="success-toast neubrutal-box" v-if="showSuccessMessage">
              <Check :size="18" :stroke-width="3" />
              <span>{{ successToastMessage }}</span>
            </div>
          </transition>
        </div>

      </section>
    </main>
  </div>
</template>

<style scoped>
.app-main {
  padding: 0 24px 100px;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-card {
  padding: 24px 20px;
  background: var(--box-bg);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-divider {
  height: 3px;
  background: #111;
  opacity: 0.15;
  margin: 4px 0;
}

.setting-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.setting-label-title {
  font-size: 1.05rem;
  font-weight: 900;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-desc {
  font-size: 0.75rem;
  color: var(--text-color-muted);
  font-weight: 700;
}

/* Theme Grid */
.theme-toggle-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: var(--box-bg);
  border-radius: 12px;
  border: 2.5px solid #111;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 2px 2px 0px #111;
  transition: transform 0.1s, box-shadow 0.1s;
}

.theme-btn.active {
  background: var(--mint-green) !important;
  box-shadow: 3.5px 3.5px 0px #111;
  transform: translate(-1.5px, -1.5px);
}

.theme-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px #111;
}

/* Language Selector List */
.lang-selector-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lang-btn {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--box-bg);
  border-radius: 12px;
  border: 2.5px solid #111;
  cursor: pointer;
  box-shadow: 2px 2px 0px #111;
  transition: transform 0.1s, box-shadow 0.1s;
  text-align: left;
}

.lang-btn.active {
  background: var(--soft-yellow) !important;
  box-shadow: 3.5px 3.5px 0px #111;
  transform: translate(-1.5px, -1.5px);
}

.lang-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px #111;
}

.flag-icon {
  font-size: 1.2rem;
  margin-right: 12px;
}

.lang-text {
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--text-color);
  flex: 1;
}

.check-icon {
  color: var(--text-color);
}

/* Currency Grid */
.currency-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.currency-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  background: var(--box-bg);
  border-radius: 10px;
  border: 2.5px solid #111;
  cursor: pointer;
  box-shadow: 1.5px 1.5px 0px #111;
  transition: transform 0.1s, box-shadow 0.1s;
}

.currency-btn.active {
  background: var(--pastel-blue) !important;
  box-shadow: 2.5px 2.5px 0px #111;
  transform: translate(-1px, -1px);
}

.currency-btn:active {
  transform: translate(0.5px, 0.5px);
  box-shadow: 1px 1px 0px #111;
}

.currency-symbol {
  font-size: 0.95rem;
  font-weight: 900;
  color: var(--text-color);
}

.google-sync-wrapper {
  margin-top: 4px;
}

:deep(.google-sync-btn) {
  background: var(--pastel-blue) !important;
  color: #111 !important;
  border: 3.5px solid #111 !important;
  box-shadow: 4px 4px 0px #111 !important;
  font-weight: 900 !important;
  font-size: 0.95rem !important;
  width: 100%;
  padding: 12px 16px !important;
  border-radius: 12px !important;
}

:deep(.google-sync-btn:active) {
  transform: translate(1.5px, 1.5px) !important;
  box-shadow: 2px 2px 0px #111 !important;
}

.success-toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 18px;
  background: var(--mint-green) !important;
  color: #111 !important;
  font-weight: 850;
  font-size: 0.85rem;
  border-radius: 12px;
  border: 3px solid #111;
  box-shadow: 3px 3px 0px #111;
  max-width: 320px;
  width: calc(100% - 32px);
  box-sizing: border-box;
  text-align: center;
  line-height: 1.35;
}

.connected-account-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--box-bg) !important;
  border-radius: 12px;
  border: 2.5px solid #111;
  box-shadow: 2px 2px 0px #111;
  text-align: left;
}

.google-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 2px solid #111;
  box-shadow: 1.5px 1.5px 0px #111;
  font-weight: 850;
  font-size: 0.75rem;
  color: #111;
  background: white !important;
  flex-shrink: 0;
}

.account-details-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.account-email-text {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.account-sync-time {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-color-muted);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -15px);
}
</style>
