import { ref, computed } from 'vue'
import type { Friend } from '~/types'

export const useCekaFriends = () => {
  const allFriends = ref<Friend[]>([])

  const loadFriends = (): void => {
    if (!process.client) return
    let loaded: Friend[] = []
    const saved = localStorage.getItem('ceka_friends')
    if (saved) {
      try {
        loaded = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse friends', e)
      }
    } else {
      loaded = [
        { id: 1, name: 'Budi Pekerti', avatarBg: 'avatar-bg-0' },
        { id: 2, name: 'Siti Rahma', avatarBg: 'avatar-bg-1' },
        { id: 3, name: 'Joko Widodo', avatarBg: 'avatar-bg-2' },
        { id: 4, name: 'Dewi Lestari', avatarBg: 'avatar-bg-3' },
        { id: 5, name: 'Rian Adriansyah', avatarBg: 'avatar-bg-0' }
      ]
      localStorage.setItem('ceka_friends', JSON.stringify(loaded))
    }

    // Filter out any "you" or manually added "Kamu"/"You" entries from the loaded friends array to prevent duplicates or contamination.
    const cleanLoaded = loaded.filter(f => f.id !== 'you' && f.name.toLowerCase() !== 'kamu' && f.name.toLowerCase() !== 'you')

    // Always place the system "Kamu" (yourself) at the very top of allFriends
    allFriends.value = [
      { id: 'you', name: 'Kamu', avatarBg: 'avatar-bg-1' },
      ...cleanLoaded
    ]
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

  const addFriend = (name: string, phone: string, email: string): void => {
    if (!process.client) return
    const newFriend: Friend = {
      id: Date.now(),
      name: name.trim(),
      avatarBg: `avatar-bg-${allFriends.value.length % 4}`,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined
    }

    const stored = allFriends.value.filter(f => f.id !== 'you')
    stored.push(newFriend)
    localStorage.setItem('ceka_friends', JSON.stringify(stored))
    loadFriends()
  }

  const updateFriend = (id: string | number, name: string, phone: string, email: string): void => {
    if (!process.client) return
    allFriends.value = allFriends.value.map(f => {
      if (f.id === id) {
        return {
          ...f,
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined
        }
      }
      return f
    })

    const stored = allFriends.value.filter(f => f.id !== 'you')
    localStorage.setItem('ceka_friends', JSON.stringify(stored))
    loadFriends()
  }

  const deleteFriend = (id: string | number): void => {
    if (!process.client) return
    allFriends.value = allFriends.value.filter(f => f.id !== id)
    const stored = allFriends.value.filter(f => f.id !== 'you')
    localStorage.setItem('ceka_friends', JSON.stringify(stored))
    loadFriends()
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
