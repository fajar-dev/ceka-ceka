<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Calendar, ShoppingBag, Coins, CreditCard, Check, Users, ChevronDown, ChevronUp, ArrowLeft } from '@lucide/vue'
import { useCekaSettings } from '~/composables/useCekaSettings'

definePageMeta({ layout: false })

const { currency, loadSettings, t, language, theme } = useCekaSettings()

const route = useRoute()
const shareCode = route.params.code as string

const bill = ref<any>(null)
const payments = ref<any[]>([])
const stats = ref<any>({ totalCount: 0, paidCount: 0, progressPercent: 0 })
const isLoading = ref(true)
const isNotFound = ref(false)

const expandedFriends = ref<Record<string, boolean>>({})
const toggleExpandFriend = (id: string | number) => {
  expandedFriends.value[id] = !expandedFriends.value[id]
}

const billSubtotal = ref(0)
const billFee = ref(0)
const billDiscount = ref(0)
const billTax = ref(0)

const loadSharedBill = async () => {
  try {
    isLoading.value = true
    const data = await $fetch<any>(`/api/share/${shareCode}`)
    bill.value = data.bill

    const rawData = data.bill.rawData || {}
    const subtotalItems = rawData.subtotalItems || 0
    const subtotalOtherFees = rawData.subtotalOtherFees || 0

    billSubtotal.value = subtotalItems
    billFee.value = subtotalOtherFees

    const discountAmount = rawData.discountType === 'percent'
      ? Math.round((subtotalItems + subtotalOtherFees) * ((parseFloat(rawData.discountPercent) || 0) / 100))
      : (parseFloat(rawData.discountManual) || 0)

    const taxBase = Math.max(0, subtotalItems + subtotalOtherFees - discountAmount)
    const taxAmount = rawData.taxType === 'percent'
      ? Math.round(taxBase * ((parseFloat(rawData.taxPercent) || 0) / 100))
      : (parseFloat(rawData.taxManual) || 0)

    billDiscount.value = discountAmount
    billTax.value = taxAmount

    const friendList = rawData.selectedFriendIds || []

    const enrichedPayments = (data.payments || []).map((p: any) => {
      let rawSubtotal = 0
      const friendDetails: any[] = []

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

      const displayName = p.name === 'Kamu' ? data.bill.ownerName : p.name

      return { ...p, name: displayName, details: friendDetails, feeShare, taxShare, discountShare }
    })

    payments.value = enrichedPayments
    stats.value = data.stats || { totalCount: 0, paidCount: 0, progressPercent: 0 }
  } catch (e: any) {
    if (e?.statusCode === 404) {
      isNotFound.value = true
    }
    console.error('Failed to load shared bill:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadSettings()
  loadSharedBill()
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
</script>

<template>
  <div class="share-page">
    <!-- Loading -->
    <main class="share-main" v-if="isLoading">
      <header class="app-header" style="display: flex; justify-content: center; margin-bottom: 20px;">
        <div class="logo-wrapper">
          <img :src="theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'" alt="CekaCeka" class="app-logo" />
        </div>
      </header>

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

    <!-- Not Found -->
    <main class="share-main" v-else-if="isNotFound">
      <div class="notfound-wrapper neubrutal-box">
        <h2 class="notfound-title">Link Tidak Valid</h2>
        <p class="notfound-text">Tagihan ini tidak ditemukan atau link sudah tidak aktif.</p>
        <NeubrutalButton variant="primary" @click="navigateTo('/')">
          <ArrowLeft :size="18" :stroke-width="3" /> {{ t('backToHome') }}
        </NeubrutalButton>
      </div>
    </main>

    <!-- Bill Content -->
    <main class="share-main" v-else-if="bill">
      <header class="app-header" style="display: flex; justify-content: center; margin-bottom: 20px;">
        <div class="logo-wrapper">
          <img :src="theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'" alt="CekaCeka" class="app-logo" />
        </div>
      </header>

      <section class="detail-content">
        <!-- Summary Card -->
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

          <div class="cost-summary-list">
            <div class="cost-summary-item">
              <span class="label">Subtotal Item</span>
              <span class="val">{{ currency }} {{ formatCurrency(billSubtotal) }}</span>
            </div>
            <div class="cost-summary-item" v-if="billFee > 0">
              <span class="label">Biaya Tambahan</span>
              <span class="val">{{ currency }} {{ formatCurrency(billFee) }}</span>
            </div>
            <div class="cost-summary-item discount-row" v-if="billDiscount > 0">
              <span class="label">Diskon</span>
              <span class="val">- {{ currency }} {{ formatCurrency(billDiscount) }}</span>
            </div>
            <div class="cost-summary-item" v-if="billTax > 0">
              <span class="label">Pajak</span>
              <span class="val">{{ currency }} {{ formatCurrency(billTax) }}</span>
            </div>
            <div class="cost-summary-item total-row">
              <span class="label">Total</span>
              <span class="val highlight-total">{{ currency }} {{ formatCurrency(bill.amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Progress -->
        <div class="progress-section-card neubrutal-box bg-white">
          <div class="progress-meta-info">
            <span class="progress-title-badge">
              <Users :size="14" :stroke-width="3" />
              Status Pembayaran
            </span>
            <span class="progress-fraction">
              {{ stats.paidCount }} / {{ stats.totalCount }} Lunas ({{ stats.progressPercent }}%)
            </span>
          </div>
          <div class="neubrutal-progress-track">
            <div class="neubrutal-progress-fill" :style="{ width: `${stats.progressPercent}%` }"></div>
          </div>
        </div>

        <!-- Section Title -->
        <div class="section-divider-title">
          <span>Rincian Tagihan</span>
        </div>

        <!-- Payment Rows -->
        <div class="shares-list-wrapper">
          <div
            v-for="payment in payments"
            :key="payment.id"
            class="share-row-card neubrutal-box"
            :class="{ expanded: expandedFriends[payment.id], paid: payment.isPaid }"
          >
            <div class="share-main-row" @click="toggleExpandFriend(payment.id)">
              <div class="share-avatar-wrapper">
                <div class="share-avatar-circle">{{ payment.name?.charAt(0)?.toUpperCase() }}</div>
                <div class="share-name-details">
                  <span class="share-name" :class="{ strike: payment.isPaid }">{{ payment.name }}</span>
                  <span class="share-items-count" v-if="payment.details && payment.details.length > 0">
                    {{ payment.details.length }} item
                  </span>
                </div>
              </div>

              <div class="share-amount-expand">
                <div class="paid-badge" v-if="payment.isPaid">
                  <Check :size="12" :stroke-width="3" /> Lunas
                </div>
                <span class="share-total-amount" :class="{ strike: payment.isPaid }">
                  {{ currency }} {{ formatCurrency(payment.amount) }}
                </span>
                <button type="button" class="expand-arrow-btn">
                  <ChevronDown v-if="!expandedFriends[payment.id]" :size="16" :stroke-width="3" />
                  <ChevronUp v-else :size="16" :stroke-width="3" />
                </button>
              </div>
            </div>

            <!-- Drawer -->
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
                <div class="drawer-item-row adjustment-row" v-if="payment.feeShare > 0">
                  <span class="drawer-item-name">Biaya Tambahan</span>
                  <span class="drawer-item-cost">+ {{ currency }} {{ formatCurrency(payment.feeShare) }}</span>
                </div>
                <div class="drawer-item-row adjustment-row discount" v-if="payment.discountShare > 0">
                  <span class="drawer-item-name">Diskon</span>
                  <span class="drawer-item-cost">- {{ currency }} {{ formatCurrency(payment.discountShare) }}</span>
                </div>
                <div class="drawer-item-row adjustment-row" v-if="payment.taxShare > 0">
                  <span class="drawer-item-name">Pajak</span>
                  <span class="drawer-item-cost">+ {{ currency }} {{ formatCurrency(payment.taxShare) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <!-- Footer Watermark -->
      <div class="share-footer">
        <span>Dibuat dengan <strong>CekaCeka</strong> · Split Bill App</span>
      </div>
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.share-page {
  min-height: 100dvh;
  background: var(--bg-color, #F8F6F2);
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Header */
.share-header {
  width: 100%;
  background: var(--soft-yellow, #FEF08A);
  border-bottom: 3px solid #111 !important;
  border-top: none !important;
  border-left: none !important;
  border-right: none !important;
  box-shadow: 0 3px 0px #111 !important;
  padding: 14px 24px;
  display: flex;
  justify-content: center;
}

.share-header-inner {
  display: flex;
  align-items: baseline;
  gap: 8px;
  max-width: 480px;
  width: 100%;
}

.brand-logo {
  font-size: 1.25rem;
  font-weight: 900;
  color: #111;
  letter-spacing: -0.5px;
}

.brand-tagline {
  font-size: 0.75rem;
  font-weight: 700;
  color: #555;
  background: #fff;
  border: 2px solid #111;
  border-radius: 6px;
  padding: 1px 6px;
}

/* Main */
.share-main {
  width: 100%;
  max-width: 480px;
  padding: 20px 24px 60px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.share-owner-badge {
  margin-bottom: 16px;
  padding: 10px 14px;
  background: var(--pastel-blue, #BFDBFE);
  border: 2.5px solid #111;
  border-radius: 12px;
  box-shadow: 2px 2px 0px #111;
  font-size: 0.8rem;
  font-weight: 700;
  color: #111;
  text-align: center;
}

/* Detail Content */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bill-summary-card {
  padding: 20px;
  background: var(--box-bg, #fff);
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 3px solid #111;
  border-radius: 16px;
  box-shadow: 4px 4px 0px #111;
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
  flex-shrink: 0;
}

.icon-bg-0 { background: var(--mint-green, #6EE7B7); }
.icon-bg-1 { background: var(--pastel-blue, #BFDBFE); }
.icon-bg-2 { background: var(--soft-yellow, #FEF08A); }

.bill-details-wrapper {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}

.bill-title-text {
  font-size: 1.2rem;
  font-weight: 850;
  color: var(--text-color, #111);
}

.bill-date-text {
  font-size: 0.75rem;
  color: var(--text-color-muted, #666);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.divider-line {
  height: 2px;
  background: #111;
  opacity: 0.12;
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

.discount-row { color: #EF4444 !important; }

.total-row {
  font-weight: 850;
  color: var(--text-color, #111);
  font-size: 1rem;
  border-top: 2px dashed #ccc;
  padding-top: 10px;
  margin-top: 4px;
}

.highlight-total {
  font-size: 1.2rem;
  font-weight: 900;
}

/* Progress */
.progress-section-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 3px solid #111;
  border-radius: 16px;
  box-shadow: 4px 4px 0px #111;
  background: var(--box-bg, #fff);
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
  background: var(--pastel-blue, #BFDBFE);
  padding: 4px 8px;
  border-radius: 8px;
  border: 2px solid #111;
}

.progress-fraction {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text-color, #111);
}

.neubrutal-progress-track {
  height: 24px;
  background: #E5E7EB;
  border: 2.5px solid #111;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 2px 2px 0px #111;
}

.neubrutal-progress-fill {
  height: 100%;
  background: var(--mint-green, #6EE7B7);
  border-right: 2.5px solid #111;
  transition: width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Section divider */
.section-divider-title {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 850;
  color: var(--text-color, #111);
  margin-top: 10px;
  border-bottom: 2px solid #111;
  padding-bottom: 8px;
}

/* Shares List */
.shares-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-row-card {
  padding: 16px;
  background: var(--box-bg, #fff);
  border: 3px solid #111;
  border-radius: 16px;
  box-shadow: 4px 4px 0px #111;
  transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.share-row-card.paid {
  background-color: #F0FDF4;
  border-color: #16A34A;
  box-shadow: 2px 2px 0px #16A34A !important;
}

.share-row-card.expanded {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0px #111 !important;
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

.share-avatar-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2.5px solid #111;
  background: var(--mint-green, #6EE7B7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 900;
  color: #111;
  box-shadow: 2px 2px 0px #111;
  flex-shrink: 0;
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
  color: var(--text-color, #111);
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
  gap: 10px;
}

.paid-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 800;
  background: #DCFCE7;
  color: #16A34A;
  border: 2px solid #16A34A;
  border-radius: 6px;
  padding: 2px 7px;
}

.share-total-amount {
  font-size: 1rem;
  font-weight: 900;
  color: var(--text-color, #111);
  white-space: nowrap;
}

.share-total-amount.strike {
  text-decoration: line-through;
  color: #9CA3AF;
}

.expand-arrow-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color, #111);
  display: flex;
  align-items: center;
}

/* Drawer */
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
  color: var(--text-color, #111);
  font-weight: 750;
  text-align: left;
}

.drawer-item-portion {
  color: #666;
  font-size: 0.72rem;
}

.drawer-item-cost {
  font-weight: 800;
  color: var(--text-color, #111);
}

.adjustment-row {
  color: #3B82F6 !important;
  font-size: 0.78rem;
}

.adjustment-row.discount {
  color: #EF4444 !important;
}

/* Not Found */
.notfound-wrapper {
  margin-top: 60px;
  padding: 40px 24px;
  border: 3px solid #111;
  border-radius: 20px;
  box-shadow: 4px 4px 0px #111;
  background: var(--box-bg, #fff);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.notfound-emoji {
  font-size: 3rem;
}

.notfound-title {
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--text-color, #111);
}

.notfound-text {
  font-size: 0.85rem;
  color: #666;
  font-weight: 650;
  line-height: 1.5;
}

/* Skeleton */
.skeleton-loading-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 20px;
}

.skeleton-card {
  height: 150px;
  background: #E5E7EB;
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

/* Footer */
.share-footer {
  text-align: center;
  padding: 24px 0 8px;
  font-size: 0.75rem;
  color: #999;
  font-weight: 700;
}

/* Dark mode */
:global(.dark-theme) .share-page {
  background: var(--bg-color, #121214);
}

:global(.dark-theme) .bill-summary-card,
:global(.dark-theme) .progress-section-card,
:global(.dark-theme) .share-row-card {
  background: var(--box-bg) !important;
  border-color: var(--border-color) !important;
  box-shadow: 4px 4px 0px var(--border-color) !important;
}

:global(.dark-theme) .share-row-card.paid {
  background: #1a2e1a !important;
  border-color: #16A34A !important;
  box-shadow: 2px 2px 0px #16A34A !important;
}

:global(.dark-theme) .bill-title-text,
:global(.dark-theme) .share-name,
:global(.dark-theme) .share-total-amount,
:global(.dark-theme) .progress-fraction,
:global(.dark-theme) .drawer-item-name,
:global(.dark-theme) .drawer-item-cost,
:global(.dark-theme) .highlight-total,
:global(.dark-theme) .total-row,
:global(.dark-theme) .notfound-title {
  color: var(--text-color) !important;
}

:global(.dark-theme) .cost-summary-item,
:global(.dark-theme) .bill-date-text,
:global(.dark-theme) .share-items-count,
:global(.dark-theme) .drawer-item-portion,
:global(.dark-theme) .notfound-text,
:global(.dark-theme) .share-footer {
  color: var(--text-color-muted) !important;
}

:global(.dark-theme) .neubrutal-progress-track {
  background: var(--box-bg-alt) !important;
}

:global(.dark-theme) .drawer-divider {
  border-bottom-color: var(--border-color) !important;
}

:global(.dark-theme) .expand-arrow-btn {
  color: var(--text-color) !important;
}

:global(.dark-theme) .share-avatar-circle {
  border-color: var(--border-color) !important;
  box-shadow: 2px 2px 0px var(--border-color) !important;
}

:global(.dark-theme) .notfound-wrapper {
  background: var(--box-bg) !important;
  border-color: var(--border-color) !important;
  box-shadow: 4px 4px 0px var(--border-color) !important;
}

@media (max-width: 480px) {
  .share-main {
    padding: 16px 12px 48px;
  }
}

.app-logo {
  height: 56px;
  width: auto;
  object-fit: contain;
  display: block;
}
</style>
