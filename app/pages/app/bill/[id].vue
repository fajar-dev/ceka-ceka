<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Calendar, ShoppingBag, Coins, CreditCard, Check, Share2, Trash2, Users, ChevronDown, ChevronUp } from '@lucide/vue'
import { useCekaSettings } from '~/composables/useCekaSettings'
import { useCekaFriends } from '~/composables/useCekaFriends'

const { currency, t, language, loadSettings } = useCekaSettings()
const { getFriendDetails } = useCekaFriends()

const route = useRoute()
const router = useRouter()
const billId = ref<string>('')
const bill = ref<any>(null)
const payments = ref<any[]>([])
const stats = ref<any>({ totalCount: 0, paidCount: 0, progressPercent: 0 })
const isLoading = ref<boolean>(true)
const showDeleteConfirm = ref<boolean>(false)

const expandedFriends = ref<Record<string, boolean>>({})
const toggleExpandFriend = (id: string | number) => {
  expandedFriends.value[id] = !expandedFriends.value[id]
}

// Toast Alert State
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const triggerToast = (msg: string, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

const billSubtotal = ref(0)
const billFee = ref(0)
const billDiscount = ref(0)
const billTax = ref(0)

const loadBillDetails = async () => {
  try {
    isLoading.value = true
    const data = await $fetch<any>(`/api/bills/${billId.value}`)
    bill.value = data.bill
    
    // Enrich payments with proportional breakdown (same logic as preview.vue)
    const rawData = data.bill.rawData || {}
    const subtotalItems = rawData.subtotalItems || 0
    const subtotalOtherFees = rawData.subtotalOtherFees || 0
    
    billSubtotal.value = subtotalItems
    billFee.value = subtotalOtherFees
    
    // Recompute tax and discount amounts from raw data
    const discountAmount = rawData.discountType === 'percent' 
      ? Math.round((subtotalItems + subtotalOtherFees) * ((parseFloat(rawData.discountPercent) || 0) / 100))
      : (parseFloat(rawData.discountManual) || 0)
      
    const taxBase = Math.max(0, subtotalItems + subtotalOtherFees - discountAmount)
    const taxAmount = rawData.taxType === 'percent'
      ? Math.round(taxBase * ((parseFloat(rawData.taxPercent) || 0) / 100))
      : (parseFloat(rawData.taxManual) || 0)
      
    billDiscount.value = discountAmount
    billTax.value = taxAmount
    
    const enrichedPayments = (data.payments || []).map((p: any) => {
      let rawSubtotal = 0
      const friendDetails: any[] = []
      
      const friendList = rawData.selectedFriendIds || []
      
      if (rawData.items) {
        rawData.items.forEach((item: any) => {
          const assignments = item.assignments || {}
          const assignedIds = Object.keys(assignments).filter(k => parseFloat(assignments[k]) > 0)
          
          const sumPortions = assignedIds.reduce((sum, k) => sum + parseFloat(assignments[k]), 0)
          
          if (sumPortions === 0 && friendList.includes(p.friendId)) {
            const sharePrice = friendList.length > 0 ? (parseFloat(item.totalPrice) || 0) / friendList.length : 0
            rawSubtotal += sharePrice
            friendDetails.push({ name: item.name, portion: `1/${friendList.length}`, cost: sharePrice })
          } else {
            const portion = parseFloat(assignments[p.friendId] || 0)
            if (portion > 0) {
              const sharePrice = (portion / sumPortions) * (parseFloat(item.totalPrice) || 0)
              rawSubtotal += sharePrice
              friendDetails.push({ name: item.name, portion: `${portion} portion(s)`, cost: sharePrice })
            }
          }
        })
      }
      
      const ratio = subtotalItems > 0 ? (rawSubtotal / subtotalItems) : (friendList.length > 0 ? 1 / friendList.length : 0)
      const feeShare = friendList.length > 0 ? (subtotalOtherFees / friendList.length) : 0
      const taxShare = ratio * taxAmount
      const discountShare = ratio * discountAmount

      return {
        ...p,
        details: friendDetails,
        feeShare,
        taxShare,
        discountShare
      }
    })
    
    payments.value = enrichedPayments
    stats.value = data.stats || { totalCount: 0, paidCount: 0, progressPercent: 0 }
  } catch (e) {
    console.error('Failed to load bill details:', e)
    // If not found in API, check local storage fallback
    const saved = localStorage.getItem('ceka_history')
    if (saved) {
      const history = JSON.parse(saved)
      const found = history.find((h: any) => String(h.id) === String(billId.value))
      if (found) {
        bill.value = found
        payments.value = (found.shares || []).map((s: any) => ({
          id: `${found.id}_${s.friendId}`,
          friendId: s.friendId,
          name: s.name,
          amount: s.amount,
          isPaid: false,
          paidAt: null,
          details: [],
          feeShare: 0,
          taxShare: 0,
          discountShare: 0
        }))
        const total = payments.value.length
        stats.value = {
          totalCount: total,
          paidCount: 0,
          progressPercent: 0
        }
        isLoading.value = false
        return
      }
    }
    
    triggerToast(language.value === 'en' ? 'Failed to fetch bill details' : 'Gagal memuat rincian tagihan', 'error')
    router.push('/app')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadSettings()
  // Read dynamic path param /app/bill/:id
  const id = route.params.id as string
  if (!id) {
    router.push('/app')
    return
  }
  billId.value = id
  loadBillDetails()
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID').format(Math.round(val))
}

const getCategoryIcon = (cat: string) => {
  return cat === 'pizza' || cat === 'coffee' ? cat : 'file'
}

const getIconBg = (cat: string) => {
  if (cat === 'pizza') return 'icon-bg-1'
  if (cat === 'coffee') return 'icon-bg-2'
  return 'icon-bg-0'
}

// Toggle checklist status
const togglePaymentStatus = async (payment: any) => {
  const newStatus = !payment.isPaid
  
  // Optimistic UI update
  payment.isPaid = newStatus
  
  // Recalculate stats in real-time
  const total = payments.value.length
  const paid = payments.value.filter(p => p.isPaid).length
  stats.value = {
    totalCount: total,
    paidCount: paid,
    progressPercent: total > 0 ? Math.round((paid / total) * 100) : 0
  }

  try {
    await $fetch('/api/bills/toggle-payment', {
      method: 'POST',
      body: {
        paymentId: payment.id,
        isPaid: newStatus
      }
    })
    triggerToast(
      language.value === 'en' 
        ? `Marked ${payment.name} as ${newStatus ? 'Paid' : 'Unpaid'}`
        : `${payment.name} ditandai sebagai ${newStatus ? 'Lunas' : 'Belum Lunas'}`,
      'success'
    )
  } catch (e) {
    console.error('Failed to toggle payment status:', e)
    // Revert if error
    payment.isPaid = !newStatus
    const paidReverted = payments.value.filter(p => p.isPaid).length
    stats.value = {
      totalCount: total,
      paidCount: paidReverted,
      progressPercent: total > 0 ? Math.round((paidReverted / total) * 100) : 0
    }
    triggerToast(language.value === 'en' ? 'Connection error' : 'Gagal memperbarui status', 'error')
  }
}

// Delete Bill
const handleDeleteBill = async () => {
  try {
    await $fetch(`/api/bills/${billId.value}`, {
      method: 'DELETE'
    })
    showDeleteConfirm.value = false
    
    // Also remove from fallback localStorage history
    const saved = localStorage.getItem('ceka_history')
    if (saved) {
      const history = JSON.parse(saved)
      const filtered = history.filter((h: any) => h.id !== billId.value && String(h.id) !== String(billId.value))
      localStorage.setItem('ceka_history', JSON.stringify(filtered))
    }

    router.push('/app')
  } catch (e) {
    console.error('Failed to delete bill:', e)
    triggerToast(language.value === 'en' ? 'Failed to delete bill' : 'Gagal menghapus tagihan', 'error')
  }
}

// Copy sharing message text
const copySharingMessage = () => {
  if (!bill.value) return
  
  let msg = `*💸 CEKA-CEKA SPLIT BILL: ${bill.value.title.toUpperCase()}* \n`
  msg += `📅 Tanggal: ${bill.value.date}\n`
  msg += `💰 Total Tagihan: ${currency.value} ${formatCurrency(bill.value.amount)}\n\n`
  msg += `*Rincian Pembagian Patungan:* \n`
  
  payments.value.forEach(p => {
    msg += `- ${p.name}: ${currency.value} ${formatCurrency(p.amount)} [${p.isPaid ? '✅ Lunas' : '❌ Belum Bayar'}]\n`
  })
  
  msg += `\nYuk cek statusnya atau lakukan pembayaran! Terima kasih! 🙏✨`
  
  navigator.clipboard.writeText(msg)
  triggerToast(language.value === 'en' ? 'Share details copied!' : 'Pesan bagi-bagi berhasil disalin!', 'success')
}
</script>

<template>
  <div class="neubrutal-container">
    <AppHeader :title="t('detailBillTitle')" @back="router.push('/app')">
      <template #actions>
        <button class="delete-btn-action neubrutal-box" @click="showDeleteConfirm = true" title="Hapus Tagihan">
          <Trash2 :size="18" :stroke-width="3" />
        </button>
      </template>
    </AppHeader>

    <main class="app-main" v-if="!isLoading && bill">
      <section class="detail-content">
        
        <!-- Summary Header Card -->
        <div class="bill-summary-card neubrutal-box bg-white">
          <div class="bill-meta">
            <div class="category-icon-wrapper neubrutal-box" :class="getIconBg(bill.iconType || bill.category)">
              <ShoppingBag v-if="getCategoryIcon(bill.iconType || bill.category) === 'pizza'" :size="22" />
              <Coins v-else-if="getCategoryIcon(bill.iconType || bill.category) === 'coffee'" :size="22" />
              <CreditCard v-else :size="22" />
            </div>
            
            <div class="bill-details-wrapper">
              <h2 class="bill-title-text">{{ bill.title }}</h2>
              <span class="bill-date-text"><Calendar :size="12" /> {{ bill.date }}</span>
            </div>
          </div>

          <div class="divider-line"></div>

          <!-- Cost Breakdown List -->
          <div class="cost-summary-list">
            <div class="cost-summary-item">
              <span class="label">{{ t('itemsSubtotal') }}</span>
              <span class="val">{{ currency }} {{ formatCurrency(billSubtotal) }}</span>
            </div>
            
            <div class="cost-summary-item" v-if="billFee > 0">
              <span class="label">{{ t('additionalFees') }}</span>
              <span class="val">{{ currency }} {{ formatCurrency(billFee) }}</span>
            </div>
            
            <div class="cost-summary-item discount-row" v-if="billDiscount > 0">
              <span class="label">{{ t('discountLabel2') }}</span>
              <span class="val">- {{ currency }} {{ formatCurrency(billDiscount) }}</span>
            </div>
            
            <div class="cost-summary-item" v-if="billTax > 0">
              <span class="label">{{ t('taxLabel2') }}</span>
              <span class="val">{{ currency }} {{ formatCurrency(billTax) }}</span>
            </div>

            <div class="cost-summary-item total-row">
              <span class="label">{{ t('grandTotal') }}</span>
              <span class="val highlight-total">{{ currency }} {{ formatCurrency(bill.amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Neubrutalist Interactive Progress Bar -->
        <div class="progress-section-card neubrutal-box bg-white">
          <div class="progress-meta-info">
            <span class="progress-title-badge">
              <Users :size="14" :stroke-width="3" />
              {{ t('paymentStatus') }}
            </span>
            <span class="progress-fraction">
              {{ stats.paidCount }} / {{ stats.totalCount }} {{ t('paidLabel') }} ({{ stats.progressPercent }}%)
            </span>
          </div>

          <div class="neubrutal-progress-track">
            <div 
              class="neubrutal-progress-fill" 
              :style="{ width: `${stats.progressPercent}%` }"
            ></div>
          </div>
        </div>

        <!-- Checklist List Header -->
        <div class="section-divider-title">
          <span>{{ t('tapToToggle') }}</span>
        </div>

        <!-- Checklist Rows with Expandable Details -->
        <div class="shares-list-wrapper">
          <div 
            v-for="payment in payments" 
            :key="payment.id" 
            class="share-row-card neubrutal-box bg-white"
            :class="{ expanded: expandedFriends[payment.id], paid: payment.isPaid }"
          >
            <!-- Share Main Row -->
            <div class="share-main-row" @click="toggleExpandFriend(payment.id)">
              <div class="share-avatar-wrapper">
                <FriendAvatar :name="payment.name" :avatar-bg="getFriendDetails(payment.friendId)?.avatarBg || 'avatar-bg-0'" size="md" />
                <div class="share-name-details">
                  <span class="share-name" :class="{ strike: payment.isPaid }">{{ payment.name }}</span>
                  <span class="share-items-count" v-if="payment.details && payment.details.length > 0">
                    {{ payment.details.length }} {{ t('itemsAllocated') }}
                  </span>
                </div>
              </div>

              <div class="share-amount-expand">
                <span class="share-total-amount" :class="{ strike: payment.isPaid }">
                  {{ currency }} {{ formatCurrency(payment.amount) }}
                </span>
                
                <!-- Custom Checkbox (Stops propagation so it doesn't just toggle accordion) -->
                <div class="custom-checkbox-neubrutal" @click.stop="togglePaymentStatus(payment)">
                  <div class="checkbox-box" :class="{ checked: payment.isPaid }">
                    <Check v-if="payment.isPaid" :size="14" :stroke-width="4" class="check-icon-svg" />
                  </div>
                </div>

                <button type="button" class="expand-arrow-btn">
                  <ChevronDown v-if="!expandedFriends[payment.id]" :size="16" :stroke-width="3" />
                  <ChevronUp v-else :size="16" :stroke-width="3" />
                </button>
              </div>
            </div>

            <!-- Share Nested Details Drawer -->
            <div class="share-details-drawer" v-if="expandedFriends[payment.id]">
              <div class="drawer-divider"></div>
              
              <div class="drawer-items-list">
                <div v-for="(item, idx) in payment.details" :key="idx" class="drawer-item-row">
                  <div class="drawer-item-info">
                    <span class="drawer-item-name">{{ item.name }}</span>
                    <span class="drawer-item-portion">({{ item.portion }})</span>
                  </div>
                  <span class="drawer-item-cost">{{ currency }} {{ formatCurrency(item.cost) }}</span>
                </div>

                <!-- Proportional Adjustment Shares -->
                <div class="drawer-item-row adjustment-row" v-if="payment.feeShare > 0">
                  <span class="drawer-item-name">{{ t('propFeeShare') }}</span>
                  <span class="drawer-item-cost">+ {{ currency }} {{ formatCurrency(payment.feeShare) }}</span>
                </div>
                
                <div class="drawer-item-row adjustment-row discount" v-if="payment.discountShare > 0">
                  <span class="drawer-item-name">{{ t('propDiscountShare') }}</span>
                  <span class="drawer-item-cost">- {{ currency }} {{ formatCurrency(payment.discountShare) }}</span>
                </div>

                <div class="drawer-item-row adjustment-row" v-if="payment.taxShare > 0">
                  <span class="drawer-item-name">{{ t('propTaxShare') }}</span>
                  <span class="drawer-item-cost">+ {{ currency }} {{ formatCurrency(payment.taxShare) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>
    </main>

    <!-- Loading Skeleton -->
    <main class="app-main" v-else-if="isLoading">
      <div class="skeleton-loading-wrapper">
        <div class="skeleton-card neubrutal-box"></div>
        <div class="skeleton-card neubrutal-box" style="height: 100px;"></div>
        <div class="skeleton-card neubrutal-box" style="height: 300px;"></div>
      </div>
    </main>

    <!-- Sticky Share/Back Actions Footer -->
    <section class="footer-actions-bar neubrutal-box" v-if="!isLoading && bill">
      <NeubrutalButton variant="ghost" custom-class="flex-1 return-btn" @click="router.push('/app')">
        {{ t('homeBtnLabel') }}
      </NeubrutalButton>
      <NeubrutalButton variant="primary" custom-class="flex-1 save-btn-final share-gradient" @click="copySharingMessage">
        <Share2 :size="18" :stroke-width="3" /> {{ t('shareSplitBtn') }}
      </NeubrutalButton>
    </section>

    <!-- Delete Confirmation Modal -->
    <NeubrutalModal :show="showDeleteConfirm" accent="danger" @close="showDeleteConfirm = false">
      <div class="confirm-modal-body">
        <div class="confirm-icon-wrapper neubrutal-box">
          <Trash2 :size="32" :stroke-width="2.5" />
        </div>
        
        <h2 class="confirm-title">{{ t('deleteBillTitle') }}</h2>
        <p class="confirm-text">
          {{ t('deleteBillConfirm') }}
        </p>
        
        <div class="confirm-actions-row">
          <NeubrutalButton variant="ghost" custom-class="flex-1 confirm-btn-cancel" @click="showDeleteConfirm = false">
            {{ t('cancel') }}
          </NeubrutalButton>
          <NeubrutalButton variant="danger" custom-class="flex-1 confirm-btn-yes delete-btn-final" @click="handleDeleteBill">
            {{ t('deleteBtn') }}
          </NeubrutalButton>
        </div>
      </div>
    </NeubrutalModal>

    <!-- Neubrutalist Toast Notification -->
    <div class="neubrutal-toast neubrutal-box" :class="[toastType, { show: showToast }]">
      <div class="toast-content-wrapper">
        <div class="toast-status-bullet"></div>
        <span class="toast-text-msg">{{ toastMessage }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.delete-btn-action {
  width: 42px;
  height: 42px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 3px solid #111;
  border-radius: 12px;
  box-shadow: var(--shadow-hard-sm);
  cursor: pointer;
  background: #EF4444 !important;
  color: white !important;
  transition: transform 0.2s, box-shadow 0.2s;
}

.delete-btn-action:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px #111;
}

.app-main {
  padding: 0 24px 120px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bill-summary-card {
  padding: 20px;
  background: var(--box-bg);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bill-meta {
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

.bill-details-wrapper {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}

.bill-title-text {
  font-size: 1.25rem;
  font-weight: 850;
  color: var(--text-color);
}

.bill-date-text {
  font-size: 0.75rem;
  color: var(--text-color-muted);
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
  color: var(--text-color);
  font-size: 1rem;
  border-top: 2px dashed #ccc;
  padding-top: 10px;
  margin-top: 4px;
}

.highlight-total {
  font-size: 1.2rem;
  font-weight: 900;
}

/* Dynamic Progress Bar Section */
.progress-section-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-meta-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-title-badge {
  font-size: 0.8rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--pastel-blue);
  padding: 4px 8px;
  border-radius: 8px;
  border: 2px solid #111;
}

.progress-fraction {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text-color);
}

.neubrutal-progress-track {
  height: 24px;
  background: #E5E7EB;
  border: 2.5px solid #111;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: 2px 2px 0px #111;
}

.neubrutal-progress-fill {
  height: 100%;
  background: var(--mint-green);
  border-right: 2.5px solid #111;
  transition: width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Section divider header */
.section-divider-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 850;
  color: var(--text-color, #111);
  margin-top: 10px;
  border-bottom: 2px solid #111;
  padding-bottom: 8px;
  text-align: left;
}

/* Checklist Accordion Shares List */
.shares-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-row-card {
  padding: 16px;
  background: var(--box-bg);
  transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.share-row-card.paid {
  background: #ECFDF5 !important;
  border-color: #111;
  box-shadow: 2px 2px 0px #111 !important;
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
  color: var(--text-color);
}

.share-name.strike {
  text-decoration: line-through;
  color: #9CA3AF;
}

.share-items-count {
  font-size: 0.7rem;
  color: #666;
  font-weight: 650;
}

.share-amount-expand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.share-total-amount {
  font-size: 1rem;
  font-weight: 900;
  color: var(--text-color);
}

.share-total-amount.strike {
  text-decoration: line-through;
  color: #9CA3AF;
}

.expand-arrow-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Share Details Drawer */
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
  padding: 0 4px;
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
  color: var(--text-color);
  font-weight: 750;
  text-align: left;
}

.drawer-item-portion {
  color: #666;
  font-size: 0.72rem;
}

.drawer-item-cost {
  font-weight: 800;
  color: var(--text-color);
}

.adjustment-row {
  color: #3B82F6 !important;
  font-size: 0.78rem;
}

.adjustment-row.discount {
  color: #EF4444 !important;
}



/* Custom checkbox */
.custom-checkbox-neubrutal {
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-box {
  width: 24px;
  height: 24px;
  border: 2.5px solid #111;
  border-radius: 6px;
  background: var(--box-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 1.5px 1.5px 0px #111;
  transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.2);
}

.checkbox-box.checked {
  background: var(--mint-green);
  transform: scale(1.05);
}

.check-icon-svg {
  color: #111;
}

/* Footer Actions */
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
  background: var(--mint-green) !important;
  border-color: #111 !important;
  color: #111 !important;
}

/* Modal Body */
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
  color: #111;
  margin-bottom: 10px;
}

.confirm-text {
  font-size: 0.85rem;
  color: #4B5563;
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

:deep(.delete-btn-final) {
  background: #EF4444 !important;
  color: white !important;
  border: 3.5px solid #111 !important;
  box-shadow: 4px 4px 0px #111 !important;
  font-weight: 850 !important;
}

:deep(.delete-btn-final:active) {
  transform: translate(2px, 2px) !important;
  box-shadow: 2px 2px 0px #111 !important;
}

/* Skeleton Loading */
.skeleton-loading-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 20px;
}

.skeleton-card {
  height: 150px;
  background: var(--box-bg-alt);
  border: 2.5px solid #111;
  border-radius: 16px;
  box-shadow: 3px 3px 0px #111;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* Toast */
.neubrutal-toast {
  position: fixed;
  bottom: 110px;
  left: 50%;
  transform: translate(-50%, 50px);
  width: calc(100% - 48px);
  max-width: 360px;
  background: var(--box-bg);
  z-index: 1000;
  padding: 12px 16px;
  border: 3px solid #111 !important;
  box-shadow: 4px 4px 0px #111 !important;
  border-radius: 12px !important;
  display: flex;
  align-items: center;
  visibility: hidden;
  opacity: 0;
  transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s, visibility 0.2s;
}

.neubrutal-toast.show {
  visibility: visible;
  opacity: 1;
  transform: translate(-50%, 0);
}

.neubrutal-toast.error {
  background: #FEE2E2;
}

.neubrutal-toast.error .toast-status-bullet {
  background: #EF4444;
}

.toast-content-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toast-status-bullet {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--mint-green);
  border: 1.5px solid #111;
  flex-shrink: 0;
}

.toast-text-msg {
  font-size: 0.85rem;
  font-weight: 850;
  color: #111;
  text-align: left;
}

/* Dark mode overrides for bill detail page */
:global(.dark-theme) .bill-summary-card,
:global(.dark-theme) .progress-section-card,
:global(.dark-theme) .share-row-card {
  background-color: var(--box-bg) !important;
  color: var(--text-color) !important;
}

:global(.dark-theme) .bill-title-text,
:global(.dark-theme) .share-name,
:global(.dark-theme) .share-total-amount,
:global(.dark-theme) .progress-fraction,
:global(.dark-theme) .drawer-item-name,
:global(.dark-theme) .drawer-item-cost,
:global(.dark-theme) .highlight-total,
:global(.dark-theme) .total-row,
:global(.dark-theme) .confirm-title {
  color: var(--text-color) !important;
}

:global(.dark-theme) .cost-summary-item,
:global(.dark-theme) .bill-date-text,
:global(.dark-theme) .share-items-count,
:global(.dark-theme) .drawer-item-portion,
:global(.dark-theme) .confirm-text {
  color: var(--text-color-muted) !important;
}

:global(.dark-theme) .share-row-card.paid {
  background-color: #052e16 !important;
}

:global(.dark-theme) .expand-arrow-btn {
  color: var(--text-color) !important;
}

:global(.dark-theme) .checkbox-box {
  background-color: var(--box-bg) !important;
}

:global(.dark-theme) .checkbox-box.checked {
  background-color: var(--mint-green) !important;
}

:global(.dark-theme) .neubrutal-progress-track {
  background: var(--box-bg-alt) !important;
}

:global(.dark-theme) .neubrutal-toast {
  background-color: var(--box-bg) !important;
}

:global(.dark-theme) .neubrutal-toast.error {
  background-color: #450a0a !important;
}

:global(.dark-theme) .toast-text-msg {
  color: var(--text-color) !important;
}

:global(.dark-theme) .skeleton-card {
  background-color: var(--box-bg-alt) !important;
}

:global(.dark-theme) .section-divider-title {
  color: var(--text-color) !important;
  border-bottom-color: var(--border-color) !important;
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
