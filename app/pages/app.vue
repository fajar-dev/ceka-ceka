<script setup>
import { ref } from 'vue'
import { Settings, LogOut, Camera, PenTool, Sparkles, FileText, Pizza, Coffee, User, Plus } from '@lucide/vue'

const isDropdownOpen = ref(false)
</script>

<template>
  <div class="neubrutal-container">
    <header class="app-header">
      <h1 class="page-title">Dashboard</h1>
      <div class="user-profile-wrapper">
        <div class="dropdown-overlay" v-if="isDropdownOpen" @click="isDropdownOpen = false"></div>
        
        <div class="user-avatar neubrutal-box" @click="isDropdownOpen = !isDropdownOpen">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80" alt="User Avatar" class="avatar-img" />
        </div>
        
        <!-- Dropdown Menu -->
        <div class="avatar-dropdown neubrutal-box" v-if="isDropdownOpen">
          <div class="dropdown-item" @click="isDropdownOpen = false">
            <Settings :size="18" />
            <span style="margin-left: 4px;">Setting</span>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item text-red" @click="isDropdownOpen = false">
            <LogOut :size="18" />
            <span style="margin-left: 4px;">Keluar</span>
          </div>
        </div>
      </div>
    </header>

    <main class="app-main">
      <!-- Summary / Illustration Card -->
      <section class="summary-section">
        <div class="summary-card neubrutal-box bg-mint">
          <div class="summary-content">
            <p class="summary-label">Tagihan Aktif</p>
            <h2 class="summary-amount">Rp 450.000</h2>
            <div class="summary-badge">2 belum lunas</div>
          </div>
          <div class="summary-illustration">
            <div class="mini-receipt">
              <div class="line"></div>
              <div class="line"></div>
              <div class="line short"></div>
              <div class="total-line"></div>
            </div>
            <Sparkles class="sparkle sp-1" :size="32" color="#F2C94C" fill="#F2C94C" />
            <Sparkles class="sparkle sp-2" :size="32" color="#F2C94C" fill="#F2C94C" />
          </div>
        </div>
      </section>

      <!-- Main Actions -->
      <section class="action-section">
        <button class="neubrutal-btn secondary action-btn">
          <span><Camera :size="18" /> Ambil Foto</span>
        </button>
        <button class="neubrutal-btn ghost action-btn">
          <span><PenTool :size="18" /> Buat Manual</span>
        </button>
      </section>

      <!-- Friends List (Horizontal Scroll) -->
      <section class="friends-section">
        <div class="section-header">
          <h2 class="section-title">Teman</h2>
          <span class="see-all">Lihat Semua</span>
        </div>
        
        <div class="friends-scroll-container">
          <!-- Add friend button -->
          <div class="friend-item add-friend">
            <div class="friend-avatar neubrutal-box add-avatar">
              <Plus :size="28" strokeWidth="3" />
            </div>
            <span class="friend-name">Tambah</span>
          </div>

          <!-- Friend items (Mock Data) -->
          <div class="friend-item" v-for="i in 5" :key="i">
            <div class="friend-avatar neubrutal-box" :class="`avatar-bg-${i % 4}`">
              <span class="avatar-initial">T{{ i }}</span>
            </div>
            <span class="friend-name">Teman {{ i }}</span>
          </div>
        </div>
      </section>

      <!-- History Section -->
      <section class="history-section">
        <h2 class="section-title">History Split Bill</h2>
        
        <div class="history-list">
          <div class="history-card neubrutal-box">
            <div class="history-icon icon-bg-0"><FileText :size="24" /></div>
            <div class="history-details">
              <h3 class="history-title">Makan Siang Kopitiam</h3>
              <p class="history-date">12 Mei 2026 • 3 Orang</p>
            </div>
            <div class="history-amount">Rp 120.000</div>
          </div>
          
          <div class="history-card neubrutal-box">
            <div class="history-icon icon-bg-1"><Pizza :size="24" /></div>
            <div class="history-details">
              <h3 class="history-title">Pesen Pizza Malam</h3>
              <p class="history-date">10 Mei 2026 • 5 Orang</p>
            </div>
            <div class="history-amount">Rp 250.000</div>
          </div>

          <div class="history-card neubrutal-box">
            <div class="history-icon icon-bg-2"><Coffee :size="24" /></div>
            <div class="history-details">
              <h3 class="history-title">Nongkrong Cafe</h3>
              <p class="history-date">08 Mei 2026 • 2 Orang</p>
            </div>
            <div class="history-amount">Rp 85.000</div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-header {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #111;
}

