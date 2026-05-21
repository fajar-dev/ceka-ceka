<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Save, Globe, Sun, Moon, Coins, Check } from '@lucide/vue'
import { useCekaSettings } from '~/composables/useCekaSettings'

const { theme, language, currency, setTheme, setLanguage, setCurrency, t } = useCekaSettings()

const showSuccessMessage = ref(false)

const handleSave = () => {
  showSuccessMessage.value = true
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 2000)
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
  }
})
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
                @click="setTheme('light')"
              >
                <Sun :size="20" :stroke-width="2.5" />
                <span>{{ t('lightMode') }}</span>
              </button>
              
              <button 
                type="button" 
                class="theme-btn neubrutal-box" 
                :class="{ active: theme === 'dark' }"
                @click="setTheme('dark')"
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
                @click="setLanguage('id')"
              >
                <span class="flag-icon">🇮🇩</span>
                <span class="lang-text">{{ t('langId') }}</span>
                <Check v-if="language === 'id'" :size="16" :stroke-width="3" class="check-icon" />
              </button>

              <button 
                type="button" 
                class="lang-btn neubrutal-box"
                :class="{ active: language === 'en' }"
                @click="setLanguage('en')"
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
                @click="setCurrency(curr)"
              >
                <span class="currency-symbol">{{ curr }}</span>
              </button>
            </div>
          </div>

          <div class="setting-divider"></div>

          <!-- Save Button / Success Feedback (Inside the Card) -->
          <div class="actions-wrapper">
            <transition name="fade">
              <div class="success-toast neubrutal-box" v-if="showSuccessMessage">
                <Check :size="18" :stroke-width="3" />
                <span>{{ t('saveSuccess') }}</span>
              </div>
            </transition>

            <NeubrutalButton variant="primary" custom-class="save-settings-btn" @click="handleSave">
              <Save :size="18" :stroke-width="3" /> {{ t('saveBtn') }}
            </NeubrutalButton>
          </div>
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

/* Save Actions & Toast */
.actions-wrapper {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

:deep(.save-settings-btn) {
  background: var(--mint-green) !important;
  border: 3.5px solid #111 !important;
  box-shadow: 4px 4px 0px #111 !important;
  font-weight: 900 !important;
  font-size: 1.05rem !important;
  width: 100%;
}

.success-toast {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #4ADE80; /* Bright mint green success */
  color: #111;
  font-weight: 850;
  font-size: 0.85rem;
  border-radius: 12px;
  border: 2.5px solid #111;
  box-shadow: 2px 2px 0px #111;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
