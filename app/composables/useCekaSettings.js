import { useState } from '#app'

export const useCekaSettings = () => {
  const theme = useState('ceka_theme', () => 'light')
  const language = useState('ceka_language', () => 'id')
  const currency = useState('ceka_currency', () => 'Rp')

  const loadSettings = () => {
    if (process.client) {
      theme.value = localStorage.getItem('ceka_theme') || 'light'
      language.value = localStorage.getItem('ceka_language') || 'id'
      currency.value = localStorage.getItem('ceka_currency') || 'Rp'
      applyTheme()
    }
  }

  const setTheme = (val) => {
    theme.value = val
    if (process.client) {
      localStorage.setItem('ceka_theme', val)
      applyTheme()
    }
  }

  const setLanguage = (val) => {
    language.value = val
    if (process.client) {
      localStorage.setItem('ceka_language', val)
    }
  }

  const setCurrency = (val) => {
    currency.value = val
    if (process.client) {
      localStorage.setItem('ceka_currency', val)
    }
  }

  const applyTheme = () => {
    if (process.client) {
      if (theme.value === 'dark') {
        document.documentElement.classList.add('dark-theme')
      } else {
        document.documentElement.classList.remove('dark-theme')
      }
    }
  }

  // Translation helper
  const t = (key) => {
    const translations = {
      id: {
        settingsTitle: 'Pengaturan',
        back: 'Kembali',
        themeLabel: 'Tema Tampilan',
        themeDesc: 'Sesuaikan kenyamanan mata Anda',
        lightMode: 'Terang',
        darkMode: 'Gelap',
        langLabel: 'Bahasa Aplikasi',
        langDesc: 'Pilih bahasa antarmuka aplikasi',
        langId: 'Bahasa Indonesia',
        langEn: 'English',
        currLabel: 'Mata Uang Default',
        currDesc: 'Simbol mata uang untuk tagihan',
        saveBtn: 'Simpan Setelan',
        saveSuccess: 'Pengaturan berhasil disimpan!',
        // Dashboard
        unpaidBill: 'Tagihan Belum Selesai',
        waitingPayment: 'transaksi menunggu pembayaran',
        scanReceipt: 'Pindai Struk (AI)',
        inputManual: 'Input Manual',
        myFriends: 'Daftar Teman',
        viewAll: 'Lihat Semua',
        recentHistory: 'Riwayat Transaksi',
        friendLabel: 'Orang',
        noHistory: 'Belum ada riwayat transaksi patungan.',
        // Friends
        friendsTitle: 'Daftar Teman Patungan',
        searchFriend: 'Cari nama teman...',
        addFriendBtn: 'Tambah Teman Baru',
        editFriendTitle: 'Edit Profil Teman',
        nameLabel: 'Nama Lengkap / Panggilan',
        namePlaceholder: 'Masukkan nama teman...',
        phoneLabel: 'Nomor WhatsApp / HP',
        phonePlaceholder: 'Contoh: 0812XXXXXXXX',
        emailLabel: 'Email (Opsional)',
        emailPlaceholder: 'Contoh: budi@gmail.com',
        searchFriendEmpty: 'Nama teman tidak ditemukan.',
        cancel: 'Batal',
        save: 'Simpan',
        emptyFriends: 'Daftar teman kosong. Silakan tambahkan teman patungan baru!',
        deleteConfirm: 'Apakah Anda yakin ingin menghapus teman ini dari daftar patungan?',
        // Landing Page
        landingTitle: 'Bagi Tagihan Praktis,<br/>Hubungan Tetap Harmonis',
        landingSubtitle: 'Pindai struk belanja, bagi porsi patungan secara akurat, dan selesaikan tagihan tanpa selisih.',
        loginGoogle: 'Masuk dengan Google',
        featureScanTitle: 'Pindai Struk<br/>Secara Instan',
        featureTaxTitle: 'Hitung Pajak<br/>& Diskon Adil',
        featureSplitTitle: 'Bagi Tagihan<br/>Tanpa Ribet',
        // Scan Page
        scanTitle: 'Pindai Struk',
        scanHint: 'Posisikan struk belanja di dalam kotak area',
        ocrScanning: 'Mohon tunggu sebentar, AI sedang membaca struk Anda...',
        retryBtn: 'Coba Lagi',
        retakeBtn: 'Ambil Ulang',
        processBtn: 'Proses Struk',
        cameraError: 'Aduh, kamera nggak bisa diakses nih. Coba cek izin akses kameranya ya.',
        // History Page
        historyTitle: 'Riwayat Patungan',
        searchHistory: 'Cari transaksi...',
        historyCountTitle: 'Riwayat Tagihan',
        emptyHistorySearch: 'Transaksi tidak ditemukan. Silakan gunakan kata kunci lain.',
        emptyHistory: 'Belum ada riwayat patungan. Mulai buat tagihan pertama Anda!',
        editBillTitle: 'Edit Detail Tagihan',
        addBillTitle: 'Tambah Tagihan Baru',
        billNameLabel: 'Nama Acara / Tagihan',
        billAmountLabel: 'Total Tagihan',
        eventDateLabel: 'Tanggal Acara',
        peopleCountLabel: 'Jumlah Orang',
        eventCategoryLabel: 'Kategori Acara',
        catGeneral: 'Makan-Makan',
        catJunk: 'Fastfood / Pizza',
        catCafe: 'Nongki / Kopi',
        deleteHistoryConfirm: 'Apakah Anda yakin ingin menghapus riwayat transaksi ini?',
        splitBillTitle: 'Bagi Tagihan',
        fillBillNameAlert: 'Silakan isi nama acara terlebih dahulu.',
        fillBillDateAlert: 'Silakan pilih tanggal acara terlebih dahulu.',
        minOneItemAlert: 'Masukkan minimal 1 menu yang valid untuk menghitung.',
        membersTitle: 'Anggota Patungan',
        emptyMembers: 'Belum ada anggota yang dipilih. Tagihan akan ditanggung sendiri.',
        itemsTitle: 'Daftar Item / Menu',
        removeItem: 'Hapus Item',
        menuNameLabel: 'Nama Menu',
        menuPriceLabel: 'Harga Satuan',
        menuQtyLabel: 'Jumlah / Porsi',
        menuTotalLabel: 'Total Harga',
        portionAllocation: 'Alokasi Porsi',
        allocated: 'Teralokasi',
        of: 'dari',
        portions: 'porsi',
        addNewMenu: 'Tambah Menu Baru',
        taxDiscountTitle: 'Pajak, Diskon & Biaya Tambahan',
        discountLabel: 'Diskon / Promo',
        discountPercentLabel: 'Persen Diskon (%)',
        discountRupiahLabel: 'Rupiah Diskon',
        totalDiscount: 'Total Diskon',
        taxLabel: 'Pajak',
        taxPercentLabel: 'Persen Pajak (%)',
        taxRupiahLabel: 'Rupiah Pajak',
        totalTax: 'Total Pajak',
        otherFeesLabel: 'Biaya Tambahan (Ongkir, Layanan, dll.)',
        emptyFees: 'Belum ada biaya tambahan.',
        feeNameLabel: 'Keterangan Biaya',
        feeAmountLabel: 'Jumlah',
        totalBill: 'TOTAL TAGIHAN',
        saveBillBtn: 'Simpan Tagihan',
        selectFriends: 'Pilih Teman Patungan',
        participatingSubtitle: 'Pilih siapa saja yang ikut berpartisipasi',
        searchFriendPlaceholder: 'Cari nama teman...',
        doneBtn: 'Selesai',
        allocateItemTitle: 'Alokasi Item',
        menuText: 'Menu',
        qty: 'Qty',
        total: 'Total',
        autoSplit: 'Bagi Rata',
        emptyAssignFriends: 'Silakan pilih anggota patungan terlebih dahulu.',
        confirmCancelText: 'Apakah Anda yakin ingin membatalkan? Perubahan belum disimpan.',
        billNameLabelInput: 'Nama Acara / Tagihan',
        dateLabelInput: 'Tanggal Acara',
        categoryLabelInput: 'Kategori Tagihan',
        billDetailsTitle: 'Rincian Tagihan Baru',
        cancelBillConfirmTitle: 'Batalkan Pembagian Tagihan?',
        cancelBillConfirmText: 'Apakah Anda yakin ingin membatalkan? Semua draf data tagihan ini akan dihapus secara permanen.',
        yesCancel: 'Ya, Batalkan',
        goBack: 'Kembali'
      },
      en: {
        settingsTitle: 'Settings',
        back: 'Back',
        themeLabel: 'Display Theme',
        themeDesc: 'Adjust visual comfort for your eyes',
        lightMode: 'Light',
        darkMode: 'Dark',
        langLabel: 'App Language',
        langDesc: 'Choose interface language',
        langId: 'Indonesian',
        langEn: 'English',
        currLabel: 'Default Currency',
        currDesc: 'Currency symbol for your bills',
        saveBtn: 'Save Settings',
        saveSuccess: 'Settings saved successfully!',
        // Dashboard
        unpaidBill: 'Unpaid Bills',
        waitingPayment: 'transactions waiting for payment',
        scanReceipt: 'Scan Receipt (AI)',
        inputManual: 'Manual Input',
        myFriends: 'Friends List',
        viewAll: 'View All',
        recentHistory: 'Recent Transactions',
        friendLabel: 'People',
        noHistory: 'No shared bill history yet.',
        // Friends
        friendsTitle: 'Friends Directory',
        searchFriend: 'Search friends...',
        addFriendBtn: 'Add New Friend',
        editFriendTitle: 'Edit Friend Profile',
        nameLabel: 'Full / Nickname',
        namePlaceholder: 'Enter friend\'s name...',
        phoneLabel: 'WhatsApp / Phone Number',
        phonePlaceholder: 'Example: 0812XXXXXXXX',
        emailLabel: 'Email (Optional)',
        emailPlaceholder: 'Example: budi@gmail.com',
        searchFriendEmpty: 'Friend name not found.',
        cancel: 'Cancel',
        save: 'Save',
        emptyFriends: 'Friends list is empty. Please add a new friend!',
        deleteConfirm: 'Are you sure you want to delete this friend?',
        // Landing Page
        landingTitle: 'Split Bills Easily,<br/>Keep Friendships Warm',
        landingSubtitle: 'Scan your receipts, split portions accurately, and settle shares without any disputes.',
        loginGoogle: 'Sign in with Google',
        featureScanTitle: 'Scan Receipts<br/>Instantly',
        featureTaxTitle: 'Fair Tax<br/>& Discount',
        featureSplitTitle: 'Hassle-Free<br/>Split',
        // Scan Page
        scanTitle: 'Scan Receipt',
        scanHint: 'Position the receipt inside the viewfinder area',
        ocrScanning: 'Please wait, AI is scanning your receipt...',
        retryBtn: 'Retry',
        retakeBtn: 'Retake',
        processBtn: 'Process Receipt',
        cameraError: 'Oops, unable to access camera. Please check your camera permissions.',
        // History Page
        historyTitle: 'Shared History',
        searchHistory: 'Search transactions...',
        historyCountTitle: 'Bill History',
        emptyHistorySearch: 'No transactions found. Try another search keyword.',
        emptyHistory: 'No shared bill history yet. Create your first shared bill!',
        editBillTitle: 'Edit Bill Details',
        addBillTitle: 'Add New Bill',
        billNameLabel: 'Event / Bill Name',
        billAmountLabel: 'Total Bill',
        eventDateLabel: 'Event Date',
        peopleCountLabel: 'Number of People',
        eventCategoryLabel: 'Event Category',
        catGeneral: 'Dining',
        catJunk: 'Fastfood / Pizza',
        catCafe: 'Cafe & Coffee',
        deleteHistoryConfirm: 'Are you sure you want to delete this transaction history?',
        splitBillTitle: 'Split Bill',
        fillBillNameAlert: 'Please fill in the event name first.',
        fillBillDateAlert: 'Please select the event date first.',
        minOneItemAlert: 'Enter at least 1 valid menu to calculate.',
        membersTitle: 'Split Members',
        emptyMembers: 'No members selected. The bill will be split individually.',
        itemsTitle: 'Item / Menu List',
        removeItem: 'Delete Item',
        menuNameLabel: 'Menu Name',
        menuPriceLabel: 'Unit Price',
        menuQtyLabel: 'Qty / Portions',
        menuTotalLabel: 'Total Price',
        portionAllocation: 'Portion Allocation',
        allocated: 'Allocated',
        of: 'of',
        portions: 'portions',
        addNewMenu: 'Add New Menu',
        taxDiscountTitle: 'Tax, Discount & Fees',
        discountLabel: 'Discount / Promo',
        discountPercentLabel: 'Discount Percent (%)',
        discountRupiahLabel: 'Discount Amount',
        totalDiscount: 'Total Discount',
        taxLabel: 'Tax',
        taxPercentLabel: 'Tax Percent (%)',
        taxRupiahLabel: 'Tax Amount',
        totalTax: 'Total Tax',
        otherFeesLabel: 'Additional Fees (Delivery, Service, etc.)',
        emptyFees: 'No additional fees added yet.',
        feeNameLabel: 'Fee Description',
        feeAmountLabel: 'Amount',
        totalBill: 'TOTAL BILL',
        saveBillBtn: 'Save Bill',
        selectFriends: 'Select Split Friends',
        participatingSubtitle: 'Select who is participating in this bill',
        searchFriendPlaceholder: 'Search friends...',
        doneBtn: 'Done',
        allocateItemTitle: 'Portion Allocation',
        menuText: 'Menu',
        qty: 'Qty',
        total: 'Total',
        autoSplit: 'Auto Split',
        emptyAssignFriends: 'Please select split members first.',
        confirmCancelText: 'Are you sure you want to cancel? Unsaved changes will be lost.',
        billNameLabelInput: 'Event / Bill Name',
        dateLabelInput: 'Event Date',
        categoryLabelInput: 'Bill Category',
        billDetailsTitle: 'New Bill Details',
        cancelBillConfirmTitle: 'Cancel Bill Splitting?',
        cancelBillConfirmText: 'Are you sure you want to cancel? All draft data for this bill will be permanently deleted.',
        yesCancel: 'Yes, Cancel',
        goBack: 'Go Back'
      }
    }

    const lang = language.value === 'en' ? 'en' : 'id'
    return translations[lang][key] || key
  }

  return {
    theme,
    language,
    currency,
    loadSettings,
    setTheme,
    setLanguage,
    setCurrency,
    t
  }
}
