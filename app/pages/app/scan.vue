<script setup lang="ts">
import { ref, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { Camera, Image, RotateCw, X, Check, Sparkles } from '@lucide/vue'
import { useCekaSettings } from '~/composables/useCekaSettings'

const { t, loadSettings, language } = useCekaSettings()
const router = useRouter()

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const stream = ref<MediaStream | null>(null)
const cameraError = ref<string | null>(null)
const facingMode = ref<'environment' | 'user'>('environment')
const isCaptured = ref(false)
const capturedImage = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isScanning = ref(false)
const toastMessage = ref<string | null>(null)
const toastType = ref<'error' | 'success'>('error')

const showToast = (message: string, type: 'error' | 'success' = 'error') => {
  toastMessage.value = message
  toastType.value = type
  
  // Auto-hide toast after 5 seconds
  setTimeout(() => {
    if (toastMessage.value === message) {
      toastMessage.value = null
    }
  }, 5000)
}

onMounted(() => {
  loadSettings()
  startCamera()
})

onUnmounted(() => {
  stopCamera()
})

onBeforeUnmount(() => {
  stopCamera()
})

onBeforeRouteLeave((to, from, next) => {
  stopCamera()
  next()
})

const startCamera = async () => {
  stopCamera()
  cameraError.value = null
  
  try {
    const constraints = {
      video: {
        facingMode: facingMode.value,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    }
    
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
    stream.value = mediaStream
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
    }
  } catch (err) {
    console.error('Error accessing camera:', err)
    cameraError.value = t('cameraError')
  }
}

const stopCamera = () => {
  if (stream.value) {
    try {
      stream.value.getTracks().forEach(track => {
        track.stop()
      })
    } catch (err) {
      console.error('Error stopping camera tracks:', err)
    }
    stream.value = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

const toggleCamera = () => {
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
  startCamera()
}

const takePhoto = () => {
  if (!videoRef.value || !canvasRef.value) return
  
  const video = videoRef.value
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Match canvas dimensions to video feed
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  // Draw current frame
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  
  capturedImage.value = canvas.toDataURL('image/jpeg')
  isCaptured.value = true
  stopCamera()
}

const triggerFileSelect = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    capturedImage.value = e.target?.result as string
    isCaptured.value = true
    stopCamera()
    // Clear the file input immediately so the user can re-select the same file if desired
    target.value = ''
  }
  reader.readAsDataURL(file)
}

const retakePhoto = () => {
  isCaptured.value = false
  capturedImage.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  startCamera()
}

const processOCR = async () => {
  const isEnglish = language.value === 'en'

  if (!capturedImage.value) {
    showToast(
      isEnglish 
        ? 'Please capture a photo or choose an image first.' 
        : 'Silakan ambil foto atau pilih gambar terlebih dahulu.', 
      'error'
    )
    return
  }

  isScanning.value = true
  
  try {
    const response = await $fetch<{ success: boolean; data: any }>('/api/scan-bill', {
      method: 'POST',
      body: {
        image: capturedImage.value,
        lang: language.value
      }
    })

    isScanning.value = false

    if (response.success && response.data?.isBill) {
      const geminiData = response.data
      
      // Map items cleanly, ensuring strings for numeric bindings where Vue uses sanitizeNumber
      const mappedItems = (geminiData.items || []).map((item: any) => ({
        name: item.name || '',
        price: item.price !== undefined && item.price !== null ? String(item.price) : '',
        quantity: item.quantity !== undefined && item.quantity !== null ? Number(item.quantity) : 1,
        totalPrice: item.totalPrice !== undefined && item.totalPrice !== null ? String(item.totalPrice) : '',
        assignments: {}
      }))
      
      if (mappedItems.length === 0) {
        mappedItems.push({ name: '', price: '', quantity: 1, totalPrice: '', assignments: {} })
      }

      // Map other fees cleanly
      const mappedOtherFees = (geminiData.otherFees || []).map((fee: any) => ({
        name: fee.name || '',
        amount: fee.amount !== undefined && fee.amount !== null ? String(fee.amount) : ''
      }))

      // Prepare draft state for bill.vue
      const draft = {
        bill: {
          title: geminiData.title || '',
          date: geminiData.date || new Date().toISOString().substring(0, 10),
          category: geminiData.category || 'file',
          items: mappedItems,
          taxType: geminiData.taxType || 'percent',
          taxPercent: geminiData.taxPercent !== undefined && geminiData.taxPercent !== null && Number(geminiData.taxPercent) > 0 ? String(geminiData.taxPercent) : '',
          taxManual: geminiData.taxManual !== undefined && geminiData.taxManual !== null && Number(geminiData.taxManual) > 0 ? String(geminiData.taxManual) : '',
          discountType: geminiData.discountType || 'manual',
          discountPercent: geminiData.discountPercent !== undefined && geminiData.discountPercent !== null && Number(geminiData.discountPercent) > 0 ? String(geminiData.discountPercent) : '',
          discountManual: geminiData.discountManual !== undefined && geminiData.discountManual !== null && Number(geminiData.discountManual) > 0 ? String(geminiData.discountManual) : '',
          otherFees: mappedOtherFees
        },
        selectedFriendIds: ['you'] // Default selected friend is 'you'
      }

      // Save draft to localStorage so bill.vue instantly loads it
      localStorage.setItem('ceka_bill_draft', JSON.stringify(draft))
      
      // Redirect to the bill split form page
      router.push('/app/bill')
    } else {
      // Image is not a bill or blurry
      let reason = response.data?.reason || (isEnglish ? 'Unclear image or not a receipt.' : 'Gambar tidak jelas atau bukan struk.')
      if (reason.length > 100) {
        reason = reason.substring(0, 97) + '...'
      }
      retakePhoto()
      showToast(reason, 'error')
    }
  } catch (error: any) {
    isScanning.value = false
    console.error('Scan error:', error)
    retakePhoto()
    
    // Extract server-side statusMessage or general error
    const defaultError = isEnglish ? 'Failed to process image.' : 'Gagal memproses gambar.'
    let errorMsg = error.data?.statusMessage || error.message || defaultError
    
    // Translate standard error responses
    if (errorMsg === 'Unauthorized') {
      errorMsg = isEnglish ? 'Session expired. Please log in again.' : 'Sesi kedaluwarsa. Silakan masuk kembali.'
    } else if (errorMsg.includes('fetch failed') || errorMsg.includes('Failed to fetch')) {
      errorMsg = isEnglish ? 'Network error. Please check your connection.' : 'Koneksi bermasalah. Cek koneksi internet Anda.'
    } else if (errorMsg.includes('Gemini API Key is not configured') || errorMsg.includes('not configured')) {
      errorMsg = isEnglish 
        ? 'Gemini API Key is not configured. Please set GEMINI_API_KEY in your .env file.' 
        : 'Kunci API Gemini belum dikonfigurasi. Silakan setel GEMINI_API_KEY di file .env Anda.'
    }

    if (errorMsg.length > 100) {
      errorMsg = errorMsg.substring(0, 97) + '...'
    }
    showToast(errorMsg, 'error')
  }
}
</script>

<template>
  <div class="neubrutal-container scan-page-container">
    <!-- Neubrutalist Toast Alert Overlay -->
    <transition name="toast-slide">
      <div v-if="toastMessage" class="toast-alert neubrutal-box" :class="toastType">
        <div class="toast-content">
          <span class="toast-icon">⚠️</span>
          <span class="toast-text">{{ toastMessage }}</span>
        </div>
        <button class="toast-close" @click="toastMessage = null">&times;</button>
      </div>
    </transition>

    <!-- Camera Feed (Full Screen Behind) -->
    <div class="camera-fullscreen-wrapper">
      <div v-show="!isCaptured" class="video-container">
        <video ref="videoRef" autoplay playsinline class="camera-video"></video>
        
        <!-- Scan Guides / Viewfinder Overlay -->
        <div class="viewfinder-overlay">
          <div class="viewfinder-corners">
            <div class="corner tl"></div>
            <div class="corner tr"></div>
            <div class="corner bl"></div>
            <div class="corner br"></div>
          </div>
          <div class="scanning-animation-bar"></div>
          <div class="scan-hint">{{ t('scanHint') }}</div>
        </div>
      </div>

      <!-- Preview Captured Image -->
      <div v-show="isCaptured" class="preview-container">
        <img v-if="capturedImage" :src="capturedImage" alt="Captured Receipt" class="captured-preview-img" />
        
        <!-- Scan Loader Overlay -->
        <div v-if="isScanning" class="ocr-scanning-overlay">
          <div class="scanning-spinner">
            <Sparkles class="sparkle-icon" :size="36" />
            <span>{{ t('ocrScanning') }}</span>
          </div>
          <div class="ocr-scanning-line"></div>
        </div>
      </div>

      <!-- Camera Error Message -->
      <div v-if="cameraError && !isCaptured" class="camera-error-message neubrutal-box">
        <p>{{ cameraError }}</p>
        <button class="neubrutal-btn primary retry-btn" @click="startCamera">{{ t('retryBtn') }}</button>
      </div>
    </div>

    <!-- Floating Top Header -->
    <AppHeader :title="t('scanTitle')" back-route="/app" :show-back-button="true" class="floating-header" />

    <!-- Gallery Input File (Hidden) -->
    <input 
      type="file" 
      ref="fileInputRef" 
      accept="image/*" 
      class="hidden-file-input" 
      @change="handleFileSelect"
    />

    <!-- Hidden canvas for capturing video frames -->
    <canvas ref="canvasRef" style="display: none;"></canvas>

    <!-- Floating Bottom Controls -->
    <!-- Live Camera Controls -->
    <section v-if="!isCaptured" class="controls-section floating-controls">
      <button class="control-btn circle neubrutal-box" @click="triggerFileSelect" :title="language === 'en' ? 'Select from Gallery' : 'Pilih dari Galeri'">
        <Image :size="22" :stroke-width="2.5" />
      </button>
      
      <button class="capture-btn neubrutal-box" @click="takePhoto" :title="language === 'en' ? 'Take Photo' : 'Ambil Foto'">
        <div class="inner-circle">
          <Camera :size="28" :stroke-width="2.5" />
        </div>
      </button>
      
      <button class="control-btn circle neubrutal-box" @click="toggleCamera" :title="language === 'en' ? 'Switch Camera' : 'Ubah Kamera'">
        <RotateCw :size="22" :stroke-width="2.5" />
      </button>
    </section>

    <!-- Capture Confirmation Controls -->
    <section v-else class="controls-section floating-controls confirmation">
      <button class="neubrutal-btn ghost action-btn-confirm" @click="retakePhoto" :disabled="isScanning">
        <X :size="18" :stroke-width="2.5" />
        <span>{{ t('retakeBtn') }}</span>
      </button>
      
      <button class="neubrutal-btn primary action-btn-confirm" @click="processOCR" :disabled="isScanning">
        <Check :size="18" :stroke-width="3" />
        <span>{{ t('processBtn') }}</span>
      </button>
    </section>
  </div>
</template>

<style scoped>
.scan-page-container {
  background-color: #000 !important; /* Pure black for camera backdrop */
  color: white;
  height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.camera-fullscreen-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.video-container, .preview-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captured-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Viewfinder Overlay (Native Immersive View) */
.viewfinder-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  pointer-events: none;
  z-index: 5;
}

.viewfinder-corners {
  position: relative;
  width: 280px;
  height: 420px;
  max-width: 80%;
  max-height: 55%;
  border: 1px dashed rgba(255, 255, 255, 0.25);
  border-radius: 8px;
}

.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 4px solid var(--mint-green);
  z-index: 6;
}

