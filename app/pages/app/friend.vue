<script setup>
import { ref, onMounted, computed } from 'vue'
import { ArrowLeft, Plus, Trash2, Edit2, X, Search, Phone, Mail } from '@lucide/vue'
import { useCekaSettings } from '~/composables/useCekaSettings'

const { loadSettings, t, language } = useCekaSettings()

const friends = ref([])
const searchQuery = ref('')

// Modal State
const showModal = ref(false)
const isEditMode = ref(false)
const currentFriendId = ref(null)
const friendForm = ref({
  name: '',
  phone: '',
  email: ''
})

const avatarClasses = ['avatar-bg-0', 'avatar-bg-1', 'avatar-bg-2', 'avatar-bg-3']

onMounted(() => {
  loadSettings()
  
  const saved = localStorage.getItem('ceka_friends')
  if (saved) {
    friends.value = JSON.parse(saved)
  } else {
    // Initial default friends
    friends.value = [
      { id: 1, name: 'Budi Pekerti', phone: '081234567890', email: 'budi@example.com', avatarBg: 'avatar-bg-0' },
      { id: 2, name: 'Siti Rahma', phone: '081987654321', email: 'siti@example.com', avatarBg: 'avatar-bg-1' },
      { id: 3, name: 'Joko Widodo', phone: '082122232425', email: 'jokowi@example.com', avatarBg: 'avatar-bg-2' },
      { id: 4, name: 'Dewi Lestari', phone: '', email: 'dewi@example.com', avatarBg: 'avatar-bg-3' },
      { id: 5, name: 'Rian Adriansyah', phone: '087855566677', email: '', avatarBg: 'avatar-bg-0' }
    ]
    saveToStorage()
  }
})

const saveToStorage = () => {
  localStorage.setItem('ceka_friends', JSON.stringify(friends.value))
}

const getInitials = (name) => {
  if (!name) return ''
  return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
}

// Search Logic
const filteredFriends = computed(() => {
  if (!searchQuery.value.trim()) return friends.value
  const query = searchQuery.value.toLowerCase().trim()
  return friends.value.filter(f => f.name.toLowerCase().includes(query))
})

// Modal Logic
const openAddModal = () => {
  isEditMode.value = false
  friendForm.value = { name: '', phone: '', email: '' }
  showModal.value = true
}

