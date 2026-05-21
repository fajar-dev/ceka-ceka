<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Search, Pizza, Coffee, FileText, Calendar, Users } from '@lucide/vue'
import { useCekaSettings } from '~/composables/useCekaSettings'
import { useCekaHistory } from '~/composables/useCekaHistory'
import type { HistoryRecord } from '~/types'

const { currency, loadSettings, t } = useCekaSettings()
const { history, loadHistory } = useCekaHistory()

const searchQuery = ref('')

// Options
const iconOptions = [
  { value: 'file', label: 'Umum / Makan', icon: FileText, bgClass: 'icon-bg-0' },
  { value: 'pizza', label: 'Pizza / Junkfood', icon: Pizza, bgClass: 'icon-bg-1' },
  { value: 'coffee', label: 'Kopi / Cafe', icon: Coffee, bgClass: 'icon-bg-2' }
]

onMounted(() => {
  loadSettings()
  loadHistory()

  // Seed default history if empty
  if (process.client && history.value.length === 0) {
    const seed = [
      { id: 1, title: 'Makan Siang Kopitiam', date: '2026-05-12', peopleCount: 3, amount: 120000, iconType: 'file', iconBg: 'icon-bg-0', items: [], invitedFriends: [], taxType: 'percent' as const, taxPercent: 0, taxManual: 0, taxAmount: 0, discountType: 'percent' as const, discountPercent: 0, discountManual: 0, discountAmount: 0, otherFees: [], subtotalItems: 120000, subtotalOtherFees: 0 },
      { id: 2, title: 'Pesen Pizza Malam', date: '2026-05-10', peopleCount: 5, amount: 250000, iconType: 'pizza', iconBg: 'icon-bg-1', items: [], invitedFriends: [], taxType: 'percent' as const, taxPercent: 0, taxManual: 0, taxAmount: 0, discountType: 'percent' as const, discountPercent: 0, discountManual: 0, discountAmount: 0, otherFees: [], subtotalItems: 250000, subtotalOtherFees: 0 },
      { id: 3, title: 'Nongkrong Cafe', date: '2026-05-08', peopleCount: 2, amount: 85000, iconType: 'coffee', iconBg: 'icon-bg-2', items: [], invitedFriends: [], taxType: 'percent' as const, taxPercent: 0, taxManual: 0, taxAmount: 0, discountType: 'percent' as const, discountPercent: 0, discountManual: 0, discountAmount: 0, otherFees: [], subtotalItems: 85000, subtotalOtherFees: 0 }
    ]
    localStorage.setItem('ceka_history', JSON.stringify(seed))
    loadHistory()
  }
})

const getIconComponent = (type: string) => {
  switch (type) {
    case 'pizza': return Pizza
    case 'coffee': return Coffee
    default: return FileText
  }
}

const getIconBgClass = (type: string) => {
  const opt = iconOptions.find(o => o.value === type)
  return opt ? opt.bgClass : 'icon-bg-0'
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

// Search Logic
const filteredHistory = computed((): HistoryRecord[] => {
  const list = history.value
  if (!searchQuery.value.trim()) return list
  const query = searchQuery.value.toLowerCase().trim()
  return list.filter(item => item.title.toLowerCase().includes(query))
})
</script>

<template>
  <div class="neubrutal-container">
    <AppHeader :title="t('historyTitle')" back-route="/app" />

    <main class="app-main">
      <!-- Search & Add Bar -->
      <section class="action-bar-section">
        <div class="search-wrapper">
          <Search :size="18" :stroke-width="2.5" class="search-icon" />
          <input 
            type="text" 
            v-model="searchQuery" 
            :placeholder="t('searchHistory')" 
            class="neubrutal-input search-input"
          />
        </div>
      </section>

      <!-- History List -->
      <section class="history-list-section">
        <div class="section-header">
          <h2 class="section-title">{{ t('historyCountTitle') }} ({{ filteredHistory.length }})</h2>
        </div>

        <div class="history-list">
          <div v-if="filteredHistory.length === 0" class="empty-state neubrutal-box">
            <p>{{ searchQuery.trim() ? t('emptyHistorySearch') : t('emptyHistory') }}</p>
          </div>

          <div 
            v-else 
            v-for="item in filteredHistory" 
            :key="item.id" 
            class="history-card neubrutal-box"
            @click="useRouter().push(`/app/bill/${item.id}`)"
            style="cursor: pointer;"
          >
            <div class="history-icon" :class="item.iconBg">
              <component :is="getIconComponent(item.iconType)" :size="24" />
            </div>
            
            <div class="history-details">
              <h3 class="history-title">{{ item.title }}</h3>
              <p class="history-meta">
                <span class="meta-item"><Calendar :size="11" :stroke-width="2.5" /> {{ formatDate(item.date) }}</span>
                <span class="meta-item"><Users :size="11" :stroke-width="2.5" /> {{ item.peopleCount }} {{ t('friendLabel') }}</span>
                <span v-if="item.stats" class="meta-item progress-meta" :class="{ lunas: item.stats.progressPercent === 100 }">
                  • {{ item.stats.progressPercent }}% Lunas
                </span>
              </p>
            </div>
            
            <div class="history-right-wrapper">
              <div class="history-amount">{{ formatCurrency(item.amount) }}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-main {
  padding: 0 24px 100px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* Action Bar */
.action-bar-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-wrapper {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #555;
  pointer-events: none;
}

.search-input {
  padding-left: 44px !important;
}

.neubrutal-input {
  width: 100%;
  padding: 12px 16px;
  border: 3px solid #111;
  border-radius: var(--radius-lg);
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  box-shadow: var(--shadow-hard-sm);
  outline: none;
  background: var(--box-bg);
  transition: background-color 0.2s;
}

.neubrutal-input:focus {
  background-color: var(--box-bg-alt);
}

/* History Section */
.section-header {
  margin-bottom: 16px;
  text-align: left;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-color);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.empty-state {
  padding: 24px;
  text-align: center;
  font-weight: 700;
  color: var(--text-color-muted);
}

.history-card {
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--box-bg);
  transition: transform 0.2s;
  cursor: default;
  text-align: left;
}

.history-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid #111;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.icon-bg-0 { background: var(--pastel-blue); }
.icon-bg-1 { background: var(--peach); }
.icon-bg-2 { background: var(--soft-yellow); }

.history-details {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-title {
  font-size: 0.95rem;
  font-weight: 750;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-item {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-color-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.history-right-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
}

.history-amount {
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--text-color);
}

.progress-meta {
  font-weight: 800;
  color: #D97706;
}

.progress-meta.lunas {
  color: #059669;
}
</style>
