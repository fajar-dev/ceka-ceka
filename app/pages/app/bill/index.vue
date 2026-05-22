<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Trash2, ShoppingBag, Hash, CreditCard, Users, UserPlus, X, Search, CheckSquare, Percent, Coins } from '@lucide/vue'
import { useCekaSettings } from '~/composables/useCekaSettings'
import { useCekaFriends } from '~/composables/useCekaFriends'
import type { Friend, BillItem, OtherFee, Bill } from '~/types'

const { currency, loadSettings, t, language } = useCekaSettings()
const { allFriends, loadFriends, getInitials, getFriendDetails, addFriend } = useCekaFriends()

const bill = ref<Bill>({
  title: '',
  date: '',
  category: 'file',
  items: [
    { name: '', price: '', quantity: 1, totalPrice: '', assignments: {} }
  ],
  taxType: 'percent',
  taxPercent: '',
  taxManual: '',
  discountType: 'manual',
  discountPercent: '',
  discountManual: '',
  otherFees: []
})

const categories = computed(() => [
  { value: 'file', label: t('catGeneral'), bgClass: 'icon-bg-0' },
  { value: 'pizza', label: t('catJunk'), bgClass: 'icon-bg-1' },
  { value: 'coffee', label: t('catCafe'), bgClass: 'icon-bg-2' }
])

// Friends split list state
const selectedFriendIds = ref<(string | number)[]>([])
const showInviteModal = ref(false)
const inviteSearchQuery = ref('')

// Quick Add Friend States
const showQuickAddFriendModal = ref(false)
const quickFriendForm = ref({
  name: '',
  phone: '',
  email: ''
})

const openQuickAddFriendModal = () => {
  quickFriendForm.value = { name: '', phone: '', email: '' }
  showQuickAddFriendModal.value = true
}

const handleQuickAddFriendSubmit = async () => {
  if (!quickFriendForm.value.name.trim()) return
  
  await addFriend(
    quickFriendForm.value.name,
    quickFriendForm.value.phone,
    quickFriendForm.value.email
  )
  
  // Auto-select the newly added friend after a brief moment to allow fetch reload
  setTimeout(() => {
    const added = allFriends.value.find(
      f => f.name.toLowerCase() === quickFriendForm.value.name.trim().toLowerCase()
    )
    if (added && !selectedFriendIds.value.includes(added.id)) {
      selectedFriendIds.value.push(added.id)
    }
  }, 350)

  showQuickAddFriendModal.value = false
}

// Item assignment modal state
const activeAssignItemIndex = ref<number | null>(null)
const activeAssignItem = computed((): BillItem | null => {
  if (activeAssignItemIndex.value === null) return null
  return bill.value.items[activeAssignItemIndex.value] || null
})
const showAssignModal = ref(false)

const showCancelConfirmModal = ref(false)
const isDraftLoaded = ref(false)

onMounted(() => {
  loadSettings()
  loadFriends()
  
  // Load draft if exists
  const draftStr = localStorage.getItem('ceka_bill_draft')
  if (draftStr) {
    try {
      const draft = JSON.parse(draftStr)
      if (draft && draft.bill) {
        bill.value = draft.bill
      }
      if (draft && draft.selectedFriendIds) {
        selectedFriendIds.value = draft.selectedFriendIds
      }
    } catch (e) {
      console.error('Failed to parse ceka_bill_draft', e)
    }
  } else {
    bill.value.date = new Date().toISOString().substring(0, 10)
    selectedFriendIds.value = ['you']
  }

  // Set isDraftLoaded to true so that watch can start saving
  setTimeout(() => {
    isDraftLoaded.value = true
  }, 100)
})

watch(
  [bill, selectedFriendIds],
  () => {
    if (!isDraftLoaded.value) return
    localStorage.setItem('ceka_bill_draft', JSON.stringify({
      bill: bill.value,
      selectedFriendIds: selectedFriendIds.value
    }))
  },
  { deep: true }
)

const confirmCancel = () => {
  showCancelConfirmModal.value = true
}

const handleCancelConfirm = () => {
  localStorage.removeItem('ceka_bill_draft')
  showCancelConfirmModal.value = false
  useRouter().push('/app')
}

const toggleSelectFriend = (id: string | number) => {
  const index = selectedFriendIds.value.indexOf(id)
  if (index > -1) {
    selectedFriendIds.value.splice(index, 1)
    
    // Auto-clean portions assignment for this friend from all items
    bill.value.items.forEach(item => {
      if (item.assignments && item.assignments[id] !== undefined) {
        delete item.assignments[id]
      }
    })
  } else {
    selectedFriendIds.value.push(id)
  }
}

const isFriendSelected = (id: string | number): boolean => {
  return selectedFriendIds.value.includes(id)
}

const filteredFriendsToInvite = computed((): Friend[] => {
  if (!inviteSearchQuery.value.trim()) return allFriends.value
  const query = inviteSearchQuery.value.toLowerCase().trim()
  return allFriends.value.filter(f => f.name.toLowerCase().includes(query))
})

const addItem = () => {
  bill.value.items.push({ name: '', price: '', quantity: 1, totalPrice: '', assignments: {} })
}

const removeItem = (index: number) => {
  if (bill.value.items.length > 1) {
    bill.value.items.splice(index, 1)
  } else {
    bill.value.items[0] = { name: '', price: '', quantity: 1, totalPrice: '', assignments: {} }
  }
}

const getIconBg = (catValue: string): string => {
  const cat = categories.value.find(c => c.value === catValue)
  return cat ? cat.bgClass : 'icon-bg-0'
}

const sanitizeNumber = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return ''
  return val.toString().replace(/[^\d]/g, '')
}

// Two-way pricing sync handlers
const handlePriceChange = (item: BillItem) => {
  item.price = sanitizeNumber(item.price as string)
  const price = parseFloat(item.price as string) || 0
  const qty = parseInt(item.quantity as string) || 1
  item.totalPrice = Math.round(price * qty).toString()
}

const handleTotalChange = (item: BillItem) => {
  item.totalPrice = sanitizeNumber(item.totalPrice as string)
  const total = parseFloat(item.totalPrice as string) || 0
  const qty = parseInt(item.quantity as string) || 1
  item.price = Math.round(total / qty).toString()
}

const handleQuantityChange = (item: BillItem) => {
  item.quantity = sanitizeNumber(item.quantity as string)
  const price = parseFloat(item.price as string) || 0
  const qty = parseInt(item.quantity as string) || 1
  item.totalPrice = Math.round(price * qty).toString()
}

// Portions Assignment helpers
const setItemPortion = (item: BillItem, friendId: string | number, val: string) => {
  if (!item.assignments) item.assignments = {}
  let cleanVal = val.toString().replace(/[^\d.]/g, '')
  const dotCount = (cleanVal.match(/\./g) || []).length
  if (dotCount > 1) {
    cleanVal = cleanVal.substring(0, cleanVal.lastIndexOf('.'))
  }
  item.assignments[friendId] = parseFloat(cleanVal) || 0
}

