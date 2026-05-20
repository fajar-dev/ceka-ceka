<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: string
  avatarBg?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  avatarBg: 'avatar-bg-0',
  size: 'md'
})

const initials = computed((): string => {
  if (!props.name) return ''
  return props.name
    .trim()
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
})

const sizeClass = computed((): string => {
  if (props.size === 'sm') return 'avatar-sm'
  if (props.size === 'lg') return 'avatar-lg'
  if (props.size === 'xl') return 'avatar-xl'
  return 'avatar-md'
})
</script>

<template>
  <div :class="['friend-avatar', 'neubrutal-box', avatarBg, sizeClass]" :title="name">
    <span>{{ initials }}</span>
  </div>
</template>

<style scoped>
.friend-avatar {
  border: 3px solid #111;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 850;
  color: #111;
}

/* Avatar Sizes */
.avatar-sm {
  width: 34px;
  height: 34px;
  font-size: 0.78rem;
  box-shadow: 1.5px 1.5px 0px #111;
  border-width: 2px;
  border-radius: 6px;
}

.avatar-md {
  width: 42px;
  height: 42px;
  font-size: 0.9rem;
  box-shadow: 2px 2px 0px #111;
  border-radius: 8px;
}

.avatar-lg {
  width: 52px;
  height: 52px;
  font-size: 1.15rem;
  box-shadow: 2.5px 2.5px 0px #111;
  border-radius: 10px;
}

.avatar-xl {
  width: 74px;
  height: 74px;
  font-size: 1.55rem;
  box-shadow: 4px 4px 0px #111;
  border-radius: 16px;
}

/* Curated Neubrutalist Pastel Backgrounds */
.avatar-bg-0 { background-color: var(--mint-green); }
.avatar-bg-1 { background-color: var(--pastel-blue); }
.avatar-bg-2 { background-color: var(--soft-yellow); }
.avatar-bg-3 { background-color: var(--peach); }
</style>