.user-avatar {
  width: 48px;
  height: 48px;
  background: var(--soft-yellow);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-profile-wrapper {
  position: relative;
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
}

.avatar-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 160px;
  background: white;
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}

.dropdown-item {
  padding: 12px 16px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #111;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.dropdown-item:active {
  background: #f0f0f0;
}

.dropdown-item.text-red {
  color: #E02424;
}

.dropdown-divider {
  height: 2px;
  background: #111;
  margin: 4px 0;
}

.app-main {
  padding: 0 24px 100px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.action-section {
  display: flex;
  gap: 16px;
}

.action-btn {
  flex: 1;
  padding: 16px 8px;
  font-size: 1.1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.action-btn span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.neubrutal-btn.secondary {
  background-color: var(--pastel-blue);
}

/* Summary Section */
.summary-section {
  margin-bottom: 4px;
}

.summary-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: var(--mint-green);
  overflow: hidden;
  position: relative;
}

.summary-content {
  z-index: 2;
}

.summary-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #444;
  margin-bottom: 4px;
}

.summary-amount {
  font-size: 1.75rem;
  font-weight: 800;
  color: #111;
  margin-bottom: 8px;
}

.summary-badge {
  display: inline-block;
  background: white;
  border: 2px solid #111;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
  box-shadow: 2px 2px 0px #111;
}

.summary-illustration {
  position: relative;
  width: 110px;
  height: 110px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

.mini-receipt {
  width: 68px;
  height: 90px;
  background: white;
  border: 3px solid #111;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transform: rotate(10deg);
  box-shadow: 3px 3px 0px #111;
  animation: float-small 3s ease-in-out infinite;
}

.mini-receipt .line {
  height: 4px;
  background: #111;
  border-radius: 2px;
}
.mini-receipt .line.short { width: 60%; }
.mini-receipt .total-line {
  height: 6px;
  background: var(--peach);
  border: 2px solid #111;
  margin-top: auto;
  border-radius: 3px;
}

.sparkle {
  position: absolute;
  font-size: 1.8rem;
}
.sp-1 { top: -5px; left: -15px; animation: pop 2s ease-in-out infinite; }
.sp-2 { bottom: 5px; right: -15px; animation: pop 2s ease-in-out infinite 1s; }

@keyframes float-small {
  0%, 100% { transform: translateY(0) rotate(10deg); }
  50% { transform: translateY(-5px) rotate(10deg); }
}

@keyframes pop {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
}

/* Friends Section */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #111;
}

.see-all {
  font-size: 0.875rem;
  font-weight: 700;
  color: #666;
  cursor: pointer;
}

.friends-scroll-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 12px; /* For shadow */
  scrollbar-width: none; /* Firefox */
}
.friends-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome */
}

.friend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 64px;
  cursor: pointer;
}

.friend-item:active .friend-avatar {
  transform: translate(2px, 2px);
  box-shadow: var(--shadow-hard-sm);
}

.friend-avatar {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: var(--shadow-hard);
  transition: all 0.2s;
  border: 3px solid #111;
}

.add-avatar {
  background: white;
  border: 2px dashed #111;
  box-shadow: none;
}
.add-avatar svg {
  width: 28px;
  height: 28px;
  color: #111;
}

.avatar-bg-0 { background: var(--mint-green); }
.avatar-bg-1 { background: var(--pastel-blue); }
.avatar-bg-2 { background: var(--soft-yellow); }
.avatar-bg-3 { background: var(--peach); }

.avatar-initial {
  font-weight: 800;
  font-size: 1.2rem;
  color: #111;
  font-family: 'Outfit', sans-serif;
}

.friend-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: #111;
}

/* History Section */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.history-card {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s;
  cursor: pointer;
}
.history-card:active {
  transform: translate(2px, 2px);
  box-shadow: var(--shadow-hard-sm);
}

.history-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid #111;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  background: white;
  flex-shrink: 0;
}

.icon-bg-0 { background: var(--pastel-blue); }
.icon-bg-1 { background: var(--peach); }
.icon-bg-2 { background: var(--soft-yellow); }

.history-details {
  flex: 1;
  overflow: hidden;
}

.history-title {
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.history-date {
  font-size: 0.75rem;
  font-weight: 500;
  color: #666;
}

.history-amount {
  font-weight: 800;
  font-size: 1rem;
  color: #111;
}
</style>