.corner.tl { top: -3px; left: -3px; border-right: none; border-bottom: none; }
.corner.tr { top: -3px; right: -3px; border-left: none; border-bottom: none; }
.corner.bl { bottom: -3px; left: -3px; border-right: none; border-top: none; }
.corner.br { bottom: -3px; right: -3px; border-left: none; border-top: none; }

.scanning-animation-bar {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to right, transparent, var(--mint-green), transparent);
  box-shadow: 0 0 10px var(--mint-green);
  animation: scan-line-full 3s ease-in-out infinite;
}

@keyframes scan-line-full {
  0% { top: 0%; }
  100% { top: 100%; }
}

.scan-hint {
  position: absolute;
  bottom: 160px;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.75);
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #000;
  box-shadow: 2px 2px 0px #000;
  color: white;
}

/* Floating Top Header */
:deep(.floating-header) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%) !important;
  border: none !important;
}

:deep(.floating-header .page-title) {
  color: white !important;
  text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.8);
}

:deep(.floating-header .back-btn) {
  background: white !important;
  color: #111 !important;
}

/* Hidden inputs */
.hidden-file-input {
  display: none;
}

/* Floating Bottom Controls */
.floating-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%);
  padding: 48px 24px 48px;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.floating-controls.confirmation {
  gap: 16px;
  padding-left: 24px;
  padding-right: 24px;
}

