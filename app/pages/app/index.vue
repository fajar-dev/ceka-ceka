<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Settings, LogOut, Camera, PenTool, Sparkles, FileText, Pizza, Coffee, Plus } from '@lucide/vue'
import { useCekaSettings } from '~/composables/useCekaSettings'
import { useCekaFriends } from '~/composables/useCekaFriends'
import { useCekaHistory } from '~/composables/useCekaHistory'
import { useCekaAuth } from '~/composables/useCekaAuth'

const { currency, loadSettings, t, language, theme } = useCekaSettings()
const { listFriendsOnly, loadFriends } = useCekaFriends()
const { history, loadHistory } = useCekaHistory()
const { user, logout } = useCekaAuth()

const isDropdownOpen = ref(false)

const unpaidAmount = ref(0)
const unpaidBillCount = ref(0)
const isLoading = ref(true)

const loadSummary = async () => {
  try {
    const data = await $fetch<{ unpaidAmount: number; unpaidBillCount: number }>('/api/bills/summary')
    unpaidAmount.value = data.unpaidAmount
    unpaidBillCount.value = data.unpaidBillCount
  } catch (e) {
    console.error('Failed to load summary:', e)
  }
}

onMounted(async () => {
  loadSettings()
  try {
    await Promise.all([
      loadFriends(),
      loadHistory(),
      loadSummary()
    ])
  } catch (err) {
    console.error('Error loading dashboard:', err)
  } finally {
    isLoading.value = false
  }
})

const getIconComponent = (type: string) => {
  switch (type) {
    case 'pizza': return Pizza
    case 'coffee': return Coffee
    default: return FileText
  }
}

const formatCurrency = (val: number) => {
  const formatted = new Intl.NumberFormat('id-ID').format(val)
  return `${currency.value} ${formatted}`
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}
</script>