const incrementPortion = (item: BillItem, friendId: string | number) => {
  if (!item.assignments) item.assignments = {}
  const current = parseFloat(item.assignments[friendId] as unknown as string) || 0
  item.assignments[friendId] = Number((current + 1).toFixed(1))
}

const decrementPortion = (item: BillItem, friendId: string | number) => {
  if (!item.assignments) item.assignments = {}
  const current = parseFloat(item.assignments[friendId] as unknown as string) || 0
  if (current > 0) {
    item.assignments[friendId] = Number((current - 1).toFixed(1))
  }
}

const toggleFriendAssignment = (item: BillItem, friendId: string | number) => {
  if (!item.assignments) item.assignments = {}
  const current = parseFloat(item.assignments[friendId] as unknown as string) || 0
  if (current > 0) {
    item.assignments[friendId] = 0
  } else {
    item.assignments[friendId] = 1
  }
}

const autoSplitItem = (item: BillItem) => {
  if (!item.assignments) item.assignments = {}
  const checkedIds = selectedFriendIds.value.filter(id => (item.assignments[id] || 0) > 0)
  const activeIds = checkedIds.length > 0 ? checkedIds : selectedFriendIds.value
  
  if (activeIds.length === 0) return
  
  const qty = parseFloat(item.quantity as string) || 1
  const portion = Number((qty / activeIds.length).toFixed(1))
  
  selectedFriendIds.value.forEach(id => {
    item.assignments[id] = 0
  })
  
  activeIds.forEach(id => {
    item.assignments[id] = portion
  })
}

const getAssignedPortionSum = (item: BillItem): number => {
  if (!item || !item.assignments) return 0
  return Object.values(item.assignments).reduce((sum, val) => sum + (parseFloat(val as unknown as string) || 0), 0)
}

const openAssignModal = (index: number) => {
  activeAssignItemIndex.value = index
  showAssignModal.value = true
}

const closeAssignModal = () => {
  showAssignModal.value = false
  activeAssignItemIndex.value = null
}

// Biaya Lainnya helpers
const addOtherFee = () => {
  if (!bill.value.otherFees) {
    bill.value.otherFees = []
  }
  bill.value.otherFees.push({ name: '', amount: '' })
}

const removeOtherFee = (index: number) => {
  bill.value.otherFees.splice(index, 1)
}

const handleFeeAmountChange = (fee: OtherFee) => {
  fee.amount = sanitizeNumber(fee.amount as string)
}

// Pricing computations
const subtotalItems = computed((): number => {
  return bill.value.items.reduce((sum, item) => {
    const total = parseInt(item.totalPrice as string) || (parseInt(item.price as string) * parseInt(item.quantity as string)) || 0
    return sum + total
  }, 0)
})

const subtotalOtherFees = computed((): number => {
  if (!bill.value.otherFees) return 0
  return bill.value.otherFees.reduce((sum, fee) => {
    const amt = parseFloat(sanitizeNumber(fee.amount as string)) || 0
    return sum + amt
  }, 0)
})

const calculatedDiscountAmount = computed((): number => {
  const base = subtotalItems.value + subtotalOtherFees.value
  if (bill.value.discountType === 'percent') {
    const pct = parseFloat(bill.value.discountPercent as string) || 0
    return Math.round(base * (pct / 100))
  } else {
    return parseFloat(sanitizeNumber(bill.value.discountManual as string)) || 0
  }
})

const calculatedTaxAmount = computed((): number => {
  // Tax calculated after discount is subtracted
  const base = Math.max(0, subtotalItems.value + subtotalOtherFees.value - calculatedDiscountAmount.value)
  if (bill.value.taxType === 'percent') {
    const pct = parseFloat(bill.value.taxPercent as string) || 0
    return Math.round(base * (pct / 100))
  } else {
    return parseFloat(sanitizeNumber(bill.value.taxManual as string)) || 0
  }
})

const totalAmount = computed((): number => {
  const base = subtotalItems.value + subtotalOtherFees.value
  return Math.max(0, base - calculatedDiscountAmount.value + calculatedTaxAmount.value)
})

const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('id-ID').format(val)
}

const goToPreviewSplit = () => {
  if (!bill.value.title.trim()) {
    alert(t('fillBillNameAlert'))
    return
  }
  if (!bill.value.date) {
    alert(t('fillBillDateAlert'))
    return
  }

  // Validate items
  const validItems = bill.value.items.filter(item => item.name.trim() && (parseInt(item.price as string) > 0 || parseInt(item.totalPrice as string) > 0))
  if (validItems.length === 0) {
    alert(t('minOneItemAlert'))
    return
  }

  const pendingBill = {
    title: bill.value.title.trim(),
    date: bill.value.date,
    category: bill.value.category,
    items: validItems.map(item => ({
      name: item.name.trim(),
      price: parseInt(item.price as string) || 0,
      quantity: parseInt(item.quantity as string) || 1,
      totalPrice: parseInt(item.totalPrice as string) || (parseInt(item.price as string) * parseInt(item.quantity as string)),
      assignments: item.assignments || {}
    })),
    selectedFriendIds: selectedFriendIds.value,
    taxType: bill.value.taxType,
    taxPercent: parseFloat(bill.value.taxPercent as string) || 0,
    taxManual: parseFloat(sanitizeNumber(bill.value.taxManual as string)) || 0,
    discountType: bill.value.discountType,
    discountPercent: parseFloat(bill.value.discountPercent as string) || 0,
    discountManual: parseFloat(sanitizeNumber(bill.value.discountManual as string)) || 0,
    otherFees: (bill.value.otherFees || []).map(fee => ({
      name: fee.name.trim() || 'Biaya Tambahan',
      amount: parseFloat(sanitizeNumber(fee.amount as string)) || 0
    }))
  }
  
  localStorage.setItem('ceka_pending_bill', JSON.stringify(pendingBill))
  useRouter().push('/app/preview')
}
</script>

