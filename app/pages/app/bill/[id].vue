<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Calendar, ShoppingBag, Coins, CreditCard, Check, Share2, Trash2, Users, ChevronDown, ChevronUp, Download, Link, RefreshCw, Copy } from '@lucide/vue'
import { useCekaSettings } from '~/composables/useCekaSettings'
import { useCekaFriends } from '~/composables/useCekaFriends'
import { useCekaAuth } from '~/composables/useCekaAuth'

const { currency, t, language, loadSettings } = useCekaSettings()
const { getFriendDetails } = useCekaFriends()
const { user } = useCekaAuth()

const route = useRoute()
const router = useRouter()
const billId = ref<string>('')
const bill = ref<any>(null)
const payments = ref<any[]>([])
const stats = ref<any>({ totalCount: 0, paidCount: 0, progressPercent: 0 })
const isLoading = ref<boolean>(true)
const showDeleteConfirm = ref<boolean>(false)
const showShareModal = ref<boolean>(false)
const shareEnabled = ref<boolean>(false)
const shareCode = ref<string | null>(null)
const isTogglingShare = ref(false)
const isResettingCode = ref(false)

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

// Share link functions
const getShareUrl = () => {
  if (!shareCode.value) return ''
  const origin = process.client ? window.location.origin : ''
  return `${origin}/share/${shareCode.value}`
}

const openShareModal = () => {
  shareEnabled.value = !!bill.value?.shareCode
  shareCode.value = bill.value?.shareCode || null
  showShareModal.value = true
}

const toggleShare = async () => {
  if (isTogglingShare.value) return
  isTogglingShare.value = true
  try {
    const newState = !shareEnabled.value
    const data = await $fetch<{ shareCode: string | null }>('/api/bills/share', {
      method: 'POST',
      body: { billId: billId.value, enabled: newState }
    })
    shareEnabled.value = newState
    shareCode.value = data.shareCode
    if (bill.value) bill.value.shareCode = data.shareCode
    triggerToast(
      newState
        ? (language.value === 'en' ? 'Sharing enabled!' : 'Link aktif!')
        : (language.value === 'en' ? 'Sharing disabled' : 'Link dinonaktifkan'),
      'success'
    )
  } catch (e) {
    console.error('Toggle share failed:', e)
    triggerToast(language.value === 'en' ? 'Failed to toggle sharing' : 'Gagal mengubah sharing', 'error')
  } finally {
    isTogglingShare.value = false
  }
}

const resetShareCode = async () => {
  if (isResettingCode.value) return
  isResettingCode.value = true
  try {
    const data = await $fetch<{ shareCode: string }>('/api/bills/reset-share', {
      method: 'POST',
      body: { billId: billId.value }
    })
    shareCode.value = data.shareCode
    if (bill.value) bill.value.shareCode = data.shareCode
    triggerToast(language.value === 'en' ? 'Link reset!' : 'Link telah direset!', 'success')
  } catch (e) {
    console.error('Reset share code failed:', e)
    triggerToast(language.value === 'en' ? 'Failed to reset link' : 'Gagal mereset link', 'error')
  } finally {
    isResettingCode.value = false
  }
}

const copyShareLink = () => {
  const url = getShareUrl()
  if (url) {
    navigator.clipboard.writeText(url)
    triggerToast(language.value === 'en' ? 'Link copied!' : 'Link disalin!', 'success')
  }
}

// Download bill as PNG
const detailContentRef = ref<HTMLElement | null>(null)
const isDownloading = ref(false)

