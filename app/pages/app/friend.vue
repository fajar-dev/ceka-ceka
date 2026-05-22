<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, Trash2, Edit2, X, Search, Phone, Mail, UserPlus } from '@lucide/vue'
import { useCekaSettings } from '~/composables/useCekaSettings'
import { useCekaFriends } from '~/composables/useCekaFriends'
import type { Friend } from '~/types'

const { loadSettings, t, language } = useCekaSettings()
const {
  listFriendsOnly,
  loadFriends,
  addFriend,
  updateFriend,
  deleteFriend
} = useCekaFriends()

const searchQuery = ref('')

// Modal States
const showAddEditModal = ref(false)
const isEditMode = ref(false)
const currentFriendId = ref<string | number | null>(null)
const friendForm = ref({
  name: '',
  phone: '',
  email: ''
})

const showDeleteConfirmModal = ref(false)
const friendIdToDelete = ref<string | number | null>(null)

const isLoading = ref(true)

onMounted(async () => {
  loadSettings()
  try {
    await loadFriends()
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
})

// Search Logic
const filteredFriends = computed((): Friend[] => {
  const list = listFriendsOnly.value
  if (!searchQuery.value.trim()) return list
  const query = searchQuery.value.toLowerCase().trim()
  return list.filter(f => f.name.toLowerCase().includes(query))
})

// Modal Logic
const openAddModal = () => {
  isEditMode.value = false
  friendForm.value = { name: '', phone: '', email: '' }
  showAddEditModal.value = true
}

const openEditModal = (friend: Friend) => {
  isEditMode.value = true
  currentFriendId.value = friend.id
  friendForm.value = {
    name: friend.name,
    phone: friend.phone || '',
    email: friend.email || ''
  }
  showAddEditModal.value = true
}

const closeAddEditModal = () => {
  showAddEditModal.value = false
}

const handleSubmit = async () => {
  if (!friendForm.value.name.trim()) return
  
  if (isEditMode.value && currentFriendId.value !== null) {
    await updateFriend(
      currentFriendId.value,
      friendForm.value.name,
      friendForm.value.phone,
      friendForm.value.email
    )
  } else {
    await addFriend(
      friendForm.value.name,
      friendForm.value.phone,
      friendForm.value.email
    )
  }
  closeAddEditModal()
}

const triggerDelete = (id: string | number) => {
  friendIdToDelete.value = id
  showDeleteConfirmModal.value = true
}

const confirmDelete = async () => {
  if (friendIdToDelete.value !== null) {
    await deleteFriend(friendIdToDelete.value)
    showDeleteConfirmModal.value = false
    friendIdToDelete.value = null
  }
}
</script>

<template>
  <div class="neubrutal-container">
    <AppHeader :title="t('friendsTitle')" back-route="/app" />

    <main class="app-main">
      <!-- Search & Add Bar -->
      <section class="action-bar-section">
        <div class="search-wrapper">
          <Search :size="18" :stroke-width="2.5" class="search-icon" />
          <input 
            type="text" 
            v-model="searchQuery" 
            :placeholder="t('searchFriend')" 
            class="neubrutal-input search-input"
          />
        </div>
        <NeubrutalButton variant="primary" custom-class="add-btn" @click="openAddModal" :title="t('addFriendBtn')">
          <Plus :size="24" :stroke-width="4" />
        </NeubrutalButton>
      </section>

      <!-- Friends List -->
      <section class="friends-list-section">
        <div class="section-header">
          <h2 class="section-title">{{ t('myFriends') }} ({{ filteredFriends.length }})</h2>
        </div>

        <div class="friends-list">
          <div v-if="isLoading">
            <div v-for="n in 4" :key="n" class="friend-card neubrutal-box skeleton" style="min-height: 72px; margin-bottom: 12px; border-color: transparent !important;">
              <!-- Empty for shimmer -->
            </div>
          </div>

          <div v-else-if="filteredFriends.length === 0" class="empty-state neubrutal-box">
            <p>{{ searchQuery.trim() ? t('searchFriendEmpty') : t('emptyFriends') }}</p>
          </div>

          <div 
            v-else 
            v-for="friend in filteredFriends" 
            :key="friend.id" 
            class="friend-card neubrutal-box"
          >
            <FriendAvatar :name="friend.name" :avatar-bg="friend.avatarBg" size="sm" />
            
            <div class="friend-info">
              <span class="friend-name">{{ friend.name }}</span>
              <span class="friend-meta" v-if="friend.phone || friend.email">
                <span v-if="friend.phone" class="meta-item"><Phone :size="10" :stroke-width="2.5" /> {{ friend.phone }}</span>
                <span v-if="friend.email" class="meta-item"><Mail :size="10" :stroke-width="2.5" /> {{ friend.email }}</span>
              </span>
            </div>
            
            <div class="friend-actions">
              <button class="action-icon-btn edit" @click="openEditModal(friend)">
                <Edit2 :size="16" :stroke-width="2.5" />
              </button>
              <button class="action-icon-btn delete" @click="triggerDelete(friend.id)">
                <Trash2 :size="16" :stroke-width="2.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Unified Neubrutalist Modal (Add / Edit) -->
    <NeubrutalModal :show="showAddEditModal" accent="primary" @close="closeAddEditModal">
      <div class="modal-header">
        <div class="modal-title-wrapper">
          <h2 class="modal-title">
            <Edit2 v-if="isEditMode" class="title-icon" :size="20" :stroke-width="2.5" />
            <UserPlus v-else class="title-icon" :size="20" :stroke-width="2.5" />
            {{ isEditMode ? t('editFriendTitle') : t('addFriendBtn') }}
          </h2>
          <span class="modal-subtitle">
            {{ isEditMode ? (language === 'en' ? 'Edit and update this friend\'s information' : 'Ubah dan sesuaikan informasi profil teman ini') : (language === 'en' ? 'Add a new friend to split bills with' : 'Tambah teman patungan baru ke dalam daftar') }}
          </span>
        </div>
        <button class="close-modal-btn" @click="closeAddEditModal">
          <X :size="20" :stroke-width="2.5" />
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
          <NeubrutalButton variant="ghost" custom-class="modal-btn" @click="closeAddEditModal">
            {{ t('cancel') }}
          </NeubrutalButton>
          <NeubrutalButton type="submit" variant="primary" custom-class="modal-btn">
            {{ t('save') }}
          </NeubrutalButton>
        </div>
      </form>
    </NeubrutalModal>

    <!-- Beautiful Neubrutalist Delete Confirmation Modal -->
    <NeubrutalModal :show="showDeleteConfirmModal" accent="danger" @close="showDeleteConfirmModal = false">
      <div class="confirm-modal-body">
        <div class="confirm-icon-wrapper neubrutal-box">
          <Trash2 :size="32" :stroke-width="2.5" />
        </div>
        
        <h2 class="confirm-title">{{ t('deleteFriendConfirmTitle') }}</h2>
        <p class="confirm-text">
          {{ t('deleteConfirm') }}
        </p>
        
        <div class="confirm-actions-row">
          <NeubrutalButton variant="ghost" custom-class="flex-1 confirm-btn-cancel" @click="showDeleteConfirmModal = false">
            {{ t('cancel') }}
          </NeubrutalButton>
          <NeubrutalButton variant="danger" custom-class="flex-1 confirm-btn-yes save-btn-final" @click="confirmDelete">
            {{ t('yesDelete') }}
          </NeubrutalButton>
        </div>
      </div>
    </NeubrutalModal>
  </div>
</template>

<style scoped>
.app-main {
  padding: 0 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

:deep(.add-btn) {
  width: 50px;
  height: 50px;
  padding: 0 !important;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-hard-sm) !important;
  border: 3px solid #111 !important;
  box-sizing: border-box;
}

:deep(.add-btn:active) {
  transform: translate(1px, 1px) !important;
  box-shadow: 1px 1px 0px #111 !important;
}

.neubrutal-input {
  width: 100%;
  height: 50px;
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
  box-sizing: border-box;
}

.neubrutal-input:focus {
  background-color: var(--box-bg-alt);
}

/* Modal Headers & Subtitles */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 3px solid #111;
  padding-bottom: 12px;
}