<template>
  <div class="neubrutal-container">
    <AppHeader :title="t('splitBillTitle')" @back="confirmCancel" :show-back-button="true" />

    <main class="app-main">
      <form @submit.prevent="goToPreviewSplit" class="bill-form">
        
        <!-- Bill Details Card -->
        <section class="form-section-card neubrutal-box">
          <h2 class="section-title-nested"><CreditCard :size="18" /> {{ t('billDetailsTitle') }}</h2>
          
          <div class="form-field">
            <label class="form-label">{{ t('billNameLabelInput') }} <span class="required">*</span></label>
            <input 
              type="text" 
              v-model="bill.title" 
              placeholder="e.g. Seafood Ayu Menteng" 
              class="neubrutal-input"
              required 
            />
          </div>

          <div class="form-row">
            <div class="form-field flex-1">
              <label class="form-label">{{ t('dateLabelInput') }} <span class="required">*</span></label>
              <input 
                type="date" 
                v-model="bill.date" 
                class="neubrutal-input"
                required 
              />
            </div>
            <div class="form-field flex-1">
              <label class="form-label">{{ t('categoryLabelInput') }} <span class="required">*</span></label>
              <select v-model="bill.category" class="neubrutal-select">
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                  {{ cat.label }}
                </option>
              </select>
            </div>
          </div>
        </section>

        <!-- Invited Friends Section (Below Bill Details) -->
        <section class="form-section-card neubrutal-box bg-white">
          <div class="items-header">
            <h2 class="section-title-nested"><Users :size="18" /> {{ t('membersTitle') }}</h2>
            <!-- Icon-Only Pilih Teman Button -->
            <NeubrutalButton variant="primary" custom-class="invite-btn-icon-only" @click="showInviteModal = true" :title="t('selectFriends')">
              <UserPlus :size="15" :stroke-width="3" />
            </NeubrutalButton>
          </div>

          <!-- Selected Friends Chips List -->
          <div class="invited-friends-list">
            <div v-if="selectedFriendIds.length === 0" class="empty-invited-friends">
              <p>{{ t('emptyMembers') }}</p>
            </div>
            
            <div v-else class="chips-container">
              <div 
                v-for="id in selectedFriendIds" 
                :key="id" 
                class="friend-chip neubrutal-box"
              >
                <div class="chip-avatar" :class="getFriendDetails(id)?.avatarBg">
                  <span>{{ getInitials(getFriendDetails(id)?.name || '') }}</span>
                </div>
                <span class="chip-name">{{ getFriendDetails(id)?.name.split(' ')[0] }}</span>
                <button type="button" class="remove-chip-btn" @click="toggleSelectFriend(id)">
                  <X :size="14" :stroke-width="3" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Nested Items Form Section -->
        <section class="form-section-card neubrutal-box bg-white">
          <div class="items-header">
            <h2 class="section-title-nested"><ShoppingBag :size="18" /> {{ t('itemsTitle') }}</h2>
          </div>

          <!-- Items Rows -->
          <div class="nested-items-list">
            <div 
              v-for="(item, index) in bill.items" 
              :key="index" 
              class="item-row-card neubrutal-box"
            >
              <div class="item-row-header">
                <span class="item-index-badge"><Hash :size="12" /> {{ index + 1 }}</span>
                <button 
                  type="button" 
                  class="item-delete-btn" 
                  @click="removeItem(index)"
                  :title="t('removeItem')"
                >
                  <Trash2 :size="15" :stroke-width="2.5" />
                </button>
              </div>

              <div class="item-fields-grid">
                <div class="form-field col-span-2">
                  <label class="form-label">{{ t('menuNameLabel') }} <span class="required">*</span></label>
                  <input 
                    type="text" 
                    v-model="item.name" 
                    placeholder="e.g. Indomie Becek" 
                    class="neubrutal-input small"
                    required
                  />
                </div>

                <div class="form-field">
                  <label class="form-label">{{ t('menuPriceLabel') }}</label>
                  <input 
                    type="text" 
                    inputmode="numeric"
                    v-model="item.price" 
                    :placeholder="currency" 
                    class="neubrutal-input small"
                    @input="handlePriceChange(item)"
                  />
                </div>

                <div class="form-field">
                  <label class="form-label">{{ t('menuQtyLabel') }}</label>
                  <input 
                    type="text" 
                    inputmode="numeric"
                    v-model="item.quantity" 
                    placeholder="1" 
                    class="neubrutal-input small"
                    @input="handleQuantityChange(item)"
                  />
                </div>

                <div class="form-field col-span-2">
                  <label class="form-label">{{ t('menuTotalLabel') }} <span class="required">*</span></label>
                  <input 
                    type="text" 
                    inputmode="numeric"
                    v-model="item.totalPrice" 
                    :placeholder="`${currency} (Total)`" 
                    class="neubrutal-input small total-price-input"
                    @input="handleTotalChange(item)"
                    required
                  />
                </div>
              </div>

              <!-- Compact Portions Assignment Summary (Modal-driven) -->
              <div class="portions-assignment-summary">
                <div class="assignment-summary-header">
                  <span class="assignment-summary-title"><Users :size="13" /> {{ t('portionAllocation') }}</span>
                  
                  <span 
                    v-if="selectedFriendIds.length > 0"
                    class="status-badge-inline" 
                    :class="{ 
                      success: Number(getAssignedPortionSum(item).toFixed(1)) === (parseFloat(item.quantity as string) || 1),
                      warning: Number(getAssignedPortionSum(item).toFixed(1)) !== (parseFloat(item.quantity as string) || 1)
                    }"
                  >
                    {{ t('allocated') }}: {{ getAssignedPortionSum(item) }} / {{ item.quantity || 1 }} {{ t('portions') }}
                  </span>
                </div>

                <div class="assigned-chips-wrapper">
                  <!-- Assigned Chips -->
                  <div 
                    v-for="id in selectedFriendIds" 
                    :key="id"
                    v-show="(item.assignments && item.assignments[id] || 0) > 0"
                    class="assigned-friend-chip neubrutal-box"
                  >
                    <div class="chip-avatar-mini" :class="getFriendDetails(id)?.avatarBg">
                      <span>{{ getInitials(getFriendDetails(id)?.name || '') }}</span>
                    </div>
                    <span class="chip-name-mini">{{ getFriendDetails(id)?.name.split(' ')[0] }}</span>
                    <span class="chip-portion-badge">{{ item.assignments && item.assignments[id] }}x</span>
                    <button type="button" class="remove-chip-btn-mini" @click="item.assignments[id] = 0">
                      <X :size="12" :stroke-width="3" />
                    </button>
                  </div>

                  <!-- Add/Edit portion button -->
                  <button 
                    type="button" 
                    class="add-assignee-btn" 
                    @click="openAssignModal(index)"
                    :title="t('selectFriends')"
                  >
                    <Plus :size="14" :stroke-width="3" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          <!-- Tambah Item Button below the item rows -->
          <NeubrutalButton variant="primary" custom-class="add-item-btn-bottom" @click="addItem">
            <Plus :size="16" :stroke-width="3" />{{ t('addNewMenu') }}
          </NeubrutalButton>
        </section>

        <!-- Tax, Discount and Other Fees Section -->
        <section class="form-section-card neubrutal-box bg-white">
          <h2 class="section-title-nested"><Percent :size="18" /> {{ t('taxDiscountTitle') }}</h2>

          <!-- Dual Grid: Discount and Tax -->
          <div class="tax-discount-grid">
            
            <!-- Discount Card (Default Manual) -->
            <div class="tax-control-group neubrutal-box discount-accent-box">
              <div class="tax-header">
                <span class="tax-title">{{ t('discountLabel') }}</span>
                <div class="tax-toggle-tabs">
                  <button 
                    type="button" 
                    class="tab-btn" 
                    :class="{ active: bill.discountType === 'percent' }"
                    @click="bill.discountType = 'percent'"
                  >
                    %
                  </button>
                  <button 
                    type="button" 
                    class="tab-btn" 
                    :class="{ active: bill.discountType === 'manual' }"
                    @click="bill.discountType = 'manual'"
                  >
                    {{ currency }}
                  </button>
                </div>
              </div>

              <div class="tax-inputs-row-vertical">
                <div class="form-field flex-1" v-if="bill.discountType === 'percent'">
                  <label class="form-label">{{ t('discountPercentLabel') }}</label>
                  <div class="input-suffix-wrapper">
                    <input 
                      type="text" 
                      inputmode="numeric" 
                      v-model="bill.discountPercent" 
                      placeholder="e.g. 5" 
                      class="neubrutal-input small"
                    />
                    <span class="suffix-label">%</span>
                  </div>
                </div>
                
                <div class="form-field flex-1" v-else>
                  <label class="form-label">{{ t('discountRupiahLabel') }} ({{ currency }})</label>
                  <div class="input-prefix-wrapper">
                    <span class="prefix-label">{{ currency }}</span>
                    <input 
                      type="text" 
                      inputmode="numeric" 
                      v-model="bill.discountManual" 
                      placeholder="e.g. 20000" 
                      class="neubrutal-input small"
                      @input="bill.discountManual = sanitizeNumber(bill.discountManual)"
                    />
                  </div>
                </div>

                <!-- Calculated Discount Preview Badge -->
                <div class="calculated-preview-badge neubrutal-box" :class="{ active: calculatedDiscountAmount > 0 }">
                  <span class="preview-label">{{ t('totalDiscount') }}:</span>
                  <span class="preview-value value-red">- {{ currency }} {{ formatCurrency(calculatedDiscountAmount) }}</span>
                </div>
              </div>
            </div>

            <!-- Tax Card (Default Percent) -->
            <div class="tax-control-group neubrutal-box tax-accent-box">
              <div class="tax-header">
                <span class="tax-title">{{ t('taxLabel') }}</span>
                <div class="tax-toggle-tabs">
                  <button 
                    type="button" 
                    class="tab-btn" 
                    :class="{ active: bill.taxType === 'percent' }"
                    @click="bill.taxType = 'percent'"
                  >
                    %
                  </button>
                  <button 
                    type="button" 
                    class="tab-btn" 
                    :class="{ active: bill.taxType === 'manual' }"
                    @click="bill.taxType = 'manual'"
                  >
                    {{ currency }}
                  </button>
                </div>
              </div>

              <div class="tax-inputs-row-vertical">
                <div class="form-field flex-1" v-if="bill.taxType === 'percent'">
                  <label class="form-label">{{ t('taxPercentLabel') }}</label>
                  <div class="input-suffix-wrapper">
                    <input 
                      type="text" 
                      inputmode="numeric" 
                      v-model="bill.taxPercent" 
                      placeholder="e.g. 10" 
                      class="neubrutal-input small"
                    />
                    <span class="suffix-label">%</span>
                  </div>
                </div>
                
                <div class="form-field flex-1" v-else>
                  <label class="form-label">{{ t('taxRupiahLabel') }} ({{ currency }})</label>
                  <div class="input-prefix-wrapper">
                    <span class="prefix-label">{{ currency }}</span>
                    <input 
                      type="text" 
                      inputmode="numeric" 
                      v-model="bill.taxManual" 
                      placeholder="e.g. 15000" 
                      class="neubrutal-input small"
                      @input="bill.taxManual = sanitizeNumber(bill.taxManual)"
                    />
                  </div>
                </div>

                <!-- Calculated Tax Preview Badge -->
                <div class="calculated-preview-badge neubrutal-box" :class="{ active: calculatedTaxAmount > 0 }">
                  <span class="preview-label">{{ t('totalTax') }}:</span>
                  <span class="preview-value">{{ currency }} {{ formatCurrency(calculatedTaxAmount) }}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Other Dynamic Nested Fees -->
          <div class="other-fees-container">
            <div class="other-fees-header">
              <span class="fees-subtitle"><Coins :size="15" /> {{ t('otherFeesLabel') }}</span>
              <!-- Icon-Only Tambah Biaya Button -->
              <NeubrutalButton variant="primary" custom-class="add-fee-btn-icon-only" @click="addOtherFee" :title="t('otherFeesLabel')">
                <Plus :size="15" :stroke-width="3" />
              </NeubrutalButton>
            </div>

            <div v-if="!bill.otherFees || bill.otherFees.length === 0" class="empty-fees-notice">
              <p>{{ t('emptyFees') }}</p>
            </div>

            <div class="fees-nested-list" v-else>
              <div 
                v-for="(fee, fIndex) in bill.otherFees" 
                :key="fIndex" 
                class="fee-row-card neubrutal-box"
              >
                <!-- Fee Name -->
                <div class="form-field flex-2">
                   <label class="form-label">{{ t('feeNameLabel') }}</label>
                  <input 
                    type="text" 
                    v-model="fee.name" 
                    placeholder="e.g. Ongkir GoFood" 
                    class="neubrutal-input small"
                    required
                  />
                </div>

                <!-- Fee Amount -->
                <div class="form-field flex-1">
                  <label class="form-label">{{ t('feeAmountLabel') }} ({{ currency }})</label>
                  <input 
                    type="text" 
                    inputmode="numeric" 
                    v-model="fee.amount" 
                    :placeholder="currency" 
                    class="neubrutal-input small"
                    @input="handleFeeAmountChange(fee)"
                    required
                  />
                </div>

                <!-- Fee Delete Button -->
                <button 
                  type="button" 
                  class="fee-delete-btn" 
                  @click="removeOtherFee(fIndex)"
                  :title="t('removeItem')"
                >
                  <Trash2 :size="14" :stroke-width="2.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Final Summary Bar & Save Actions -->
        <section class="summary-section neubrutal-box">
          <div class="total-bar">
            <span class="total-label">{{ t('totalBill') }}</span>
            <span class="total-val">{{ currency }} {{ formatCurrency(totalAmount) }}</span>
          </div>

          <div class="action-footer-buttons">
            <NeubrutalButton variant="ghost" custom-class="flex-1 cancel-btn" @click="confirmCancel">
               {{ t('cancel') }}
            </NeubrutalButton>
            <NeubrutalButton type="submit" variant="primary" custom-class="flex-1 save-btn">
              <Users :size="18" :stroke-width="3" /> {{ t('previewSplitBtn') }}
            </NeubrutalButton>
          </div>
        </section>

      </form>
    </main>

    <!-- Invite Friends Checklist Modal (Main Tagihan) -->
    <NeubrutalModal :show="showInviteModal" accent="primary" @close="showInviteModal = false">
      <div class="modal-header">
        <div class="modal-title-wrapper">
          <h2 class="modal-title"><Users class="title-icon" /> {{ t('selectFriends') }}</h2>
          <span class="modal-subtitle">{{ t('participatingSubtitle') }}</span>
        </div>
        <button class="close-modal-btn" @click="showInviteModal = false">
          <X :size="20" :stroke-width="3" />
        </button>
      </div>

      <div class="modal-body">
        <!-- Search & Quick Add Friend -->
        <div class="search-and-add-wrapper">
          <div class="search-input-container">
            <Search :size="18" :stroke-width="3" class="search-icon-new" />
            <input 
              type="text" 
              v-model="inviteSearchQuery" 
              :placeholder="t('searchFriendPlaceholder')" 
              class="neubrutal-input search-input-new"
            />
          </div>
          <NeubrutalButton variant="primary" custom-class="add-friend-btn-quick" @click="openQuickAddFriendModal" title="Tambah Teman Baru">
            <Plus :size="22" :stroke-width="3.5" />
          </NeubrutalButton>
        </div>

        <!-- Friends Checklist List -->
        <div class="friends-invite-list-new">
          <div 
            v-for="friend in filteredFriendsToInvite" 
            :key="friend.id"
            class="invite-friend-row-new"
            :class="{ selected: isFriendSelected(friend.id) }"
            @click="toggleSelectFriend(friend.id)"
          >
            <div class="custom-checkbox-neubrutal">
              <div class="checkbox-box" :class="{ checked: isFriendSelected(friend.id) }">
                <CheckSquare v-if="isFriendSelected(friend.id)" :size="14" class="check-icon-svg" />
              </div>
            </div>

            <FriendAvatar :name="friend.name" :avatar-bg="friend.avatarBg" size="sm" />
            
            <div class="friend-name-details">
              <span class="invite-name-new">{{ friend.name }}</span>
            </div>
          </div>
        </div>

        <NeubrutalButton variant="primary" custom-class="modal-submit-btn-new" @click="showInviteModal = false">
          {{ t('doneBtn') }} ({{ selectedFriendIds.length }} {{ t('friendLabel') }})
        </NeubrutalButton>
      </div>
    </NeubrutalModal>

    <!-- Quick Add Friend Modal -->
    <NeubrutalModal :show="showQuickAddFriendModal" accent="primary" @close="showQuickAddFriendModal = false">
      <div class="modal-header">
        <div class="modal-title-wrapper">
          <h2 class="modal-title">
            <UserPlus class="title-icon" :size="20" :stroke-width="2.5" />
            {{ t('addFriendBtn') }}
          </h2>
          <span class="modal-subtitle">
            {{ language === 'en' ? 'Add a new friend to split bills with' : 'Tambah teman patungan baru ke dalam daftar' }}
          </span>
        </div>
        <button class="close-modal-btn" @click="showQuickAddFriendModal = false">
          <X :size="20" :stroke-width="2.5" />
        </button>
      </div>
      
      <form @submit.prevent="handleQuickAddFriendSubmit" class="modal-body">
        <div class="form-field">
          <label class="form-label">{{ t('nameLabel') }} <span class="required">*</span></label>
          <input 
            type="text" 
            v-model="quickFriendForm.name" 
            :placeholder="t('namePlaceholder')" 
            class="neubrutal-input" 
            required 
          />
        </div>
        
        <div class="form-field">
          <label class="form-label">{{ t('phoneLabel') }}</label>
          <input 
            type="tel" 
            v-model="quickFriendForm.phone" 
            :placeholder="t('phonePlaceholder')" 
            class="neubrutal-input" 
          />
        </div>
        
        <div class="form-field">
          <label class="form-label">{{ t('emailLabel') }}</label>
          <input 
            type="email" 
            v-model="quickFriendForm.email" 
            :placeholder="t('emailPlaceholder')" 
            class="neubrutal-input" 
          />
        </div>

        <div class="modal-footer">
          <NeubrutalButton variant="ghost" custom-class="modal-btn" @click="showQuickAddFriendModal = false">
            {{ t('cancel') }}
          </NeubrutalButton>
          <NeubrutalButton type="submit" variant="primary" custom-class="modal-btn">
            {{ t('save') }}
          </NeubrutalButton>
        </div>
      </form>
    </NeubrutalModal>

    <!-- Assign Friends to Specific Item Modal (Modal-driven portions) -->
    <NeubrutalModal :show="showAssignModal" accent="warning" @close="closeAssignModal">
      <div class="modal-body" v-if="activeAssignItem">
        <div class="modal-header-assign">
          <div class="modal-title-wrapper">
            <h2 class="modal-title"><ShoppingBag class="title-icon" /> {{ t('allocateItemTitle') }}</h2>
            <span class="modal-subtitle">
              {{ t('menuText') }}: {{ activeAssignItem.name || (language === 'en' ? 'Unnamed' : 'Tanpa Nama') }}
            </span>
          </div>
          <button type="button" class="close-modal-btn" @click="closeAssignModal">
            <X :size="20" :stroke-width="3" />
          </button>
        </div>

        <div class="modal-info-summary">
          <div class="summary-info-pill qty-pill">
            <span class="label">{{ t('qty') }}:</span>
            <span class="val">{{ activeAssignItem.quantity || 1 }} {{ t('portions') }}</span>
          </div>
          <div class="summary-info-pill price-pill">
            <span class="label">{{ t('total') }}:</span>
            <span class="val">{{ currency }} {{ formatCurrency(Number(activeAssignItem.totalPrice) || 0) }}</span>
          </div>
        </div>

        <div class="modal-actions-top">
          <button 
            type="button" 
            class="auto-split-btn" 
            @click="autoSplitItem(activeAssignItem!)"
          >
            <Users :size="14" /> {{ t('autoSplit') }}
          </button>
        </div>

        <div class="empty-assignment-notice" v-if="selectedFriendIds.length === 0">
          <p>{{ t('emptyAssignFriends') }}</p>
        </div>

        <div class="assignment-friends-list modal-friends-list" v-else>
          <div 
            v-for="id in selectedFriendIds" 
            :key="id" 
            class="assignment-friend-row-new"
            :class="{ active: (activeAssignItem.assignments && activeAssignItem.assignments[id] || 0) > 0 }"
          >
            <div class="friend-row-main" @click="toggleFriendAssignment(activeAssignItem!, id)">
              <div class="custom-checkbox-neubrutal">
                <div class="checkbox-box" :class="{ checked: (activeAssignItem.assignments && activeAssignItem.assignments[id] || 0) > 0 }">
                  <CheckSquare v-if="(activeAssignItem.assignments && activeAssignItem.assignments[id] || 0) > 0" :size="14" class="check-icon-svg" />
                </div>
              </div>
              
              <FriendAvatar :name="getFriendDetails(id)?.name || ''" :avatar-bg="getFriendDetails(id)?.avatarBg" size="sm" />
              
              <div class="friend-name-details">
                <span class="assignment-name-new">{{ getFriendDetails(id)?.name }}</span>
              </div>
            </div>

            <!-- Quantity portion counter capsule inside modal -->
                <button type="button" class="capsule-btn minus" @click="decrementPortion(activeAssignItem!, id)">-</button>
                <input 
                  type="text" 
                  class="capsule-input" 
                  :value="activeAssignItem.assignments && activeAssignItem.assignments[id] !== undefined ? activeAssignItem.assignments[id] : 0" 
                  @input="e => setItemPortion(activeAssignItem!, id, (e.target as HTMLInputElement).value)"
                />
                <button type="button" class="capsule-btn plus" @click="incrementPortion(activeAssignItem!, id)">+</button>
            </div>
          </div>

        <div class="modal-footer-status-bar">
          <div 
            class="status-banner" 
            :class="{ 
              success: Number(getAssignedPortionSum(activeAssignItem).toFixed(1)) === (parseFloat(activeAssignItem.quantity as string) || 1),
              warning: Number(getAssignedPortionSum(activeAssignItem).toFixed(1)) !== (parseFloat(activeAssignItem.quantity as string) || 1)
            }"
          >
            <span class="status-icon-dot"></span>
            <span class="status-text">
              {{ t('allocated') }}: <strong>{{ getAssignedPortionSum(activeAssignItem) }}</strong> {{ t('of') }} <strong>{{ activeAssignItem.quantity || 1 }}</strong> {{ t('portions') }}
            </span>
          </div>
        </div>

        <NeubrutalButton variant="primary" custom-class="modal-submit-btn-new" @click="closeAssignModal">
          {{ t('doneBtn') }}
        </NeubrutalButton>
      </div>
    </NeubrutalModal>

    <!-- Beautiful Neubrutalist Cancel Confirmation Modal -->
    <NeubrutalModal :show="showCancelConfirmModal" accent="danger" @close="showCancelConfirmModal = false">
      <div class="confirm-modal-body">
        <div class="confirm-icon-wrapper neubrutal-box">
          <Trash2 :size="32" :stroke-width="2.5" />
        </div>
        
        <h2 class="confirm-title">{{ t('cancelBillConfirmTitle') }}</h2>
        <p class="confirm-text">
          {{ t('cancelBillConfirmText') }}
        </p>
        
        <div class="confirm-actions-row">
          <NeubrutalButton variant="ghost" custom-class="flex-1 confirm-btn-cancel" @click="showCancelConfirmModal = false">
            {{ t('goBack') }}
          </NeubrutalButton>
          <NeubrutalButton variant="danger" custom-class="flex-1 confirm-btn-yes save-btn-final" @click="handleCancelConfirm">
            {{ t('yesCancel') }}
          </NeubrutalButton>
        </div>
      </div>
    </NeubrutalModal>
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
  color: var(--text-color);
  text-decoration: none;
  background: var(--box-bg);
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: var(--shadow-hard-sm);
  border: 3px solid #111;
}

