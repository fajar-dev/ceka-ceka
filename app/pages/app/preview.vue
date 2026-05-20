<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Check, ShoppingBag, CreditCard, Coins, Calendar, ChevronDown, ChevronUp } from '@lucide/vue'
import { useCekaSettings } from '~/composables/useCekaSettings'
import { useCekaFriends } from '~/composables/useCekaFriends'
import type { Friend, BillItem, OtherFee, HistoryRecord } from '~/types'

const { currency, loadSettings, t, language } = useCekaSettings()
const { getFriendDetails, getInitials, loadFriends } = useCekaFriends()

interface PendingBill {
  title: string
  date: string
  category: string
  items: BillItem[]
  selectedFriendIds: (string | number)[]
  taxType: 'percent' | 'manual'
  taxPercent: number
  taxManual: number
  discountType: 'percent' | 'manual'
  discountPercent: number
  discountManual: number
  otherFees: OtherFee[]
}

const pendingBill = ref<PendingBill | null>(null)
const expandedFriends = ref<Record<string | number, boolean>>({})

onMounted(() => {
  loadSettings()
  loadFriends()

  // Load pending bill
  const pendingStr = localStorage.getItem('ceka_pending_bill')
  if (!pendingStr) {
    useRouter().push('/app/bill')
    return
  }

  try {
    pendingBill.value = JSON.parse(pendingStr)
  } catch (e) {
    console.error('Failed to parse ceka_pending_bill', e)
    useRouter().push('/app/bill')
    return
  }
})

const toggleExpandFriend = (id: string | number) => {
  expandedFriends.value[id] = !expandedFriends.value[id]
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID').format(Math.round(val))
}

// Pricing computations
const subtotalItems = computed((): number => {
  if (!pendingBill.value) return 0
  return pendingBill.value.items.reduce((sum, item) => {
    return sum + (parseFloat(item.totalPrice as string) || 0)
  }, 0)
})

const subtotalOtherFees = computed((): number => {
  if (!pendingBill.value || !pendingBill.value.otherFees) return 0
  return pendingBill.value.otherFees.reduce((sum, fee) => {
    return sum + (parseFloat(fee.amount as string) || 0)
  }, 0)
})

const discountAmount = computed((): number => {
  if (!pendingBill.value) return 0
  const base = subtotalItems.value + subtotalOtherFees.value
  if (pendingBill.value.discountType === 'percent') {
    const pct = parseFloat(pendingBill.value.discountPercent as unknown as string) || 0
    return Math.round(base * (pct / 100))
  } else {
    return parseFloat(pendingBill.value.discountManual as unknown as string) || 0
  }
})

const taxAmount = computed((): number => {
  if (!pendingBill.value) return 0
  const base = Math.max(0, subtotalItems.value + subtotalOtherFees.value - discountAmount.value)
  if (pendingBill.value.taxType === 'percent') {
    const pct = parseFloat(pendingBill.value.taxPercent as unknown as string) || 0
    return Math.round(base * (pct / 100))
  } else {
    return parseFloat(pendingBill.value.taxManual as unknown as string) || 0
  }
})

const totalAmount = computed((): number => {
  const base = subtotalItems.value + subtotalOtherFees.value
  return Math.max(0, base - discountAmount.value + taxAmount.value)
})

interface FriendShare {
  id: string | number
  name: string
  avatarBg: string
  initials: string
  rawSubtotal: number
  feeShare: number
  discountShare: number
  taxShare: number
  finalTotal: number
  details: {
    name: string
    portion: string
    cost: number
  }[]
}