const openEditModal = (friend) => {
  isEditMode.value = true
  currentFriendId.value = friend.id
  friendForm.value = {
    name: friend.name,
    phone: friend.phone || '',
    email: friend.email || ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleSubmit = () => {
  if (!friendForm.value.name.trim()) return
  
  if (isEditMode.value) {
    const friend = friends.value.find(f => f.id === currentFriendId.value)
    if (friend) {
      friend.name = friendForm.value.name.trim()
      friend.phone = friendForm.value.phone.trim()
      friend.email = friendForm.value.email.trim()
      saveToStorage()
    }
  } else {
    const newFriend = {
      id: Date.now(),
      name: friendForm.value.name.trim(),
      phone: friendForm.value.phone.trim(),
      email: friendForm.value.email.trim(),
      avatarBg: avatarClasses[friends.value.length % avatarClasses.length]
    }
    friends.value.push(newFriend)
    saveToStorage()
  }
  closeModal()
}

const deleteFriend = (id) => {
  if (confirm(t('deleteConfirm'))) {
    friends.value = friends.value.filter(f => f.id !== id)
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
      <h1 class="page-title">{{ t('friendsTitle') }}</h1>
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
            :placeholder="t('searchFriend')" 
            class="neubrutal-input search-input"
          />
        </div>
        <button class="neubrutal-btn primary add-btn" @click="openAddModal">
          <Plus :size="22" strokeWidth="3" />
        </button>
      </section>

      <!-- Friends List -->
      <section class="friends-list-section">
        <div class="section-header">
          <h2 class="section-title">{{ t('myFriends') }} ({{ filteredFriends.length }})</h2>
        </div>

        <div class="friends-list">
          <div v-if="filteredFriends.length === 0" class="empty-state neubrutal-box">
            <p>{{ searchQuery.trim() ? t('searchFriendEmpty') : t('emptyFriends') }}</p>
          </div>

          <div 
            v-else 
            v-for="friend in filteredFriends" 
            :key="friend.id" 
            class="friend-card neubrutal-box"
          >
            <div class="friend-avatar" :class="friend.avatarBg">
              <span class="avatar-initial">{{ getInitials(friend.name) }}</span>
            </div>
            
            <div class="friend-info">
              <span class="friend-name">{{ friend.name }}</span>
              <span class="friend-meta" v-if="friend.phone || friend.email">
                <span v-if="friend.phone" class="meta-item"><Phone :size="10" strokeWidth="2.5" /> {{ friend.phone }}</span>
                <span v-if="friend.email" class="meta-item"><Mail :size="10" strokeWidth="2.5" /> {{ friend.email }}</span>
              </span>
            </div>
            
            <div class="friend-actions">
              <button class="action-icon-btn edit" @click="openEditModal(friend)">
                <Edit2 :size="16" strokeWidth="2.5" />
              </button>
              <button class="action-icon-btn delete" @click="deleteFriend(friend.id)">
                <Trash2 :size="16" strokeWidth="2.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Reusable Neubrutalist Modal (Add / Edit) -->
    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="neubrutal-box modal-content">
        <div class="modal-header">
          <h2 class="modal-title">{{ isEditMode ? t('editFriendTitle') : t('addFriendBtn') }}</h2>
          <button class="close-modal-btn" @click="closeModal">
            <X :size="20" strokeWidth="2.5" />
          </button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="modal-body">
          <div class="form-field">
            <label class="form-label">{{ t('nameLabel') }} <span class="required">*</span></label>
            <input 
              type="text" 
              v-model="friendForm.name" 
              :placeholder="t('namePlaceholder')" 
              class="neubrutal-input" 
              required 
            />
          </div>
          
          <div class="form-field">
            <label class="form-label">{{ t('phoneLabel') }}</label>
            <input 
              type="tel" 
              v-model="friendForm.phone" 
              :placeholder="t('phonePlaceholder')" 
              class="neubrutal-input" 
            />
          </div>
          
          <div class="form-field">
            <label class="form-label">{{ t('emailLabel') }}</label>
            <input 
              type="email" 
              v-model="friendForm.email" 
              :placeholder="t('emailPlaceholder')" 
              class="neubrutal-input" 
            />
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

/* Action Bar (Search & Add Button) */
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

/* Reusable Modal */
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
  max-width: 400px;
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
  transition: transform 0.1s;
}

.close-modal-btn:active {
  transform: scale(0.9);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

/* Friends List Section */
.section-header {
  margin-bottom: 16px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #111;
}

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  padding: 24px;
  text-align: center;
  font-weight: 700;
  color: #666;
}

.friend-card {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: white;
  min-height: 74px;
}

.friend-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: var(--shadow-hard-sm);
  border: 2px solid #111;
  flex-shrink: 0;
}

.avatar-bg-0 { background: var(--mint-green); }
.avatar-bg-1 { background: var(--pastel-blue); }
.avatar-bg-2 { background: var(--soft-yellow); }
.avatar-bg-3 { background: var(--peach); }

.avatar-initial {
  font-weight: 800;
  font-size: 1rem;
  color: #111;
  font-family: 'Outfit', sans-serif;
}

.friend-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  overflow: hidden;
  gap: 2px;
}

.friend-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-meta {
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

.friend-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  border: 2px solid #111;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  background: white;
  box-shadow: var(--shadow-hard-sm);
}

.action-icon-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px #111;
}

.action-icon-btn.edit {
  background: var(--soft-yellow);
}

.action-icon-btn.delete {
  background: #FEE2E2;
  color: #EF4444;
}
</style>