.back-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px #111;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-color);
  text-align: center;
}

.app-main {
  padding: 0 24px 32px;
}

.bill-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section-card {
  padding: 18px;
  background: var(--box-bg);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title-nested {
  font-size: 1.1rem;
  font-weight: 850;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px solid #111;
  padding-bottom: 8px;
  margin-bottom: 4px;
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
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-color);
}

.required {
  color: #EF4444;
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
}

.neubrutal-input.small {
  padding: 8px 12px;
  font-size: 0.85rem;
}

.total-price-input {
  background-color: #F0FDF4 !important; /* Soft mint green highlight for editable total field */
  border-color: #111 !important;
}

.neubrutal-select {
  width: 100%;
  padding: 12px 16px;
  border: 3px solid #111;
  border-radius: var(--radius-lg);
  font-family: 'Inter', sans-serif;
  font-weight: 750;
  font-size: 0.95rem;
  box-shadow: var(--shadow-hard-sm);
  outline: none;
  background: var(--box-bg);
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23111' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 16px;
  padding-right: 40px;
}

/* Invited Friends section style */
.empty-invited-friends {
  padding: 16px;
  text-align: center;
  font-weight: 700;
  color: var(--text-color-muted);
  font-size: 0.8rem;
  border: 2px dashed var(--text-color-muted);
  border-radius: var(--radius-md);
  background: var(--box-bg-alt);
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.friend-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--box-bg);
  border-radius: var(--radius-lg);
  border: 2px solid #111;
  box-shadow: 2px 2px 0px #111;
}