.control-btn.circle {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  color: #111;
  cursor: pointer;
  padding: 0;
  box-shadow: 3px 3px 0px #000;
  border: 3px solid #000;
  transition: transform 0.1s, box-shadow 0.1s;
}

.control-btn.circle:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.capture-btn {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: var(--mint-green);
  color: #111;
  border: 3px solid #000;
  box-shadow: 4px 4px 0px #000;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s, box-shadow 0.1s;
}

.capture-btn:active {
  transform: translate(3px, 3px);
  box-shadow: 1px 1px 0px #000;
}

.inner-circle {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  border: 2px dashed #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.action-btn-confirm {
  flex: 1;
  padding: 14px 20px;
  font-size: 1rem;
  border-radius: var(--radius-lg);
  box-shadow: 4px 4px 0 #000;
  border: 3px solid #000;
}

.action-btn-confirm:active {
  box-shadow: 1px 1px 0 #000;
}

.action-btn-confirm span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* OCR AI Scanning Overlay */
.ocr-scanning-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.scanning-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  font-weight: 800;
  font-size: 1.1rem;
  color: white;
  text-align: center;
}

.sparkle-icon {
  animation: rotate-sparkle 1.5s ease-in-out infinite;
  color: var(--soft-yellow);
}

@keyframes rotate-sparkle {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.2) rotate(180deg); }
}

