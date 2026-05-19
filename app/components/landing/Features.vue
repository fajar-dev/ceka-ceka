<script setup>
import { ScanSearch, Coins, Users } from '@lucide/vue'
</script>

<template>
  <div class="features-grid">
    <div class="feature-card bg-blue">
      <div class="feature-icon"><ScanSearch :size="20" /></div>
      <span class="feature-text">Scan Struk<br/>Otomatis</span>
    </div>
    <div class="feature-card bg-yellow">
      <div class="feature-icon"><Coins :size="20" /></div>
      <span class="feature-text">Hitung<br/>Pajak & Tip</span>
    </div>
    <div class="feature-card bg-peach">
      <div class="feature-icon"><Users :size="20" /></div>
      <span class="feature-text">Share ke<br/>Teman</span>
    </div>
  </div>
</template>

<style scoped>
.features-grid {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.feature-card {
  flex: 1;
  border: 3px solid #111;
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  box-shadow: var(--shadow-hard-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bg-blue { background: var(--pastel-blue); }
.bg-yellow { background: var(--soft-yellow); }
.bg-peach { background: var(--peach); }

.feature-icon {
  font-size: 1.5rem;
  background: white;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid #111;
}

.feature-text {
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.2;
}
</style>
