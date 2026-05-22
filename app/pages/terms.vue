<script setup lang="ts">
import { useCekaSettings } from '~/composables/useCekaSettings'
const { t } = useCekaSettings()

useHead({
  title: 'Syarat & Ketentuan (Terms of Service) - CekaCeka',
  meta: [
    { name: 'description', content: 'Syarat dan Ketentuan penggunaan layanan CekaCeka' }
  ]
})
</script>

<template>
  <div class="neubrutal-container">
    <AppHeader title="Terms of Service" back-route="/" />
    
    <main class="document-main">
      <div class="document-content neubrutal-box">
        <h2 class="doc-title">Syarat & Ketentuan Layanan</h2>
        <p class="doc-date">Terakhir Diperbarui: 22 Mei 2026</p>

        <section class="doc-section">
          <h3>1. Penerimaan Syarat</h3>
          <p>
            Dengan mendaftar, mengakses, atau menggunakan aplikasi Ceka-Ceka, Anda secara otomatis menyetujui dan terikat oleh Syarat dan Ketentuan (Terms of Service) ini. Jika Anda tidak menyetujui sebagian atau seluruh ketentuan ini, harap tidak menggunakan layanan kami.
          </p>
        </section>

        <section class="doc-section">
          <h3>2. Deskripsi Layanan</h3>
          <p>
            Ceka-Ceka adalah aplikasi berbasis web yang membantu Anda mendigitalisasi nota, menghitung, serta membagikan tagihan (bill splitting) secara adil di antara teman-teman. Aplikasi dapat terintegrasi dengan akun Google Anda untuk memudahkan login dan sinkronisasi daftar kontak.
          </p>
        </section>

        <section class="doc-section">
          <h3>3. Ketentuan Penggunaan (Google OAuth & Contacts API)</h3>
          <p>Dengan menghubungkan akun Google Anda:</p>
          <ul>
            <li>Anda memberikan otorisasi kepada sistem kami untuk mengakses profil dasar dan (apabila disetujui) membaca daftar Google Contacts Anda.</li>
            <li>Penggunaan informasi yang diterima dari Google API mematuhi <a href="/privacy" style="color: inherit; font-weight: bold;">Kebijakan Privasi</a> kami serta Kebijakan Data Pengguna Layanan API Google.</li>
            <li>Aplikasi bertindak semata-mata sebagai perantara kalkulasi tagihan dan tidak mengelola perpindahan dana uang secara langsung.</li>
          </ul>
        </section>

        <section class="doc-section">
          <h3>4. Kewajiban Pengguna</h3>
          <p>Sebagai pengguna, Anda setuju untuk:</p>
          <ul>
            <li>Menggunakan aplikasi dengan iktikad baik dan tidak menyalahgunakan celah sistem.</li>
            <li>Bertanggung jawab sepenuhnya atas informasi patungan atau tagihan yang Anda buat dan bagikan melalui tautan publik.</li>
            <li>Memastikan keamanan perangkat atau sesi login Anda dari pihak yang tidak berwenang.</li>
          </ul>
        </section>

        <section class="doc-section">
          <h3>5. Keterbatasan Tanggung Jawab</h3>
          <p>
            Kalkulasi pembagian tagihan yang dilakukan oleh aplikasi, termasuk ekstraksi nota oleh AI (Gemini), bersifat informatif dan membantu mempermudah perhitungan. Kesalahan membaca karakter atau perhitungan akhir harus diverifikasi oleh pengguna. Pengembang tidak bertanggung jawab atas perselisihan antar teman, sengketa pembayaran, atau kerugian finansial yang diakibatkan oleh penggunaan sistem kami.
          </p>
        </section>

        <section class="doc-section">
          <h3>6. Perubahan Syarat</h3>
          <p>
            Kami berhak untuk mengubah, memodifikasi, atau memperbarui Syarat dan Ketentuan ini sewaktu-waktu. Perubahan akan segera berlaku saat dipublikasikan pada halaman ini.
          </p>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.document-main {
  padding: 0 24px 60px;
  max-width: 800px;
  margin: 0 auto;
}

.document-content {
  background: var(--box-bg);
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.doc-title {
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--text-color);
  margin-bottom: 4px;
  line-height: 1.2;
}

.doc-date {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color-muted);
  margin-bottom: 12px;
  border-bottom: 2px solid #111;
  padding-bottom: 16px;
}

.doc-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.doc-section h3 {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-color);
}

.doc-section p {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-color);
  font-weight: 500;
}

.doc-section ul {
  padding-left: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doc-section li {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-color);
  font-weight: 500;
}

@media (max-width: 480px) {
  .document-main {
    padding: 0 12px 40px;
  }
  .document-content {
    padding: 24px 16px;
  }
  .doc-title {
    font-size: 1.5rem;
  }
}
</style>
