<script setup>
import { ref, onMounted, computed } from 'vue'
import { ArrowLeft, Plus, Trash2, Edit2, X, Search, Pizza, Coffee, FileText, Calendar, Users } from '@lucide/vue'
import { useCekaSettings } from '~/composables/useCekaSettings'

const { currency, loadSettings, t } = useCekaSettings()

const history = ref([])
const searchQuery = ref('')

// Modal State
const showModal = ref(false)
const isEditMode = ref(false)
const currentItemId = ref(null)
const itemForm = ref({
  title: '',
  amount: '',
  date: '',
  peopleCount: 2,
  iconType: 'file'
})

// Options
const iconOptions = [
  { value: 'file', label: 'Umum / Makan', icon: FileText, bgClass: 'icon-bg-0' },
  { value: 'pizza', label: 'Pizza / Junkfood', icon: Pizza, bgClass: 'icon-bg-1' },
  { value: 'coffee', label: 'Kopi / Cafe', icon: Coffee, bgClass: 'icon-bg-2' }
]

onMounted(() => {
  loadSettings()
  
  const saved = localStorage.getItem('ceka_history')
  if (saved) {
    history.value = JSON.parse(saved)
  } else {
    // Initial default history
    history.value = [
      { id: 1, title: 'Makan Siang Kopitiam', date: '2026-05-12', peopleCount: 3, amount: 120000, iconType: 'file', iconBg: 'icon-bg-0' },
      { id: 2, title: 'Pesen Pizza Malam', date: '2026-05-10', peopleCount: 5, amount: 250000, iconType: 'pizza', iconBg: 'icon-bg-1' },
      { id: 3, title: 'Nongkrong Cafe', date: '2026-05-08', peopleCount: 2, amount: 85000, iconType: 'coffee', iconBg: 'icon-bg-2' }
    ]
    saveToStorage()
  }
})

const saveToStorage = () => {
  localStorage.setItem('ceka_history', JSON.stringify(history.value))
}

const getIconComponent = (type) => {
  switch (type) {
    case 'pizza': return Pizza
    case 'coffee': return Coffee
    default: return FileText
  }
}

const getIconBgClass = (type) => {
  const opt = iconOptions.find(o => o.value === type)
  return opt ? opt.bgClass : 'icon-bg-0'
}

