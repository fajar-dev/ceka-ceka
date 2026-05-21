import { ref } from 'vue'
import type { HistoryRecord } from '~/types'

export const useCekaHistory = () => {
  const history = ref<HistoryRecord[]>([])

  const loadHistory = async (): Promise<void> => {
    try {
      const data = await $fetch<{ bills: any[] }>('/api/bills')
      if (data && data.bills) {
        history.value = data.bills.map((b: any) => ({
          id: b.id,
          title: b.title,
          date: b.date,
          peopleCount: b.peopleCount,
          amount: b.amount,
          iconType: b.iconType,
          iconBg: b.iconBg,
          items: b.rawData?.items || [],
          invitedFriends: b.rawData?.invitedFriends || [],
          taxType: b.rawData?.taxType || 'percent',
          taxPercent: b.rawData?.taxPercent || 0,
          taxManual: b.rawData?.taxManual || 0,
          taxAmount: b.rawData?.taxAmount || 0,
          discountType: b.rawData?.discountType || 'percent',
          discountPercent: b.rawData?.discountPercent || 0,
          discountManual: b.rawData?.discountManual || 0,
          discountAmount: b.rawData?.discountAmount || 0,
          otherFees: b.rawData?.otherFees || [],
          subtotalItems: b.rawData?.subtotalItems || 0,
          subtotalOtherFees: b.rawData?.subtotalOtherFees || 0,
          shares: b.rawData?.shares || [],
          stats: b.stats
        }))
      }
    } catch (e) {
      console.error('Failed to load history from database:', e)
      history.value = []
    }
  }

  const deleteRecord = async (id: number | string): Promise<void> => {
    history.value = history.value.filter(item => String(item.id) !== String(id))

    try {
      await $fetch(`/api/bills/${id}`, {
        method: 'DELETE'
      })
    } catch (e) {
      console.error('Failed to delete bill from database:', e)
    }
  }

  const getRecordById = (id: number | string): HistoryRecord | undefined => {
    return history.value.find(item => String(item.id) === String(id))
  }

  return {
    history,
    loadHistory,
    deleteRecord,
    getRecordById
  }
}