.chip-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #111;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.65rem;
  font-weight: 800;
}

.avatar-bg-0 { background: var(--mint-green); }
.avatar-bg-1 { background: var(--pastel-blue); }
.avatar-bg-2 { background: var(--soft-yellow); }
.avatar-bg-3 { background: var(--peach); }

.chip-name {
  font-size: 0.8rem;
  font-weight: 750;
  color: var(--text-color);
}

.remove-chip-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #EF4444;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}

/* Icon-Only Invite friends button */
.invite-btn-icon-only {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 !important;
  box-shadow: 1.5px 1.5px 0px #111 !important;
}

.invite-btn-icon-only:active {
  box-shadow: none !important;
}

/* Compact Portions Assignment Summary CSS */
.portions-assignment-summary {
  margin-top: 14px;
  padding: 10px 12px;
  background: var(--box-bg-alt);
  border: 3px solid #111;
  box-shadow: 3px 3px 0px #111;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assignment-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assignment-summary-title {
  font-size: 0.75rem;
  font-weight: 850;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-badge-inline {
  font-size: 0.65rem;
  font-weight: 850;
  padding: 2px 6px;
  border-radius: 4px;
  border: 2px solid #111;
}

.status-badge-inline.success {
  background: var(--mint-green);
  color: #111;
}

.status-badge-inline.warning {
  background: var(--peach);
  color: #111;
}

.assigned-chips-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.assigned-friend-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--box-bg);
  border-radius: var(--radius-md);
  border: 2px solid #111;
  box-shadow: 1.5px 1.5px 0px #111;
}