// Mathematically sound splitting logic per person
const individualShares = computed((): FriendShare[] => {
  if (!pendingBill.value) return []
  
  const selectedFriendIds = pendingBill.value.selectedFriendIds || []
  const totalItemsSubtotal = subtotalItems.value
  
  // Calculate raw menu subtotals for each friend
  const rawSubtotals: Record<string | number, number> = {}
  const friendDetails: Record<string | number, { name: string; portion: string; cost: number }[]> = {}
  
  selectedFriendIds.forEach(fId => {
    rawSubtotals[fId] = 0
    friendDetails[fId] = []
  })
  
  pendingBill.value.items.forEach(item => {
    const assignments = item.assignments || {}
    const assignedFriendIds = Object.keys(assignments).filter(id => parseFloat(assignments[id] as unknown as string) > 0)
    
    // If no one is assigned, split equally among everyone
    const sumPortions = assignedFriendIds.reduce((sum, id) => sum + (parseFloat(assignments[id] as unknown as string) || 0), 0)
    
    if (sumPortions === 0) {
      const sharePrice = selectedFriendIds.length > 0 ? (parseFloat(item.totalPrice as string) || 0) / selectedFriendIds.length : 0;
      selectedFriendIds.forEach(fId => {
        rawSubtotals[fId] = (rawSubtotals[fId] || 0) + sharePrice;
        friendDetails[fId]!.push({
          name: item.name,
          portion: `1/${selectedFriendIds.length}`,
          cost: sharePrice
        });
      });
    } else {
      selectedFriendIds.forEach(fId => {
        const portion = parseFloat(assignments[fId] as unknown as string) || 0
        if (portion > 0) {
          const sharePrice = (portion / sumPortions) * (parseFloat(item.totalPrice as string) || 0)
          rawSubtotals[fId] = (rawSubtotals[fId] || 0) + sharePrice;
          friendDetails[fId]!.push({
            name: item.name,
            portion: `${portion} portion(s)`,
            cost: sharePrice
          })
        }
      })
    }
  })
  
  // Distribute tax & discounts proportionally, but split additional fees equally (bagi rata)
  return selectedFriendIds.map(fId => {
    const friend = getFriendDetails(fId) || { name: 'Unknown', avatarBg: 'avatar-bg-0' }
    const rawSubtotal = rawSubtotals[fId] || 0
    
    // Proportional ratio
    const ratio = totalItemsSubtotal > 0 ? (rawSubtotal / totalItemsSubtotal) : (1 / selectedFriendIds.length)
    
    // Additional fees are split equally (bagi rata) among all participants
    const feeShare = selectedFriendIds.length > 0 ? (subtotalOtherFees.value / selectedFriendIds.length) : 0
    const discountShare = ratio * discountAmount.value
    const taxShare = ratio * taxAmount.value
    
    const finalTotal = Math.max(0, rawSubtotal + feeShare - discountShare + taxShare)
    
    return {
      id: fId,
      name: friend.name,
      avatarBg: friend.avatarBg || 'avatar-bg-0',
      initials: getInitials(friend.name),
      rawSubtotal,
      feeShare,
      discountShare,
      taxShare,
      finalTotal,
      details: friendDetails[fId] || []
    }
  })
})

const getCategoryIcon = (cat: string) => {
  return cat === 'pizza' || cat === 'coffee' ? cat : 'file'
}

const getIconBg = (cat: string) => {
  if (cat === 'pizza') return 'icon-bg-1'
  if (cat === 'coffee') return 'icon-bg-2'
  return 'icon-bg-0'
}

const goBackToEdit = () => {
  useRouter().push('/app/bill')
}