<template>
  <div class="neubrutal-container">
    <header class="app-header">
      <div class="logo-wrapper">
        <img :src="theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'" alt="CekaCeka" class="app-logo" />
      </div>
      <div class="user-profile-wrapper">
        <div class="dropdown-overlay" v-if="isDropdownOpen" @click="isDropdownOpen = false"></div>
        
        <div class="user-avatar neubrutal-box" @click="isDropdownOpen = !isDropdownOpen">
          <img :src="user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'" alt="User Avatar" class="avatar-img" />
        </div>
        
        <!-- Dropdown Menu -->
        <div class="avatar-dropdown neubrutal-box" v-if="isDropdownOpen">
          <div class="dropdown-user-greeting">Hi!, {{ user?.name }} </div>
          <div class="dropdown-divider"></div>
          <NuxtLink to="/app/setting" class="dropdown-item" @click="isDropdownOpen = false" style="text-decoration: none; display: flex; align-items: center; color: inherit;">
            <Settings :size="18" />
            <span style="margin-left: 6px; font-weight: 850;">{{ t('settingsTitle') }}</span>
          </NuxtLink>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item text-red" @click="logout" style="display: flex; align-items: center;">
            <LogOut :size="18" />
            <span style="margin-left: 6px; font-weight: 850;">{{ language === 'en' ? 'Logout' : 'Keluar' }}</span>
          </div>
        </div>
      </div>
    </header>

    <main class="app-main">
      <!-- Summary / Illustration Card -->
      <section class="summary-section">
        <div v-if="isLoading" class="summary-card neubrutal-box skeleton" style="border-color: transparent !important; min-height: 125px;">
          <!-- Empty for background shimmer pulse -->
        </div>
        <div v-else class="summary-card neubrutal-box bg-mint">
          <div class="summary-content">
            <p class="summary-label">{{ t('unpaidBill') }}</p>
            <h2 class="summary-amount">{{ formatCurrency(unpaidAmount) }}</h2>
            <div class="summary-badge">{{ unpaidBillCount }} {{ t('waitingPayment') }}</div>
          </div>
          <div class="summary-illustration">
            <div class="mini-receipt">
              <div class="line"></div>
              <div class="line"></div>
              <div class="line short"></div>
              <div class="total-line"></div>
            </div>
            <Sparkles class="sparkle sp-1" :size="32" color="#F2C94C" fill="#F2C94C" />
            <Sparkles class="sparkle sp-2" :size="32" color="#F2C94C" fill="#F2C94C" />
          </div>
        </div>
      </section>

      <!-- Main Actions -->
      <section class="action-section">
        <NuxtLink to="/app/scan" class="neubrutal-btn secondary action-btn flex-1" style="text-decoration: none; color: inherit;">
          <Camera :size="18" :stroke-width="2.5" />
          <span>{{ t('scanReceipt') }}</span>
        </NuxtLink>
        <NuxtLink to="/app/bill" class="neubrutal-btn ghost action-btn flex-1" style="text-decoration: none; color: inherit;">
          <PenTool :size="18" :stroke-width="2.5" />
          <span>{{ t('inputManual') }}</span>
        </NuxtLink>
      </section>

      <!-- Friends List (Horizontal Scroll) -->
      <section class="friends-section">
        <div class="section-header">
          <h2 class="section-title">{{ t('myFriends') }}</h2>
          <NuxtLink to="/app/friend" class="see-all">{{ t('viewAll') }}</NuxtLink>
        </div>
        
        <div v-if="isLoading" class="friends-scroll-container">
          <div class="friend-item" v-for="n in 4" :key="n">
            <div class="skeleton skeleton-circle" style="width: 64px; height: 64px; margin-bottom: 8px;"></div>
            <div class="skeleton skeleton-text" style="width: 48px; height: 12px; margin: 0 auto; border-radius: 4px;"></div>
          </div>
        </div>

        <div v-else-if="listFriendsOnly.length === 0" class="friends-empty neubrutal-box">
          <NuxtLink to="/app/friend" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 8px;">
            <Plus :size="16" :stroke-width="3" />
            <span>{{ t('emptyFriends') }}</span>
          </NuxtLink>
        </div>

        <div v-else class="friends-scroll-container">
          <div class="friend-item" v-for="friend in listFriendsOnly.slice(0, 10)" :key="friend.id">
            <FriendAvatar :name="friend.name" :avatar-bg="friend.avatarBg" size="xl" />
            <span class="friend-name">{{ friend.name.split(' ')[0] }}</span>
          </div>
        </div>
      </section>

      <!-- History Section -->
      <section class="history-section">
        <div class="section-header">
          <h2 class="section-title">{{ t('recentHistory') }}</h2>
          <NuxtLink to="/app/history" class="see-all">{{ t('viewAll') }}</NuxtLink>
        </div>
        
        <div class="history-list">
          <div v-if="isLoading">
            <div v-for="n in 3" :key="n" class="history-card neubrutal-box skeleton" style="min-height: 78px; margin-bottom: 12px; border-color: transparent !important; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px;">
              <!-- Empty for shimmer -->
            </div>
          </div>

          <div v-else-if="history.length === 0" class="empty-state neubrutal-box" style="padding: 10px;">
            <p>{{ t('noHistory') }}</p>
          </div>
          
          <div 
            v-else 
            v-for="item in history.slice(0, 10)" 
            :key="item.id" 
            class="history-card neubrutal-box"
            @click="useRouter().push(`/app/bill/${item.id}`)"
          >
            <div class="history-icon" :class="item.iconBg">
              <component :is="getIconComponent(item.iconType)" :size="24" />
            </div>
            <div class="history-details">
              <h3 class="history-title">{{ item.title }}</h3>
              <p class="history-date">
                {{ formatDate(item.date) }} • {{ item.peopleCount }} {{ t('friendLabel') }}
                <span v-if="item.stats" class="history-progress-badge" :class="{ lunas: item.stats.progressPercent === 100 }">
                  • {{ item.stats.progressPercent }}% {{ language === 'en' ? 'Paid' : 'Lunas' }}
                </span>
              </p>
            </div>
            <div class="history-amount">{{ formatCurrency(item.amount) }}</div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-header {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-wrapper {
  display: flex;
  align-items: center;
}

.app-logo {
  height: 56px;
  width: auto;
  object-fit: contain;
  display: block;
}

.user-avatar {
  width: 48px;
  height: 48px;
  background: var(--soft-yellow);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-profile-wrapper {
  position: relative;
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
}

.avatar-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 180px;
  background: var(--box-bg);
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}

.dropdown-user-greeting {
  margin: 0 10px;
  font-size: 12px;
  font-weight: 800;
  color: var(--text-color, #111);
}

.dropdown-item {
  padding: 12px 16px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #111;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
  text-align: left;
}

.dropdown-item:active {
  background: #f0f0f0;
}

.dropdown-item.text-red {
  color: #E02424;
}

.dropdown-divider {
  height: 2px;
  background: #111;
  margin: 4px 0;
}

.app-main {
  padding: 0 24px 100px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.action-section {
  display: flex;
  gap: 16px;
}

.action-btn {
  padding: 14px 8px;
  font-size: 1.05rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.action-btn span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.neubrutal-btn.secondary {
  background-color: var(--pastel-blue);
}

/* Summary Section */
.summary-section {
  margin-bottom: 4px;
}

.summary-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: var(--mint-green);
  overflow: hidden;
  position: relative;
}

.summary-content {
  z-index: 2;
  text-align: left;
}

.summary-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #444;
  margin-bottom: 4px;
}

.summary-amount {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-color);
  margin-bottom: 8px;
}

.summary-badge {
  display: inline-block;
  background: var(--soft-yellow);
  border: 2px solid #111;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
  box-shadow: 2px 2px 0px #111;
}

.summary-illustration {
  position: relative;
  width: 110px;
  height: 110px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

.mini-receipt {
  width: 68px;
  height: 90px;
  background: #f0f0f0;
  border: 3px solid #111;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transform: rotate(10deg);
  box-shadow: 3px 3px 0px #111;
  animation: float-small 3s ease-in-out infinite;
}

.mini-receipt .line {
  height: 4px;
  background: #111;
  border-radius: 2px;
}
.mini-receipt .line.short { width: 60%; }
.mini-receipt .total-line {
  height: 6px;
  background: var(--peach);
  border: 2px solid #111;
  margin-top: auto;
  border-radius: 3px;
}

.sparkle {
  position: absolute;
  font-size: 1.8rem;
}
.sp-1 { top: -5px; left: -15px; animation: pop 2s ease-in-out infinite; }
.sp-2 { bottom: 5px; right: -15px; animation: pop 2s ease-in-out infinite 1s; }

@keyframes float-small {
  0%, 100% { transform: translateY(0) rotate(10deg); }
  50% { transform: translateY(-5px) rotate(10deg); }
}

@keyframes pop {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
}

/* Friends Section */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #111;
}

.see-all {
  font-size: 0.875rem;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  text-decoration: none;
}

.friends-empty {
  padding: 14px 18px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-color-muted);
  background: var(--box-bg);
}