.chip-avatar-mini {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #111;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.55rem;
  font-weight: 850;
}

.chip-name-mini {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--text-color);
}

.chip-portion-badge {
  background: var(--soft-yellow);
  padding: 0px 4px;
  border-radius: 4px;
  border: 1px solid #111;
  font-size: 0.65rem;
  font-weight: 850;
  color: #111;
}

.remove-chip-btn-mini {
  background: none;
  border: none;
  cursor: pointer;
  color: #EF4444;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1px;
}

.add-assignee-btn {
  width: 28px;
  height: 28px;
  border: 2.5px solid #111;
  background: var(--mint-green);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 1.5px 1.5px 0px #111;
  transition: transform 0.1s, box-shadow 0.1s;
}

.add-assignee-btn:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

/* Modal specific assignment layouts */
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
  position: relative;
  overflow: hidden;
  border: 4px solid #111 !important;
  box-shadow: 8px 8px 0px #111 !important;
  border-radius: 24px !important;
  padding: 28px 20px 20px !important;
  background: var(--box-bg);
  width: 100%;
  max-width: 420px;
  animation: pop-modal 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop-modal {
  from { transform: scale(0.85) translateY(15px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

.modal-accent-bar {
  height: 8px;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  border-bottom: 3px solid #111;
}

.modal-accent-bar.default-accent { background: var(--mint-green); }
.modal-accent-bar.pizza-accent { background: var(--peach); }
.modal-accent-bar.coffee-accent { background: var(--pastel-blue); }

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
  font-size: 0.75rem;
  color: var(--text-color-muted);
  font-weight: 700;
}

.highlight-item-name {
  color: #2563EB;
  background: #EFF6FF;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1.5px solid #111;
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
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 14px;
}

/* Modal Info Summary */
.modal-info-summary {
  display: flex;
  gap: 10px;
}

.summary-info-pill {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: var(--box-bg-alt);
  border: 2.5px solid #111;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 800;
}

.summary-info-pill .label {
  color: var(--text-color-muted);
}

.summary-info-pill .val {
  color: var(--text-color);
  font-weight: 900;
}

.modal-actions-top {
  display: flex;
  justify-content: flex-end;
}

.auto-split-btn {
  background: #FEF08A; /* Soft bright yellow */
  border: 2.5px solid #111;
  cursor: pointer;
  color: #111;
  font-size: 0.8rem;
  font-weight: 850;
  padding: 6px 12px;
  border-radius: 8px;
  box-shadow: 2px 2px 0px #111;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: transform 0.1s, box-shadow 0.1s;
}

.auto-split-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px #111;
}

.empty-assignment-notice {
  padding: 10px;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-color-muted);
  background: var(--box-bg-alt);
  border: 2px dashed var(--text-color-muted);
  border-radius: 6px;
}