const saveAndCommitSplit = () => {
  if (!pendingBill.value) return
  
  const savedHistory = localStorage.getItem('ceka_history')
  const history = savedHistory ? JSON.parse(savedHistory) : []
  
  const validItems = pendingBill.value.items
  
  const newBill: HistoryRecord = {
    id: Date.now(),
    title: pendingBill.value.title,
    date: pendingBill.value.date,
    peopleCount: pendingBill.value.selectedFriendIds.length || 1,
    amount: totalAmount.value,
    iconType: pendingBill.value.category,
    iconBg: getIconBg(pendingBill.value.category),
    items: validItems.map(item => ({
      name: item.name,
      price: parseInt(item.price as string) || 0,
      quantity: parseInt(item.quantity as string) || 1,
      totalPrice: parseInt(item.totalPrice as string) || 0,
      assignments: item.assignments || {}
    })),
    invitedFriends: pendingBill.value.selectedFriendIds.map(id => {
      const f = getFriendDetails(id)
      return f ? { id: f.id, name: f.name, avatarBg: f.avatarBg } : null
    }).filter((f): f is Friend => f !== null),
    taxType: pendingBill.value.taxType,
    taxPercent: parseFloat(pendingBill.value.taxPercent as unknown as string) || 0,
    taxManual: parseFloat(pendingBill.value.taxManual as unknown as string) || 0,
    taxAmount: taxAmount.value,
    discountType: pendingBill.value.discountType,
    discountPercent: parseFloat(pendingBill.value.discountPercent as unknown as string) || 0,
    discountManual: parseFloat(pendingBill.value.discountManual as unknown as string) || 0,
    discountAmount: discountAmount.value,
    otherFees: (pendingBill.value.otherFees || []).map(fee => ({
      name: fee.name || 'Biaya Tambahan',
      amount: parseFloat(fee.amount as string) || 0
    })),
    subtotalItems: subtotalItems.value,
    subtotalOtherFees: subtotalOtherFees.value,
    shares: individualShares.value.map(share => ({
      friendId: share.id,
      name: share.name,
      amount: share.finalTotal
    }))
  }
  
  history.unshift(newBill)
  localStorage.setItem('ceka_history', JSON.stringify(history))
  
  // Clear draft & pending bills
  localStorage.removeItem('ceka_bill_draft')
  localStorage.removeItem('ceka_pending_bill')
  
  // Back to home
  useRouter().push('/app')
}
</script>

