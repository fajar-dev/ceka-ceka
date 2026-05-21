<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'warning'
  type?: 'button' | 'submit'
  disabled?: boolean
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  disabled: false,
  customClass: ''
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const btnClasses = computed(() => {
  return [
    'neubrutal-btn',
    props.variant,
    props.customClass,
    { 'disabled-btn': props.disabled }
  ].join(' ')
})

const handleClick = (event: MouseEvent) => {
  if (props.disabled) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<template>
  <button
    :type="type"
    :class="btnClasses"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<style scoped>
.neubrutal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 0.95rem;
  font-weight: 900;
  color: var(--text-color, #111);
  text-decoration: none;
  background-color: var(--box-bg);
  border: 3px solid #111;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  box-shadow: 3px 3px 0px #111;
}

.neubrutal-btn:active:not(.disabled-btn) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px #111;
}

.neubrutal-btn.primary {
  background-color: var(--mint-green);
}

.neubrutal-btn.ghost {
  background-color: var(--box-bg);
}

.neubrutal-btn.danger {
  background-color: #EF4444;
  color: white;
}

.neubrutal-btn.success {
  background-color: #4ADE80;
}

.neubrutal-btn.warning {
  background-color: var(--soft-yellow);
}

.disabled-btn {
  opacity: 0.5;
  cursor: not-allowed !important;
  box-shadow: 1px 1px 0px #111 !important;
  transform: translate(1px, 1px) !important;
}
</style>