const formatCurrency = (val) => {
  const formatted = new Intl.NumberFormat('id-ID').format(val)
  return `${currency.value} ${formatted}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

// Search Logic
const filteredHistory = computed(() => {
  if (!searchQuery.value.trim()) return history.value
  const query = searchQuery.value.toLowerCase().trim()
  return history.value.filter(item => item.title.toLowerCase().includes(query))
})

// Modal Logic
const openAddModal = () => {
  isEditMode.value = false
  const today = new Date().toISOString().substring(0, 10)
  itemForm.value = {
    title: '',
    amount: '',
    date: today,
    peopleCount: 2,
    iconType: 'file'
  }
  showModal.value = true
}

const openEditModal = (item) => {
  isEditMode.value = true
  currentItemId.value = item.id
  itemForm.value = {
    title: item.title,
    amount: item.amount,
    date: item.date,
    peopleCount: item.peopleCount || 2,
    iconType: item.iconType || 'file'
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleSubmit = () => {
  if (!itemForm.value.title.trim() || !itemForm.value.amount || !itemForm.value.date) return
  
  const parsedAmount = parseInt(itemForm.value.amount) || 0
  
  if (isEditMode.value) {
    const item = history.value.find(h => h.id === currentItemId.value)
    if (item) {
      item.title = itemForm.value.title.trim()
      item.amount = parsedAmount
      item.date = itemForm.value.date
      item.peopleCount = parseInt(itemForm.value.peopleCount) || 2
      item.iconType = itemForm.value.iconType
      item.iconBg = getIconBgClass(itemForm.value.iconType)
      saveToStorage()
    }
  } else {
    const newItem = {
      id: Date.now(),
      title: itemForm.value.title.trim(),
      amount: parsedAmount,
      date: itemForm.value.date,
      peopleCount: parseInt(itemForm.value.peopleCount) || 2,
      iconType: itemForm.value.iconType,
      iconBg: getIconBgClass(itemForm.value.iconType)
    }
    history.value.unshift(newItem) // Add to top of list
    saveToStorage()
  }
  closeModal()
}

const deleteItem = (id) => {
  if (confirm(t('deleteHistoryConfirm'))) {
    history.value = history.value.filter(h => h.id !== id)
    saveToStorage()
  }
}
</script>

<template>
  <div class="neubrutal-container">
    <header class="app-header">
      <NuxtLink to="/app" class="back-btn neubrutal-box">
        <ArrowLeft :size="20" strokeWidth="2.5" />
      </NuxtLink>
      <h1 class="page-title">{{ t('historyTitle') }}</h1>
      <div style="width: 42px;"></div> <!-- Spacer to center the title -->
    </header>

    <main class="app-main">
      <!-- Search & Add Bar -->
      <section class="action-bar-section">
        <div class="search-wrapper">
          <Search :size="18" strokeWidth="2.5" class="search-icon" />
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
          >
            <div class="history-icon" :class="item.iconBg">
              <component :is="getIconComponent(item.iconType)" :size="24" />
            </div>
            
            <div class="history-details">
              <h3 class="history-title">{{ item.title }}</h3>
              <p class="history-meta">
                <span class="meta-item"><Calendar :size="11" strokeWidth="2.5" /> {{ formatDate(item.date) }}</span>
                <span class="meta-item"><Users :size="11" strokeWidth="2.5" /> {{ item.peopleCount }} {{ t('friendLabel') }}</span>
              </p>
            </div>
            
            <div class="history-right-wrapper">
              <div class="history-amount">Rp {{ formatCurrency(item.amount) }}</div>
              <div class="history-actions">
                <button class="action-icon-btn edit" @click="openEditModal(item)">
                  <Edit2 :size="14" strokeWidth="2.5" />
                </button>
                <button class="action-icon-btn delete" @click="deleteItem(item.id)">
                  <Trash2 :size="14" strokeWidth="2.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Reusable Neubrutalist Modal (Add / Edit) -->
    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="neubrutal-box modal-content">
        <div class="modal-header">
          <h2 class="modal-title">{{ isEditMode ? t('editBillTitle') : t('addBillTitle') }}</h2>
          <button class="close-modal-btn" @click="closeModal">
            <X :size="20" strokeWidth="2.5" />
          </button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="modal-body">
          <div class="form-field">
            <label class="form-label">{{ t('billNameLabel') }} <span class="required">*</span></label>
            <input 
              type="text" 
              v-model="itemForm.title" 
              placeholder="e.g. Bakso Lapangan Tembak" 
              class="neubrutal-input" 
              required 
            />
          </div>
          
          <div class="form-field">
            <label class="form-label">{{ t('billAmountLabel') }} (Rp) <span class="required">*</span></label>
            <input 
              type="number" 
              v-model="itemForm.amount" 
              placeholder="e.g. 150000" 
              class="neubrutal-input" 
              required 
            />
          </div>

          <div class="form-row">
            <div class="form-field flex-1">
              <label class="form-label">{{ t('eventDateLabel') }} <span class="required">*</span></label>
              <input 
                type="date" 
                v-model="itemForm.date" 
                class="neubrutal-input" 
                required 
              />
            </div>
            <div class="form-field flex-1">
              <label class="form-label">{{ t('peopleCountLabel') }} <span class="required">*</span></label>
              <input 
                type="number" 
                v-model="itemForm.peopleCount" 
                placeholder="2" 
                min="1" 
                class="neubrutal-input" 
                required 
              />
            </div>
          </div>

          <div class="form-field">
            <label class="form-label">{{ t('eventCategoryLabel') }}</label>
            <div class="icon-selector">
              <label 
                v-for="opt in iconOptions" 
                :key="opt.value"
                class="icon-option neubrutal-box"
                :class="{ active: itemForm.iconType === opt.value }"
              >
                <input 
                  type="radio" 
                  name="iconType" 
                  :value="opt.value" 
                  v-model="itemForm.iconType" 
                  class="hidden-radio"
                />
                <component :is="opt.icon" :size="20" />
                <span class="icon-label">{{ opt.value === 'file' ? t('catGeneral') : opt.value === 'pizza' ? t('catJunk') : t('catCafe') }}</span>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="neubrutal-btn ghost modal-btn" @click="closeModal">
              {{ t('cancel') }}
            </button>
            <button type="submit" class="neubrutal-btn primary modal-btn">
              {{ t('save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-header {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn {
  width: 42px;
  height: 42px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  color: #111;
  text-decoration: none;
  background: white;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: var(--shadow-hard-sm);
}

.back-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px #111;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111;
  text-align: center;
}

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

.action-bar-section .add-btn {
  width: 48px;
  height: 48px;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-hard-sm);
}

.action-bar-section .add-btn:active {
  box-shadow: 1px 1px 0px #111;
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
  background: white;
  transition: background-color 0.2s;
}

.neubrutal-input:focus {
  background-color: #FAF8F5;
}

/* Modal Styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 24px;
}

.modal-content {
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: pop-modal 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop-modal {
  from { transform: scale(0.85) translateY(15px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid #111;
  padding-bottom: 12px;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #111;
}

.close-modal-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.flex-1 {
  flex: 1;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 800;
  color: #111;
}

.required {
  color: #EF4444;
}

.icon-selector {
  display: flex;
  gap: 10px;
}

.icon-option {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  background: white;
  transition: transform 0.15s, box-shadow 0.15s, background-color 0.15s;
  box-shadow: var(--shadow-hard-sm);
  border-radius: var(--radius-md);
  border: 2px solid #111;
}

.icon-option.active {
  background: var(--soft-yellow);
  transform: translate(2px, 2px);
  box-shadow: none;
}

.hidden-radio {
  display: none;
}

.icon-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #111;
}

.modal-footer {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.modal-btn {
  flex: 1;
  padding: 12px 16px;
  font-size: 1rem;
  box-shadow: var(--shadow-hard-sm);
}

.modal-btn:active {
  box-shadow: 1px 1px 0px #111;
}

/* History Section */
.section-header {
  margin-bottom: 16px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #111;
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
  color: #666;
}

.history-card {
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: white;
  transition: transform 0.2s;
  cursor: default;
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
  color: #111;
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
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.history-right-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.history-amount {
  font-weight: 800;
  font-size: 0.95rem;
  color: #111;
}

.history-actions {
  display: flex;
  gap: 6px;
}

.action-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  border: 2px solid #111;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  background: white;
  box-shadow: 1px 1px 0px #111;
}

.action-icon-btn:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.action-icon-btn.edit {
  background: var(--soft-yellow);
}

.action-icon-btn.delete {
  background: #FEE2E2;
  color: #EF4444;
}
</style>