const downloadBillAsPng = async () => {
  if (!detailContentRef.value || isDownloading.value) return
  isDownloading.value = true

  try {
    const html2canvas = (await import('html2canvas-pro')).default

    // Detect dark mode
    const isDark = document.documentElement.classList.contains('dark-theme')
    const bgColor = isDark ? '#121214' : '#F8F6F2'
    const textColor = isDark ? '#E5E7EB' : '#111111'

    // Create a styled wrapper for better PNG output
    const wrapper = document.createElement('div')
    wrapper.style.cssText = `
      position: fixed;
      top: -99999px;
      left: -99999px;
      width: ${detailContentRef.value.offsetWidth + 48}px;
      padding: 24px;
      background: ${bgColor};
      border-radius: 0;
      z-index: -1;
    `

    // Clone the content
    const clone = detailContentRef.value.cloneNode(true) as HTMLElement
    clone.style.margin = '0'
    clone.style.padding = '0'

    // Replace "Kamu" with the actual user name in the clone
    const userName = user.value?.name || 'Kamu'
    if (userName !== 'Kamu') {
      const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT)
      let node: Text | null
      while ((node = walker.nextNode() as Text | null)) {
        if (node.textContent && node.textContent.trim() === 'Kamu') {
          node.textContent = node.textContent.replace('Kamu', userName)
        }
      }
    }

    wrapper.appendChild(clone)

    // Add watermark footer
    const watermark = document.createElement('div')
    watermark.style.cssText = `
      text-align: center;
      padding: 16px 0 4px;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: ${isDark ? '#555' : '#aaa'};
      letter-spacing: 1px;
    `
    watermark.textContent = 'CekaCeka • Split Bill App'
    wrapper.appendChild(watermark)

    document.body.appendChild(wrapper)

    // Wait for styles to apply
    await new Promise(resolve => setTimeout(resolve, 100))

    const canvas = await html2canvas(wrapper, {
      backgroundColor: bgColor,
      scale: 2,
      useCORS: true,
      logging: false
    })

    // Clean up
    document.body.removeChild(wrapper)

    const link = document.createElement('a')
    const fileName = bill.value?.title
      ? `${bill.value.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`
      : 'bill.png'
    link.download = fileName
    link.href = canvas.toDataURL('image/png')
    link.click()

    triggerToast(language.value === 'en' ? 'Bill downloaded!' : 'Tagihan berhasil diunduh!', 'success')
  } catch (e) {
    console.error('Failed to download bill:', e)
    triggerToast(language.value === 'en' ? 'Download failed' : 'Gagal mengunduh', 'error')
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <div class="neubrutal-container">
    <AppHeader :title="t('detailBillTitle')" @back="router.back()">
      <template #actions>
        <button class="delete-btn-action neubrutal-box" @click="showDeleteConfirm = true" title="Hapus Tagihan">
          <Trash2 :size="18" :stroke-width="3" />
        </button>
      </template>
    </AppHeader>

    <main class="app-main" v-if="!isLoading && bill">
      <section class="detail-content" ref="detailContentRef">
        
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
            class="share-row-card neubrutal-box"
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
      <section class="detail-content">
        <!-- Summary Header Card Skeleton -->
        <div class="bill-summary-card neubrutal-box bg-white skeleton" style="min-height: 220px; border-color: transparent !important; margin-bottom: 20px;">
          <!-- Shimmer pulse summary card -->
        </div>

        <!-- Progress Card Skeleton -->
        <div class="progress-section-card neubrutal-box bg-white skeleton" style="min-height: 90px; border-color: transparent !important; margin-bottom: 20px;">
          <!-- Shimmer pulse progress card -->
        </div>

        <!-- Portions / Checklist Skeletons -->
        <div class="shares-list-wrapper">
          <div v-for="n in 3" :key="n" class="share-row-card neubrutal-box skeleton" style="min-height: 80px; margin-bottom: 12px; border-color: transparent !important;">
            <!-- Shimmer pulse portion item -->
          </div>
        </div>
      </section>
    </main>

    <!-- Sticky Share/Back Actions Footer -->
    <section class="footer-actions-bar neubrutal-box" v-if="!isLoading && bill">
      <NeubrutalButton variant="ghost" custom-class="flex-1 return-btn" @click="downloadBillAsPng" :disabled="isDownloading">
        <Download :size="18" :stroke-width="3" /> {{ isDownloading ? '...' : (language === 'en' ? 'Download' : 'Unduh') }}
      </NeubrutalButton>
      <NeubrutalButton variant="primary" custom-class="flex-1 save-btn-final share-gradient" @click="openShareModal">
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

    <!-- Share Modal -->
    <NeubrutalModal :show="showShareModal" accent="primary" @close="showShareModal = false">
      <div class="share-modal-body">
        <div class="share-modal-icon neubrutal-box">
          <Share2 :size="28" :stroke-width="2.5" />
        </div>

        <h2 class="confirm-title">{{ language === 'en' ? 'Share Bill' : 'Bagikan Tagihan' }}</h2>
        <p class="confirm-text">
          {{ language === 'en' ? 'Anyone with the link can view this bill without login' : 'Siapa saja dengan link bisa melihat tagihan ini tanpa login' }}
        </p>

        <!-- Toggle Row -->
        <div class="share-toggle-row">
          <div class="share-toggle-info">
            <span class="share-toggle-label">{{ language === 'en' ? 'Enable sharing' : 'Aktifkan link' }}</span>
            <span class="share-toggle-status" :class="{ active: shareEnabled }">
              {{ shareEnabled ? (language === 'en' ? 'Active' : 'Aktif') : (language === 'en' ? 'Off' : 'Nonaktif') }}
            </span>
          </div>
          <button
            class="neubrutal-toggle"
            :class="{ active: shareEnabled, loading: isTogglingShare }"
            @click="toggleShare"
            :disabled="isTogglingShare"
          >
            <div class="toggle-knob"></div>
          </button>
        </div>

        <!-- Share Link Section -->
        <transition name="fade-slide">
          <div class="share-link-section" v-if="shareEnabled && shareCode">
            <div class="share-link-label">
              <Link :size="12" :stroke-width="3" />
              {{ language === 'en' ? 'Share link' : 'Link berbagi' }}
            </div>
            <div class="share-link-box neubrutal-box">
              <span class="share-link-text">{{ getShareUrl() }}</span>
            </div>

            <div class="share-link-actions">
              <NeubrutalButton variant="primary" custom-class="share-copy-btn" @click="copyShareLink">
                <Copy :size="15" :stroke-width="3" /> {{ language === 'en' ? 'Copy Link' : 'Salin Link' }}
              </NeubrutalButton>
              <button
                class="share-reset-btn neubrutal-box"
                @click="resetShareCode"
                :disabled="isResettingCode"
                :title="language === 'en' ? 'Reset link' : 'Reset link'"
              >
                <RefreshCw :size="15" :stroke-width="3" :class="{ spinning: isResettingCode }" />
              </button>
            </div>

            <p class="share-reset-hint">
              {{ language === 'en' ? 'Reset to invalidate the old link and generate a new one' : 'Reset untuk menonaktifkan link lama dan membuat link baru' }}
            </p>
          </div>
        </transition>

        <!-- Disabled state hint -->
        <div class="share-disabled-hint" v-if="!shareEnabled">
          <span>{{ language === 'en' ? 'Enable sharing to get a shareable link' : 'Aktifkan untuk mendapatkan link berbagi' }}</span>
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
  background-color: #F0FDF4;
  border-color: #16A34A;
  box-shadow: 2px 2px 0px #16A34A !important;
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
  cursor: pointer;
}

