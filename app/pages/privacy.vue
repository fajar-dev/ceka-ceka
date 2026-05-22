<script setup lang="ts">
import { useCekaSettings } from '~/composables/useCekaSettings'
const { t } = useCekaSettings()

useHead({
  title: 'Kebijakan Privasi (Privacy Policy) - CekaCeka',
  meta: [
    { name: 'description', content: 'Kebijakan Privasi untuk layanan CekaCeka' }
  ]
})
</script>

<template>
  <div class="neubrutal-container">
    <AppHeader title="Privacy Policy" back-route="/" />
    
    <main class="document-main">
      <div class="document-content neubrutal-box">
        <h2 class="doc-title">Kebijakan Privasi (Privacy Policy)</h2>
        <p class="doc-date">Terakhir Diperbarui: 22 Mei 2026</p>

        <section class="doc-section">
          <h3>1. Pengantar</h3>
          <p>
            Ceka-Ceka ("kami", "aplikasi") menghargai privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat Anda menggunakan aplikasi pembagian tagihan (bill splitting) kami.
          </p>
        </section>

        <section class="doc-section">
          <h3>2. Informasi yang Kami Kumpulkan</h3>
          <p>Saat Anda menggunakan Ceka-Ceka, kami mengumpulkan informasi berikut:</p>
          <ul>
            <li><strong>Informasi Akun Dasar:</strong> Nama, alamat email, dan foto profil Anda yang diperoleh dari Google OAuth saat proses login.</li>
            <li><strong>Data Kontak:</strong> Jika Anda menautkan Google Contacts, kami mengakses daftar kontak Anda secara aman melalui antarmuka read-only (hanya-baca) untuk memudahkan pemilihan teman patungan.</li>
            <li><strong>Data Transaksi:</strong> Data nota, daftar tagihan, rincian biaya, dan siapa saja yang terlibat dalam tagihan tersebut untuk keperluan histori akun Anda.</li>
          </ul>
        </section>

        <section class="doc-section">
          <h3>3. Cara Kami Menggunakan Informasi Anda</h3>
          <p>Informasi yang dikumpulkan digunakan semata-mata untuk menyediakan layanan Ceka-Ceka secara optimal, yaitu:</p>
          <ul>
            <li>Memverifikasi identitas Anda untuk keamanan login.</li>
            <li>Memfasilitasi fitur pencarian teman berdasarkan daftar kontak Google Anda dengan cepat tanpa perlu pengetikan manual.</li>
            <li>Mencatat riwayat transaksi, hutang, dan piutang patungan secara akurat.</li>
            <li>Melakukan pemrosesan scan nota berbasis gambar.</li>
          </ul>
        </section>

        <section class="doc-section">
          <h3>4. Berbagi Informasi Pihak Ketiga</h3>
          <p>
            Kami tidak pernah menjual, menyewakan, atau memberikan data pribadi atau daftar kontak Anda kepada pihak ketiga (seperti agen periklanan). Data kontak yang ditarik dari Google Contacts hanya disimpan di akun profil Anda dan tidak digunakan untuk tujuan pemasaran apa pun.
          </p>
        </section>

        <section class="doc-section">
          <h3>5. Hak Akses dan Penghapusan Data</h3>
          <p>
            Anda memiliki kontrol penuh atas data Anda. Anda berhak menghapus kontak atau riwayat transaksi langsung dari dalam aplikasi. Jika Anda ingin menghapus seluruh akun dan mencabut akses otorisasi, Anda dapat melakukannya di menu Pengaturan aplikasi atau melalui halaman kontrol keamanan Google Anda.
          </p>
        </section>

        <section class="doc-section">
          <h3>6. Kontak Kami</h3>
          <p>
            Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, Anda dapat menghubungi kami melalui email pengembang yang tertera di halaman Google OAuth consent screen.
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
