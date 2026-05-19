<script setup>
import { Smartphone } from '@lucide/vue'
</script>

<template>
  <header class="header-section">
    <div class="illustration-wrapper">
      <!-- Floating elements -->
      <div class="floating-coin coin-1">%</div>
      <div class="floating-coin coin-2">Rp</div>
      <div class="chat-bubble"><Smartphone :size="20" /></div>
      
      <!-- Main Phone Mockup -->
      <div class="phone-mockup neubrutal-box">
        <div class="phone-notch"></div>
        <div class="receipt-illustration">
          <div class="receipt-line"></div>
          <div class="receipt-line short"></div>
          <div class="receipt-line"></div>
          <div class="receipt-total"></div>
        </div>
        <div class="scan-frame">
          <div class="corner top-left"></div>
          <div class="corner top-right"></div>
          <div class="corner bottom-left"></div>
          <div class="corner bottom-right"></div>
          <div class="scan-line"></div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header-section {
  padding: 40px 20px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.illustration-wrapper {
  position: relative;
  width: 240px;
  height: 240px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.floating-coin {
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--soft-yellow);
  border: 3px solid #111;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.2rem;
  box-shadow: var(--shadow-hard);
  z-index: 5;
  animation: float 3s ease-in-out infinite;
}

.coin-1 { top: 20px; left: -10px; animation-delay: 0s; }
.coin-2 { bottom: 30px; right: -10px; background: var(--peach); animation-delay: 1.5s; }

.chat-bubble {
  position: absolute;
  top: 40px;
  right: 0px;
  width: 50px;
  height: 40px;
  background: var(--pastel-blue);
  border: 3px solid #111;
  border-radius: 12px;
  border-bottom-left-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-hard-sm);
  font-size: 1.2rem;
  z-index: 6;
  animation: float 4s ease-in-out infinite;
  animation-delay: 0.5s;
}

.phone-mockup {
  width: 140px;
  height: 200px;
  background: #E8F5E9;
  border-radius: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 12px;
  z-index: 2;
  transform: rotate(5deg);
}

.phone-notch {
  width: 40px;
  height: 12px;
  background: #111;
  border-radius: 6px;
  position: absolute;
  top: 8px;
}

.receipt-illustration {
  background: white;
  width: 90%;
  height: 100px;
  border: 2px solid #111;
  border-radius: 4px;
  margin-top: 15px;
  padding: 8px;
  box-shadow: 2px 2px 0px #111;
}

.receipt-line {
  height: 4px;
  background: #111;
  margin-bottom: 6px;
  border-radius: 2px;
}
.receipt-line.short { width: 60%; }
.receipt-total {
  height: 6px;
  background: var(--mint-green);
  margin-top: 10px;
  border-radius: 3px;
  border: 1px solid #111;
}

.scan-frame {
  position: absolute;
  top: 30px;
  left: 10px;
  right: 10px;
  bottom: 20px;
  border: 2px dashed rgba(17, 17, 17, 0.3);
  border-radius: 8px;
}

.scan-line {
  position: absolute;
  top: 50%;
  left: -5px;
  right: -5px;
  height: 3px;
  background: var(--mint-green);
  border: 1px solid #111;
  box-shadow: 0 0 10px var(--mint-green);
  animation: scan 2s linear infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes scan {
  0% { top: 10%; }
  50% { top: 90%; }
  100% { top: 10%; }
}
</style>
