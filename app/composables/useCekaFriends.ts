import { ref, computed } from 'vue'
import type { Friend } from '~/types'

export const useCekaFriends = () => {
  const allFriends = ref<Friend[]>([])

  const loadFriends = async (): Promise<void> => {
    try {
      const data = await $fetch<{ friends: any[] }>('/api/friends')
      const cleanLoaded = (data.friends || []).map(f => ({
        id: f.id,
        name: f.name,
        avatarBg: f.avatar_bg || 'avatar-bg-0',
        phone: f.phone || undefined,
        email: f.email || undefined
      })).filter(f => f.id !== 'you' && f.name.toLowerCase() !== 'kamu' && f.name.toLowerCase() !== 'you')

      // Always place the system "Kamu" (yourself) at the very top of allFriends
      allFriends.value = [
        { id: 'you', name: 'Kamu', avatarBg: 'avatar-bg-1' },
        ...cleanLoaded
      ]
    } catch (e) {
      console.error('Failed to load friends from database:', e)
      // Fallback if not logged in or endpoint fails (e.g. static shell)
      allFriends.value = [
        { id: 'you', name: 'Kamu', avatarBg: 'avatar-bg-1' }
      ]
    }
  }

  // Get friends except "Kamu" for listing
  const listFriendsOnly = computed((): Friend[] => {
    return allFriends.value.filter(
      f => f.id !== 'you' && f.name.toLowerCase() !== 'kamu' && f.name.toLowerCase() !== 'you'
    )
  })

  const getFriendDetails = (id: string | number): Friend | undefined => {
    return allFriends.value.find(f => f.id === id)
  }

  const getInitials = (name: string): string => {
    if (!name) return ''
    return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  const addFriend = async (name: string, phone: string, email: string): Promise<void> => {
    try {
      await $fetch('/api/friends', {
        method: 'POST',
        body: {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined
        }
      })
      await loadFriends()
    } catch (e) {
      console.error('Failed to add friend to database:', e)
    }
  }

  const updateFriend = async (id: string | number, name: string, phone: string, email: string): Promise<void> => {
    try {
      await $fetch(`/api/friends/${id}`, {
        method: 'PUT',
        body: {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined
        }
      })
      await loadFriends()
    } catch (e) {
      console.error('Failed to update friend in database:', e)
    }
  }

  const deleteFriend = async (id: string | number): Promise<void> => {
    try {
      await $fetch(`/api/friends/${id}`, {
        method: 'DELETE'
      })
      await loadFriends()
    } catch (e) {
      console.error('Failed to delete friend from database:', e)
    }
  }

  return {
    allFriends,
    listFriendsOnly,
    loadFriends,
    getFriendDetails,
    getInitials,
    addFriend,
    updateFriend,
    deleteFriend
  }
}