.modal-title-wrapper {
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: 4px;
}

.modal-title {
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  color: var(--text-color);
}

.modal-subtitle {
  font-size: 0.8rem;
  color: var(--text-color-muted);
  font-weight: 600;
}

.close-modal-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color);
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
  margin-top: 18px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--text-color);
}

.required {
  color: #EF4444;
}

.modal-footer {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

:deep(.modal-btn) {
  flex: 1;
  padding: 12px 16px;
  font-size: 1rem;
  box-shadow: var(--shadow-hard-sm) !important;
}

:deep(.modal-btn:active) {
  box-shadow: 1px 1px 0px #111 !important;
}

/* Friends List Section */
.section-header {
  margin-bottom: 16px;
  text-align: left;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-color);
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
  color: var(--text-color-muted);
}

.friend-card {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--box-bg);
  min-height: 74px;
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
  color: var(--text-color);
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
  color: var(--text-color-muted);
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
  background: var(--box-bg);
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

/* Neubrutalist Confirmation Modal Styles */
.confirm-modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px 6px;
}

.confirm-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #FEE2E2;
  color: #EF4444;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 18px;
  border: 3.5px solid #111;
  box-shadow: 3px 3px 0px #111;
}

.confirm-title {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--text-color);
  margin-bottom: 10px;
}

.confirm-text {
  font-size: 0.85rem;
  color: var(--text-color-muted);
  line-height: 1.5;
  font-weight: 650;
  margin-bottom: 24px;
  padding: 0 10px;
}

.confirm-actions-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

:deep(.save-btn-final) {
  background: #EF4444 !important;
  color: white !important;
  border: 3.5px solid #111 !important;
  box-shadow: 4px 4px 0px #111 !important;
  font-weight: 850 !important;
}

:deep(.save-btn-final:active) {
  transform: translate(2px, 2px) !important;
  box-shadow: 2px 2px 0px #111 !important;
}
</style>