.assignment-friends-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-friends-list {
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
}

/* Neubrutalist Row layout */
.assignment-friend-row-new {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--box-bg);
  border: 2.5px solid #111;
  border-radius: 12px;
  box-shadow: 2.5px 2.5px 0px #111;
  transition: all 0.15s;
  margin-bottom: 8px;
}

.assignment-friend-row-new.active {
  background: #F0FDF4;
  border-color: #111;
  box-shadow: 3.5px 3.5px 0px #111;
  transform: translate(-1px, -1px);
}

.friend-row-main {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: 1;
}

/* Neubrutalist Custom Checkbox */
.custom-checkbox-neubrutal {
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-box {
  width: 22px;
  height: 22px;
  border: 2.5px solid #111;
  border-radius: 6px;
  background: var(--box-bg);
  transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-box.checked {
  background: #4ADE80; /* Neubrutal green */
  transform: scale(1.05);
}

.check-icon-svg {
  color: #111;
  stroke-width: 4px;
}

.assignment-avatar-new {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2.5px solid #111;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 850;
  box-shadow: 1.5px 1.5px 0px #111;
}

.friend-name-details {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.assignment-name-new {
  font-size: 0.85rem;
  font-weight: 850;
  color: var(--text-color);
}

/* Portion counter capsule design inside modal */
.portion-counter-capsule {
  display: flex;
  align-items: center;
  background: #F3F4F6;
  border: 2.5px solid #111;
  border-radius: 30px;
  padding: 2px 4px;
  box-shadow: 1.5px 1.5px 0px #111;
}

.capsule-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  font-size: 1rem;
  font-weight: 950;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--box-bg);
  border: 1.5px solid #111;
  transition: transform 0.05s;
}

.capsule-btn:active {
  transform: scale(0.9);
}

.capsule-btn.minus {
  background: #FEE2E2;
  color: #EF4444;
}

.capsule-btn.plus {
  background: #DCFCE7;
  color: #15803D;
}

.capsule-input {
  width: 32px;
  background: transparent;
  border: none;
  text-align: center;
  font-weight: 900;
  font-size: 0.8rem;
  font-family: 'Inter', sans-serif;
  color: var(--text-color);
  outline: none;
}

/* Modal Receipt Status Banner */
.modal-footer-status-bar {
  margin-top: 10px;
}

.status-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border: 2.5px solid #111;
  border-radius: 12px;
  font-size: 0.8rem;
  box-shadow: 2px 2px 0px #111;
}

.status-banner.success {
  background: var(--mint-green);
}

.status-banner.warning {
  background: var(--peach);
}

.status-icon-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #111;
  border: 1px solid white;
}

.status-text {
  color: #111;
  font-weight: 750;
}

.status-text strong {
  font-weight: 900;
}

/* Big Neubrutal Save Button */
.modal-submit-btn-new {
  width: 100%;
  padding: 14px !important;
  font-size: 1rem !important;
  font-weight: 900 !important;
  margin-top: 6px;
  background: #4ADE80 !important; /* Bold green neubrutal */
  border: 3px solid #111 !important;
  box-shadow: 4px 4px 0px #111 !important;
  border-radius: 14px !important;
  transition: transform 0.1s, box-shadow 0.1s;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #111;
}

.modal-submit-btn-new:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #111 !important;
}

/* Main Invite Modal specific styles */
.invite-modal-content {
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.search-wrapper-new {
  position: relative;
  width: 100%;
  margin-bottom: 6px;
}

.search-icon-new {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #111;
  pointer-events: none;
}

.search-input-new {
  padding-left: 44px !important;
  border: 2.5px solid #111 !important;
  border-radius: 12px !important;
  box-shadow: 2px 2px 0px #111 !important;
  background: var(--box-bg-alt) !important;
  color: var(--text-color) !important;
}

.search-and-add-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.search-input-container {
  position: relative;
  flex: 1;
}

:deep(.add-friend-btn-quick) {
  width: 44px;
  height: 44px;
  padding: 0 !important;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  border-radius: 12px !important;
  border: 2.5px solid #111 !important;
  box-shadow: 2px 2px 0px #111 !important;
}

:deep(.add-friend-btn-quick:active) {
  transform: translate(1px, 1px) !important;
  box-shadow: 1px 1px 0px #111 !important;
}

.modal-footer {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  width: 100%;
}

:deep(.modal-btn) {
  flex: 1;
  padding: 12px 16px;
  font-size: 1rem;
  box-shadow: var(--shadow-hard-sm) !important;
}

.friends-invite-list-new {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
  margin-top: 10px;
}

.invite-friend-row-new {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--box-bg);
  border: 2.5px solid #111;
  border-radius: 12px;
  box-shadow: 2.5px 2.5px 0px #111;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 8px;
}

.invite-friend-row-new.selected {
  background: var(--soft-yellow);
  box-shadow: 3.5px 3.5px 0px #111;
  transform: translate(-1px, -1px);
}