<template>
  <div class="neubrutal-container" v-if="pendingBill">
    <AppHeader :title="t('previewSplitTitle')" @back="goBackToEdit" :show-back-button="true" />

    <main class="app-main">
      <section class="preview-content">
        
        <!-- Header Info Card -->
        <div class="bill-info-summary-card neubrutal-box bg-white">
          <div class="bill-meta-header">
            <div class="category-icon-wrapper neubrutal-box" :class="getIconBg(pendingBill.category)">
              <ShoppingBag v-if="getCategoryIcon(pendingBill.category) === 'pizza'" :size="22" />
              <Coins v-else-if="getCategoryIcon(pendingBill.category) === 'coffee'" :size="22" />
              <CreditCard v-else :size="22" />
            </div>
            
            <div class="bill-title-desc">
              <h2 class="bill-preview-title">{{ pendingBill.title }}</h2>
              <span class="bill-preview-date"><Calendar :size="12" /> {{ pendingBill.date }}</span>
            </div>
          </div>

          <div class="divider-line"></div>

          <!-- Cost Breakdown List -->
          <div class="cost-summary-list">
            <div class="cost-summary-item">
              <span class="label">{{ language === 'en' ? 'Items Subtotal' : 'Subtotal Menu' }}</span>
              <span class="val">{{ currency }} {{ formatCurrency(subtotalItems) }}</span>
            </div>
            
            <div class="cost-summary-item" v-if="subtotalOtherFees > 0">
              <span class="label">{{ language === 'en' ? 'Additional Fees' : 'Biaya Tambahan' }}</span>
              <span class="val">{{ currency }} {{ formatCurrency(subtotalOtherFees) }}</span>
            </div>
            
            <div class="cost-summary-item discount-row" v-if="discountAmount > 0">
              <span class="label">{{ language === 'en' ? 'Discount' : 'Diskon' }}</span>
              <span class="val">- {{ currency }} {{ formatCurrency(discountAmount) }}</span>
            </div>
            
            <div class="cost-summary-item" v-if="taxAmount > 0">
              <span class="label">{{ language === 'en' ? 'Tax' : 'Pajak' }}</span>
              <span class="val">{{ currency }} {{ formatCurrency(taxAmount) }}</span>
            </div>

            <div class="cost-summary-item total-row">
              <span class="label">{{ language === 'en' ? 'Grand Total' : 'Total Pembayaran' }}</span>
              <span class="val highlight-total">{{ currency }} {{ formatCurrency(totalAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- Shares Section Header -->
        <div class="section-divider-title">
          <span>{{ language === 'en' ? 'Individual Payment Distribution' : 'Pembagian Pembayaran Per Anggota' }}</span>
        </div>

        <!-- Shares List -->
        <div class="shares-list-wrapper">
          <div 
            v-for="share in individualShares" 
            :key="share.id" 
            class="share-row-card neubrutal-box bg-white"
            :class="{ expanded: expandedFriends[share.id] }"
          >
            <!-- Share Main Row -->
            <div class="share-main-row" @click="toggleExpandFriend(share.id)">
              <div class="share-avatar-wrapper">
                <FriendAvatar :name="share.name" :avatar-bg="share.avatarBg" size="md" />
                <div class="share-name-details">
                  <span class="share-name">{{ share.name }}</span>
                  <span class="share-items-count">
                    {{ share.details.length }} {{ language === 'en' ? 'items allocated' : 'menu terpilih' }}
                  </span>
                </div>
              </div>

              <div class="share-amount-expand">
                <span class="share-total-amount">{{ currency }} {{ formatCurrency(share.finalTotal) }}</span>
                <button type="button" class="expand-arrow-btn">
                  <ChevronDown v-if="!expandedFriends[share.id]" :size="16" :stroke-width="3" />
                  <ChevronUp v-else :size="16" :stroke-width="3" />
                </button>
              </div>
            </div>

            <!-- Share Nested Details Drawer -->
            <div class="share-details-drawer" v-if="expandedFriends[share.id]">
              <div class="drawer-divider"></div>
              
              <div class="drawer-items-list">
                <div v-for="(item, idx) in share.details" :key="idx" class="drawer-item-row">
                  <div class="drawer-item-info">
                    <span class="drawer-item-name">{{ item.name }}</span>
                    <span class="drawer-item-portion">({{ item.portion }})</span>
                  </div>
                  <span class="drawer-item-cost">{{ currency }} {{ formatCurrency(item.cost) }}</span>
                </div>

                <!-- Proportional Adjustment Shares -->
                <div class="drawer-item-row adjustment-row" v-if="share.feeShare > 0">
                  <span class="drawer-item-name">{{ language === 'en' ? 'Proportional Fee Share' : 'Proporsi Biaya Tambahan' }}</span>
                  <span class="drawer-item-cost">+ {{ currency }} {{ formatCurrency(share.feeShare) }}</span>
                </div>
                
                <div class="drawer-item-row adjustment-row discount" v-if="share.discountShare > 0">
                  <span class="drawer-item-name">{{ language === 'en' ? 'Proportional Discount Share' : 'Proporsi Potongan Diskon' }}</span>
                  <span class="drawer-item-cost">- {{ currency }} {{ formatCurrency(share.discountShare) }}</span>
                </div>

                <div class="drawer-item-row adjustment-row" v-if="share.taxShare > 0">
                  <span class="drawer-item-name">{{ language === 'en' ? 'Proportional Tax Share' : 'Proporsi Pajak' }}</span>
                  <span class="drawer-item-cost">+ {{ currency }} {{ formatCurrency(share.taxShare) }}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>
    </main>

    <!-- Bottom Sticky Footer Actions -->
    <section class="footer-actions-bar neubrutal-box">
      <NeubrutalButton variant="ghost" custom-class="flex-1 return-btn" @click="goBackToEdit">
        {{ t('backToEditBtn') }}
      </NeubrutalButton>
      <NeubrutalButton variant="success" custom-class="flex-1 save-btn-final" @click="saveAndCommitSplit">
        <Check :size="18" :stroke-width="3" /> {{ language === 'en' ? 'Save' : 'Simpan' }}
      </NeubrutalButton>
    </section>

  </div>
</template>

<style scoped>
.app-main {
  padding: 0 24px 120px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bill-info-summary-card {
  padding: 20px;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bill-meta-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.category-icon-wrapper {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  border: 3px solid #111;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 2px 2px 0px #111;
}

.icon-bg-0 { background: var(--mint-green); }
.icon-bg-1 { background: var(--pastel-blue); }
.icon-bg-2 { background: var(--soft-yellow); }

.bill-title-desc {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}

.bill-preview-title {
  font-size: 1.2rem;
  font-weight: 850;
  color: #111;
}

.bill-preview-date {
  font-size: 0.75rem;
  color: #666;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.divider-line {
  height: 3px;
  background: #111;
  opacity: 0.15;
}

.cost-summary-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cost-summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #555;
}

.discount-row {
  color: #EF4444 !important;
}

.total-row {
  font-weight: 850;
  color: #111;
  font-size: 1rem;
  border-top: 2px dashed #ccc;
  padding-top: 10px;
  margin-top: 4px;
}

.highlight-total {
  font-size: 1.2rem;
  font-weight: 900;
}

/* Section divider header */
.section-divider-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 850;
  color: #111;
  margin-top: 10px;
  border-bottom: 2px solid #111;
  padding-bottom: 8px;
  text-align: left;
}

/* Shares Row Items */
.shares-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-row-card {
  padding: 16px;
  background: white;
  transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.share-row-card.expanded {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0px #111 !important;
}

.share-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.share-avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.share-name-details {
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: 2px;
}

.share-name {
  font-size: 0.95rem;
  font-weight: 850;
  color: #111;
}

.share-items-count {
  font-size: 0.7rem;
  color: #666;
  font-weight: 650;
}

.share-amount-expand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.share-total-amount {
  font-size: 1.05rem;
  font-weight: 900;
  color: #111;
}

.expand-arrow-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Expandable details drawer */
.share-details-drawer {
  display: flex;
  flex-direction: column;
  animation: slide-down 0.2s cubic-bezier(0.175, 0.885, 0.32, 1);
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.drawer-divider {
  height: 2px;
  border-bottom: 2px dashed #ccc;
  margin: 12px 0;
}

.drawer-items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drawer-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #4B5563;
}

.drawer-item-info {
  display: flex;
  gap: 6px;
  align-items: center;
}

.drawer-item-name {
  color: #111;
  font-weight: 750;
  text-align: left;
}

.drawer-item-portion {
  color: #666;
  font-size: 0.72rem;
}

.drawer-item-cost {
  font-weight: 800;
  color: #111;
}

.adjustment-row {
  color: #3B82F6 !important;
  font-size: 0.78rem;
}

.adjustment-row.discount {
  color: #EF4444 !important;
}

/* Neubrutalist Sticky Footer Actions */
.footer-actions-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 48px);
  max-width: calc(480px - 48px);
  padding: 14px;
  background: var(--soft-yellow);
  display: flex;
  gap: 12px;
  z-index: 100;
  border: 4px solid #111 !important;
  box-shadow: 6px 6px 0px #111 !important;
  border-radius: 20px !important;
}

:deep(.return-btn), :deep(.save-btn-final) {
  padding: 12px;
  font-size: 0.95rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 3px 3px 0px #111 !important;
}

:deep(.return-btn:active), :deep(.save-btn-final:active) {
  transform: translate(2px, 2px) !important;
  box-shadow: 1px 1px 0px #111 !important;
}

:deep(.save-btn-final) {
  background: #4ADE80 !important; /* Bold green */
  border-color: #111 !important;
}

@media (max-width: 480px) {
  .app-main {
    padding: 0 12px 130px !important;
  }
  .footer-actions-bar {
    width: calc(100% - 24px);
    max-width: calc(480px - 24px);
    bottom: 12px;
    padding: 10px;
  }
  :deep(.return-btn), :deep(.save-btn-final) {
    padding: 10px !important;
    font-size: 0.85rem !important;
  }
}
</style>