.friends-scroll-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 12px; /* For shadow */
  scrollbar-width: none; /* Firefox */
  text-align: center;
  align-items: center;
}
.friends-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome */
}

.friend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 80px;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.friend-item:active :deep(.friend-avatar) {
  transform: translate(2px, 2px);
  box-shadow: var(--shadow-hard-sm) !important;
}

.add-avatar {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  background: var(--box-bg);
  border: 3px dashed #111;
  box-shadow: none;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}
.add-avatar svg {
  width: 20px;
  height: 20px;
  color: #111;
}

.friend-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-color);
}

/* History Section */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.history-card {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s;
  cursor: pointer;
  background: var(--box-bg);
  text-align: left;
}
.history-card:active {
  transform: translate(2px, 2px);
  box-shadow: var(--shadow-hard-sm);
}

.history-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid #111;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  background: var(--box-bg);
  flex-shrink: 0;
}

.icon-bg-0 { background: var(--pastel-blue); }
.icon-bg-1 { background: var(--peach); }
.icon-bg-2 { background: var(--soft-yellow); }

.history-details {
  flex: 1;
  overflow: hidden;
}

.history-title {
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.history-date {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-color-muted);
}

.history-amount {
  font-weight: 800;
  font-size: 1rem;
  color: var(--text-color);
}

@media (max-width: 400px) {
  .app-header {
    padding: 16px 12px;
  }
  .app-main {
    padding: 0 12px 80px;
    gap: 24px;
  }
  .page-title {
    font-size: 1.5rem;
  }
  .summary-card {
    padding: 16px;
  }
  .summary-amount {
    font-size: 1.5rem;
  }
  .action-section {
    gap: 8px !important;
  }
  .action-btn {
    padding: 12px 6px !important;
    font-size: 0.85rem !important;
    gap: 6px !important;
  }
  .action-btn svg {
    width: 18px !important;
    height: 18px !important;
  }
  .action-btn span {
    gap: 6px !important;
  }
  .history-card {
    padding: 12px;
    gap: 12px;
  }
  .history-icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
  }
  .history-title {
    font-size: 0.9rem;
  }
  .history-amount {
    font-size: 0.9rem;
  }
}

.history-progress-badge {
  font-weight: 800;
  color: #D97706;
}

.history-progress-badge.lunas {
  color: #059669;
}
</style>
