import { ref } from 'vue'
import type { HistoryRecord } from '~/types'

export const useCekaHistory = () => {
  const history = ref<HistoryRecord[]>([])

  const loadHistory = (): void => {
    if (!process.client) return
    const saved = localStorage.getItem('ceka_history')
    if (saved) {
      try {
        history.value = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse history', e)
        history.value = []
      }
    } else {
      history.value = []
    }
  }

  const deleteRecord = (id: number): void => {
    if (!process.client) return
    history.value = history.value.filter(item => item.id !== id)
    localStorage.setItem('ceka_history', JSON.stringify(history.value))
  }

  const getRecordById = (id: number): HistoryRecord | undefined => {
    return history.value.find(item => item.id === id)
  }

  return {
    history,
    loadHistory,
    deleteRecord,
    getRecordById
  }
}