.checkbox-box {
  width: 26px;
  height: 26px;
  border: 2.5px solid #111;
  border-radius: 7px;
  background: var(--box-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 1.5px 1.5px 0px #111;
  transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.2);
}

.checkbox-box:hover {
  transform: scale(1.08);
}

.checkbox-box.checked {
  background: #059669;
  border-color: #059669;
  box-shadow: 1.5px 1.5px 0px #047857;
  transform: scale(1.05);
}

.check-icon-svg {
  color: #fff;
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
  top: 24px;
  left: 50%;
  transform: translate(-50%, -50px);
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
  color: var(--text-color);
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
  background: #1a2e1a !important;
  border-color: #16A34A !important;
  box-shadow: 2px 2px 0px #16A34A !important;
}

:global(.dark-theme) .share-row-card.paid .share-name {
  color: var(--text-color) !important;
}

:global(.dark-theme) .share-row-card.paid .share-total-amount {
  color: var(--text-color) !important;
}

:global(.dark-theme) .share-row-card.paid .share-name.strike {
  color: #6B7280 !important;
}

:global(.dark-theme) .share-row-card.paid .share-total-amount.strike {
  color: #6B7280 !important;
}

:global(.dark-theme) .share-row-card.paid .share-items-count {
  color: #9CA3AF !important;
}

:global(.dark-theme) .share-row-card.paid .drawer-item-name,
:global(.dark-theme) .share-row-card.paid .drawer-item-cost,
:global(.dark-theme) .share-row-card.paid .drawer-item-portion {
  color: #D1D5DB !important;
}

:global(.dark-theme) .share-row-card.paid .drawer-divider {
  border-bottom-color: #374151 !important;
}


:global(.dark-theme) .expand-arrow-btn {
  color: var(--text-color) !important;
}

:global(.dark-theme) .checkbox-box {
  background-color: var(--box-bg) !important;
  border-color: var(--border-color) !important;
  box-shadow: 1.5px 1.5px 0px var(--border-color) !important;
}

:global(.dark-theme) .checkbox-box.checked {
  background-color: #059669 !important;
  border-color: #059669 !important;
  box-shadow: 1.5px 1.5px 0px #047857 !important;
}

:global(.dark-theme) .drawer-divider {
  border-bottom-color: var(--border-color) !important;
}

:global(.dark-theme) .neubrutal-progress-track {
  background: var(--box-bg-alt) !important;
}

:global(.dark-theme) .neubrutal-toast {
  background-color: var(--box-bg) !important;
  border-color: var(--border-color) !important;
  box-shadow: 4px 4px 0px var(--border-color) !important;
}

:global(.dark-theme) .neubrutal-toast.error {
  background-color: #450a0a !important;
}

:global(.dark-theme) .neubrutal-toast.error .toast-text-msg {
  color: #FCA5A5 !important;
}

:global(.dark-theme) .toast-text-msg {
  color: var(--text-color) !important;
}

:global(.dark-theme) .toast-status-bullet {
  border-color: var(--border-color) !important;
}

:global(.dark-theme) .skeleton-card {
  background-color: var(--box-bg-alt) !important;
}

:global(.dark-theme) .section-divider-title {
  color: var(--text-color) !important;
  border-bottom-color: var(--border-color) !important;
}