.ocr-scanning-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 6px;
  background: var(--soft-yellow);
  box-shadow: 0 0 15px var(--soft-yellow);
  animation: scan-full-height 1.5s ease-in-out infinite;
}

@keyframes scan-full-height {
  0% { top: 0%; }
  50% { top: 100%; }
  100% { top: 0%; }
}

/* Errors */
.camera-error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 85%;
  background: var(--box-bg);
  color: var(--text-color);
  padding: 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  z-index: 30;
}

.camera-error-message p {
  font-weight: 700;
  color: #EF4444;
}

.retry-btn {
  padding: 10px 20px;
  box-shadow: var(--shadow-hard-sm);
  font-size: 0.95rem;
}

/* Toast Alert Neubrutalist Styling */
.toast-alert {
  position: absolute;
  top: 90px;
  left: 20px;
  right: 20px;
  z-index: 999;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 3px solid #000;
  box-shadow: 4px 4px 0 #000;
  border-radius: var(--radius-lg);
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  transition: all 0.3s ease;
}

.toast-alert.error {
  background-color: #EF4444 !important; /* Cherry Red for Errors */
  color: white !important;
}

.toast-alert.success {
  background-color: var(--mint-green) !important;
  color: #111 !important;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.toast-icon {
  font-size: 1.2rem;
  display: flex;
  align-items: center;
}

.toast-text {
  font-size: 0.88rem;
  line-height: 1.4;
  color: inherit !important;
}

.toast-close {
  background: none;
  border: none !important;
  color: inherit !important;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Toast Slide Transition */
.toast-slide-enter-active, .toast-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-slide-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.toast-slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>

<style>
.dark-theme .floating-header .back-btn {
  background: #1E1E22 !important;
  color: #F4F4F5 !important;
}
</style>
