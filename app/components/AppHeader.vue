<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { getCurrentInstance } from 'vue'

interface Props {
  title: string
  showBackButton?: boolean
  backRoute?: string
}

const props = withDefaults(defineProps<Props>(), {
  showBackButton: true,
  backRoute: ''
})

const emit = defineEmits<{
  (e: 'back'): void
}>()

const router = useRouter()
const instance = getCurrentInstance()

const handleBack = () => {
  emit('back')
  
  // Only navigate automatically if the parent has no custom @back listener
  const hasBackListener = !!(instance?.vnode?.props?.onBack || instance?.vnode?.props?.['onBack'])
  if (!hasBackListener) {
    if (props.backRoute) {
      router.push(props.backRoute)
    } else {
      router.back()
    }
  }
}
</script>

<template>
  <header class="app-header">
    <button
      v-if="showBackButton"
      type="button"
      @click="handleBack"
      class="back-btn neubrutal-box"
      aria-label="Kembali"
    >
      <ArrowLeft :size="20" :stroke-width="2.5" />
    </button>
    <div v-else class="header-spacer"></div>

    <h1 class="page-title">{{ title }}</h1>
    
    <div class="header-actions">
      <slot name="actions" />
      <div v-if="!$slots.actions && showBackButton" class="header-spacer"></div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.back-btn {
  width: 42px;
  height: 42px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  color: #111;
  text-decoration: none;
  background: white;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: var(--shadow-hard-sm);
  border: 3px solid #111;
  cursor: pointer;
}

.back-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px #111;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111;
  text-align: center;
  flex: 1;
}

.header-spacer {
  width: 42px;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

@media (max-width: 480px) {
  .app-header {
    padding: 16px 12px;
  }
  .page-title {
    font-size: 1.35rem;
  }
}
</style>