/* ===== Share Modal ===== */
.share-modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 6px 4px 4px;
}

.share-modal-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--pastel-blue);
  color: #111;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
  border: 3px solid #111;
  box-shadow: 3px 3px 0px #111;
}

.share-modal-body .confirm-title {
  margin-bottom: 6px;
}

.share-modal-body .confirm-text {
  margin-bottom: 20px;
}

.share-toggle-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-color);
  border: 2.5px solid #111;
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: 2px 2px 0px #111;
  margin-bottom: 16px;
}

.share-toggle-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}

.share-toggle-label {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-color);
}

.share-toggle-status {
  font-size: 0.72rem;
  font-weight: 700;
  color: #9CA3AF;
}

.share-toggle-status.active {
  color: #059669;
}

/* Neubrutalist Toggle Switch */
.neubrutal-toggle {
  width: 50px;
  height: 28px;
  border-radius: 14px;
  border: 2.5px solid #111;
  background: #E5E7EB;
  box-shadow: 2px 2px 0px #111;
  cursor: pointer;
  position: relative;
  transition: background 0.2s, box-shadow 0.15s;
  flex-shrink: 0;
}

.neubrutal-toggle.active {
  background: var(--mint-green);
  box-shadow: 2px 2px 0px #111;
}

.neubrutal-toggle:disabled,
.neubrutal-toggle.loading {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-knob {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #111;
  position: absolute;
  top: 50%;
  left: 3px;
  transform: translateY(-50%);
  transition: left 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.neubrutal-toggle.active .toggle-knob {
  left: 25px;
}

/* Share Link */
.share-link-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-link-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-color-muted);
  display: flex;
  align-items: center;
  gap: 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.share-link-box {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-color);
  border: 2.5px solid #111 !important;
  border-radius: 10px !important;
  box-shadow: 2px 2px 0px #111 !important;
  overflow: hidden;
}

.share-link-text {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-color);
  word-break: break-all;
  display: block;
  font-family: monospace;
  line-height: 1.5;
}

.share-link-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

:deep(.share-copy-btn) {
  flex: 1;
  padding: 11px !important;
  font-size: 0.9rem !important;
  font-weight: 850 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  box-shadow: 3px 3px 0px #111 !important;
}

:deep(.share-copy-btn:active) {
  transform: translate(2px, 2px) !important;
  box-shadow: 1px 1px 0px #111 !important;
}

.share-reset-btn {
  width: 44px;
  height: 44px;
  border: 2.5px solid #111 !important;
  border-radius: 12px !important;
  box-shadow: 3px 3px 0px #111 !important;
  background: var(--box-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-color);
  flex-shrink: 0;
  transition: transform 0.15s, box-shadow 0.15s;
}

.share-reset-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0px #111 !important;
}

.share-reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.share-reset-hint {
  font-size: 0.7rem;
  color: var(--text-color-muted);
  font-weight: 650;
  text-align: center;
  line-height: 1.5;
  padding: 0 4px;
}

.share-disabled-hint {
  width: 100%;
  text-align: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-color-muted);
  background: var(--bg-color);
  border: 2px dashed #ccc;
  border-radius: 10px;
  padding: 12px;
}

/* Spinning animation */
.spinning {
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Fade slide transition for link section */
.fade-slide-enter-active {
  animation: fadeSlideIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1);
}

.fade-slide-leave-active {
  animation: fadeSlideIn 0.18s reverse ease-in;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Dark mode for share modal */
:global(.dark-theme) .share-toggle-row {
  background: var(--box-bg-alt) !important;
  border-color: var(--border-color) !important;
  box-shadow: 2px 2px 0px var(--border-color) !important;
}

:global(.dark-theme) .neubrutal-toggle {
  background: #374151;
  border-color: var(--border-color) !important;
  box-shadow: 2px 2px 0px var(--border-color) !important;
}

:global(.dark-theme) .neubrutal-toggle.active {
  background: var(--mint-green);
}

:global(.dark-theme) .toggle-knob {
  background: #E5E7EB;
  border-color: var(--border-color) !important;
}

:global(.dark-theme) .share-link-box {
  background: var(--box-bg-alt) !important;
  border-color: var(--border-color) !important;
  box-shadow: 2px 2px 0px var(--border-color) !important;
}

:global(.dark-theme) .share-reset-btn {
  background: var(--box-bg) !important;
  border-color: var(--border-color) !important;
  box-shadow: 3px 3px 0px var(--border-color) !important;
}

:global(.dark-theme) .share-disabled-hint {
  border-color: var(--border-color) !important;
  background: var(--box-bg-alt) !important;
}

:global(.dark-theme) .share-modal-icon {
  border-color: var(--border-color) !important;
  box-shadow: 3px 3px 0px var(--border-color) !important;
}

/* ===== End Share Modal ===== */

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
