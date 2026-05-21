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
          >
            <!-- Top Row: Icon + Title + Amount -->
            <div class="card-top-row">
              <div class="history-icon" :class="item.iconBg">
                <component :is="getIconComponent(item.iconType)" :size="22" />
              </div>
              
              <div class="card-title-wrapper">
                <h3 class="history-title">{{ item.title }}</h3>
                <div class="history-meta-row">
                  <span class="meta-chip"><Calendar :size="10" :stroke-width="2.5" /> {{ formatDate(item.date) }}</span>
                  <span class="meta-chip"><Users :size="10" :stroke-width="2.5" /> {{ item.peopleCount }}</span>
                </div>
              </div>

              <div class="card-amount-wrapper">
                <span class="history-amount">{{ formatCurrency(item.amount) }}</span>
              </div>
            </div>

            <!-- Bottom Row: Progress Bar -->
            <div class="card-progress-row" v-if="item.stats">
              <div class="progress-track">
                <div 
                  class="progress-fill" 
                  :class="{ complete: item.stats.progressPercent === 100 }"
                  :style="{ width: item.stats.progressPercent + '%' }"
                ></div>
              </div>
              <span class="progress-label" :class="{ complete: item.stats.progressPercent === 100 }">
                {{ item.stats.progressPercent === 100 ? '✓ Lunas' : `${item.stats.paidCount}/${item.stats.totalCount} paid` }}
              </span>
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

/* Redesigned Card */
.history-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--box-bg);
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.15s;
}

.history-card:active {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0px #111 !important;
}

/* Top Row */
.card-top-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 2.5px solid #111;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  box-shadow: 1.5px 1.5px 0px #111;
}

.icon-bg-0 { background: var(--pastel-blue); }
.icon-bg-1 { background: var(--peach); }
.icon-bg-2 { background: var(--soft-yellow); }

.card-title-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-meta-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.meta-chip {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-color-muted);
  display: flex;
  align-items: center;
  gap: 3px;
}

.card-amount-wrapper {
  flex-shrink: 0;
  text-align: right;
}

.history-amount {
  font-weight: 900;
  font-size: 0.95rem;
  color: var(--text-color);
}

/* Progress Row */
.card-progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-track {
  flex: 1;
  height: 8px;
  background: var(--box-bg-alt, #E5E7EB);
  border-radius: 99px;
  border: 2px solid #111;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #F59E0B;
  border-radius: 99px;
  transition: width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  min-width: 0;
}

.progress-fill.complete {
  background: #10B981;
}

.progress-label {
  font-size: 0.7rem;
  font-weight: 800;
  color: #D97706;
  white-space: nowrap;
  min-width: 60px;
  text-align: right;
}

.progress-label.complete {
  color: #059669;
}

/* Dark mode */
:global(.dark-theme) .progress-track {
  background: var(--box-bg-alt) !important;
  border-color: var(--border-color) !important;
}

:global(.dark-theme) .history-icon {
  border-color: var(--border-color) !important;
  box-shadow: 1.5px 1.5px 0px var(--border-color) !important;
}

:global(.dark-theme) .history-card:active {
  box-shadow: 2px 2px 0px var(--border-color) !important;
}
</style>