.invite-avatar-new {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2.5px solid #111;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 850;
  box-shadow: 1.5px 1.5px 0px #111;
}

.invite-name-new {
  font-size: 0.85rem;
  font-weight: 850;
  color: var(--text-color);
}

/* Items Nesting & Headers */
.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #111;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.items-header .section-title-nested {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.nested-items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-row-card {
  background: var(--box-bg-alt);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-index-badge {
  font-size: 0.75rem;
  font-weight: 800;
  background: var(--soft-yellow);
  padding: 2px 8px;
  border: 2px solid #111;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.item-delete-btn {
  background: #FEE2E2;
  border: 2px solid #111;
  color: #EF4444;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 1px 1px 0px #111;
  transition: transform 0.1s, box-shadow 0.1s;
}

.item-delete-btn:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.item-fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.col-span-2 {
  grid-column: span 2;
}

/* Standout bottom add-item button */
.add-item-btn-bottom {
  width: 100%;
  padding: 12px !important;
  font-size: 0.9rem !important;
  font-weight: 850 !important;
  margin-top: 14px;
  background: var(--soft-yellow) !important;
  border: 3px solid #111 !important;
  box-shadow: 4px 4px 0px #111 !important;
  border-radius: 12px !important;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.1s;
}

.add-item-btn-bottom:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #111 !important;
}

/* Tax, Discount & Other Fees Neubrutal Styling */
.tax-discount-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 600px) {
  .tax-discount-grid {
    grid-template-columns: 1fr;
  }
}

.tax-inputs-row-vertical {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.discount-accent-box {
  border-color: #EF4444 !important; /* Neubrutal red for discount */
}

.tax-accent-box {
  border-color: #2563EB !important; /* Neubrutal blue for tax */
}

.value-red {
  color: #EF4444 !important;
}

.tax-control-group {
  padding: 14px;
  background: var(--box-bg-alt);
  border: 3px solid #111;
  border-radius: 12px;
  box-shadow: 3px 3px 0px #111;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tax-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.tax-title {
  font-size: 0.85rem;
  font-weight: 850;
  color: var(--text-color);
}

.tax-toggle-tabs {
  display: flex;
  background: #E5E7EB;
  border: 2px solid #111;
  border-radius: 8px;
  padding: 2px;
}

.tab-btn {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 4px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #555;
  transition: all 0.1s;
}

.tab-btn.active {
  background: var(--box-bg);
  border: 1.5px solid #111;
  color: var(--text-color);
  box-shadow: 1px 1px 0px #111;
  font-weight: 850;
}

.input-suffix-wrapper, .input-prefix-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.suffix-label {
  position: absolute;
  right: 12px;
  font-weight: 900;
  font-size: 0.85rem;
  color: var(--text-color);
}

.prefix-label {
  position: absolute;
  left: 12px;
  font-weight: 900;
  font-size: 0.85rem;
  color: var(--text-color);
}

.input-suffix-wrapper input {
  padding-right: 32px !important;
}

.input-prefix-wrapper input {
  padding-left: 38px !important;
}

.calculated-preview-badge {
  display: flex;
  flex-direction: column;
  padding: 6px 12px;
  background: var(--box-bg);
  border: 2.5px solid #111;
  border-radius: 10px;
  box-shadow: 2px 2px 0px #111;
  min-height: 45px;
  justify-content: center;
}

.calculated-preview-badge.active {
  background: var(--soft-yellow);
}

.preview-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--text-color-muted);
}

.preview-value {
  font-size: 0.8rem;
  font-weight: 900;
  color: var(--text-color);
}

/* Other Fees dynamic nested list */
.other-fees-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}

.other-fees-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fees-subtitle {
  font-size: 0.85rem;
  font-weight: 850;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 4px;
}

.add-fee-btn-icon-only {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 !important;
  box-shadow: 1.5px 1.5px 0px #111 !important;
}

.add-fee-btn-icon-only:active {
  box-shadow: none !important;
}

.empty-fees-notice {
  padding: 12px;
  text-align: center;
  font-weight: 750;
  color: var(--text-color-muted);
  font-size: 0.75rem;
  border: 2px dashed var(--text-color-muted);
  border-radius: 8px;
  background: var(--box-bg-alt);
}

.fees-nested-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fee-row-card {
  background: var(--box-bg-alt);
  padding: 8px 12px;
  border: 2.5px solid #111;
  border-radius: 10px;
  box-shadow: 2px 2px 0px #111;
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.flex-2 {
  flex: 2;
}

.small-select {
  padding: 8px 12px !important;
  font-size: 0.8rem !important;
  border: 2.5px solid #111 !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  background-position: right 8px center !important;
  background-size: 12px !important;
}

.fee-delete-btn {
  background: #FEE2E2;
  border: 2px solid #111;
  color: #EF4444;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 1px 1px 0px #111;
  margin-bottom: 2px;
  transition: transform 0.1s, box-shadow 0.1s;
}

.fee-delete-btn:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

/* Summary Section */
.summary-section {
  background: var(--soft-yellow);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.total-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-size: 0.85rem;
  font-weight: 850;
  color: #111;
  letter-spacing: 0.5px;
}

.total-val {
  font-size: 1.3rem;
  font-weight: 900;
  color: #111;
}

.action-footer-buttons {
  display: flex;
  gap: 12px;
}

.cancel-btn, .save-btn {
  padding: 12px;
  font-size: 0.95rem;
  box-shadow: var(--shadow-hard-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  font-weight: 800;
}

.cancel-btn:active, .save-btn:active {
  box-shadow: 1px 1px 0px #111;
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

.neubrutal-btn.primary.danger {
  background: #EF4444 !important;
  color: white !important;
  border: 3.5px solid #111 !important;
  box-shadow: 4px 4px 0px #111 !important;
  font-weight: 850 !important;
}

.neubrutal-btn.primary.danger:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #111 !important;
}

/* Page Specific Mobile Responsive Overrides */
@media (max-width: 480px) {
  .form-row {
    flex-direction: column !important;
    gap: 12px !important;
  }
}

@media (max-width: 420px) {
  .app-main {
    padding: 0 12px 32px !important;
  }
  
  .form-section-card {
    padding: 14px !important;
  }
  
  .item-row-card {
    padding: 12px !important;
  }
  
  .portions-assignment-summary {
    padding: 10px !important;
  }

  .portion-counter-capsule {
    padding: 2px 4px !important;
  }

  .capsule-btn {
    width: 26px !important;
    height: 26px !important;
  }

  .capsule-input {
    width: 22px !important;
    font-size: 0.8rem !important;
  }
  
  .cancel-btn, .save-btn {
    padding: 10px 8px !important;
    font-size: 0.85rem !important;
  }
}

:global(.dark-theme) .assignment-friend-row-new.active {
  background-color: #052e16 !important;
}
:global(.dark-theme) .invite-friend-row-new.selected {
  background-color: #78350f !important;
}
</style>
