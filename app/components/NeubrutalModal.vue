<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  show: boolean
  accent?: 'default' | 'danger' | 'warning' | 'primary'
  contentClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  accent: 'default',
  contentClass: ''
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const accentClass = computed(() => {
  if (props.accent === 'danger') return 'danger-accent'
  if (props.accent === 'warning') return 'warning-accent'
  if (props.accent === 'primary') return 'primary-accent'
  return 'default-accent'
})

const handleOverlayClick = () => {
  emit('close')
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="modal-overlay" @click.self="handleOverlayClick">
      <Transition name="pop">
        <div v-if="show" :class="['neubrutal-box', 'modal-content', contentClass]">
          <!-- Neubrutalist Colorful Top Accent Strip -->
          <div :class="['modal-accent-bar', accentClass]"></div>
          
          <!-- Main Content Slot Wrapper with Premium Spacing -->
          <div class="modal-inner">
            <slot />
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 20px;
}

.modal-content {
  background: var(--box-bg);
  width: 100%;
  max-width: 420px;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  animation: modal-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-accent-bar {
  height: 14px;
  border-bottom: 3.5px solid #111;
  width: 100%;
}

.modal-inner {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.default-accent { background: var(--pastel-blue); }
.danger-accent { background: #EF4444; }
.warning-accent { background: var(--soft-yellow); }
.primary-accent { background: var(--mint-green); }

/* Neubrutalist Base Styling Box Override */
.neubrutal-box {
  border: 4px solid #111;
  box-shadow: 6px 6px 0px #111;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.pop-enter-active,
.pop-leave-active {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.25s ease;
}

.pop-enter-from,
.pop-leave-to {
  transform: scale(0.92) translateY(10px);
  opacity: 0;
}
</style>
