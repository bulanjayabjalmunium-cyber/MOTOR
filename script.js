// INISIALISASI INDEXEDDB DENGAN DEXIE.JS
const db = new Dexie("MinimarketPOSDB");
db.version(1).stores({
    produk: '++id, nama, modal, jual, stok',
    transaksi: '++id, waktu, waktuIso, waktuFormatted, detail, totalOmset, totalLaba',
    restock: '++id, waktuFormatted, namaBarang, jumlahMasuk, stokAkhir'
});

// KAMUS MULTI-BAHASA
let bahasaAktif = localStorage.getItem('pos_bahasa') || 'id';

const kamus = {
    id: {
        omsetHarian: "Omset Harian",
        bersihHarian: "Bersih Harian (Laba)",
        omsetBulanan: "Omset Bulanan",
        bersihBulanan: "Bersih Bulanan (Laba)",
        omsetTotal: "Total Omset Seluruhnya (Sejak Toko Buka)",
        labaTotal: "Total Keuntungan Bersih Seluruhnya",
        navDashboard: "Dashboard & Laporan",
        navStok: "Stok & Input Barang",
        navKasir: "Kasir (PAYMENT)",
        navRiwayat: "Riwayat Transaksi",
        keluar: "Keluar",
        simpanProduk: "Simpan / Restock",
        katalog: "Katalog Produk",
        keranjang: "Keranjang Kasir",
        bayar: "Bayar & Cetak Nota",
        mataUang: "Rp",
        tabelWaktu: "Waktu Transaksi",
        tabelDetail: "Detail Belanja",
        tabelOmset: "Total Omset",
        tabelLaba: "Laba Bersih",
        totalKeseluruhan: "Total Keseluruhan:",
        judulInputStok: "Input Barang Baru / Restock",
        placeholderNama: "Nama Barang",
        placeholderModal: "Harga Modal",
        placeholderJual: "Harga Jual",
        placeholderStok: "Jumlah Stok",
        peringatanStok: "Peringatan Stok Menipis (< 5 pcs)",
        stokAman: "Semua stok barang aman.",
        labelSisa: "Sisa",
        placeholderCari: "Cari nama barang..."
    },
    en: {
        omsetHarian: "Daily Turnover",
        bersihHarian: "Daily Net Profit",
        omsetBulanan: "Monthly Turnover",
        bersihBulanan: "Monthly Net Profit",
        omsetTotal: "Total Lifetime Turnover",
        labaTotal: "Total Lifetime Net Profit",
        navDashboard: "Dashboard & Reports",
        navStok: "Stock & Inventory",
        navKasir: "Cashier (POS)",
        navRiwayat: "Transaction History",
        keluar: "Logout",
        simpanProduk: "Save / Restock",
        katalog: "Product Catalog",
        keranjang: "Cart",
        bayar: "Pay & Print Receipt",
        mataUang: "$",
        tabelWaktu: "Transaction Time",
        tabelDetail: "Shopping Details",
        tabelOmset: "Total Turnover",
        tabelLaba: "Net Profit",
        totalKeseluruhan: "Grand Total:",
        judulInputStok: "New Item Input / Restock",
        placeholderNama: "Item Name",
        placeholderModal: "Cost Price",
        placeholderJual: "Selling Price",
        placeholderStok: "Stock Quantity",
        peringatanStok: "Low Stock Warning (< 5 pcs)",
        stokAman: "All stock items are safe.",
        labelSisa: "Left",
        placeholderCari: "Search item name..."
    },
    zh: {
        omsetHarian: "每日营业额",
        bersihHarian: "每日净利润",
        omsetBulanan: "每月营业额",
        bersihBulanan: "每月净利润",
        omsetTotal: "总营业额（开店以来）",
        labaTotal: "总净利润",
        navDashboard: "仪表盘与报告",
        navStok: "库存与商品",
        navKasir: "收银台 (POS)",
        navRiwayat: "交易历史",
        keluar: "登出",
        simpanProduk: "保存 / 补货",
        katalog: "商品目录",
        keranjang: "购物车",
        bayar: "付款并打印收据",
        mataUang: "NT$",
        tabelWaktu: "交易时间",
        tabelDetail: "购物详情",
        tabelOmset: "总营业额",
        tabelLaba: "净利润",
        totalKeseluruhan: "总计:",
        judulInputStok: "新商品录入 / 补货",
        placeholderNama: "商品名称",
        placeholderModal: "成本价",
        placeholderJual: "售价",
        placeholderStok: "库存数量",
        peringatanStok: "低库存警告 (< 5 件)",
        stokAman: "所有商品库存充足。",
        labelSisa: "剩余",
        placeholderCari: "搜索商品名称..."
    }
};

let produkList = [];
let riwayatTransaksi = [];
let riwayatRestock = [];
let keranjang = [];

function getLocalDateString(dateObj = new Date()) {
    let year = dateObj.getFullYear();
    let month = String(dateObj.getMonth() + 1).padStart(2, '0');
    let day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// MEMATIKAN SEED DATA JIKA DB SUDAH TERISI
async function muatDataDariDB() {
    // Database kosong dibiarkan kosong; produk ditambahkan oleh pemilik toko.
    produkList = await db.produk.toArray();
    // Kompatibilitas data lama: jika belum ada harga grosir, gunakan harga eceran sampai diubah.
    produkList.forEach(p => { if (p.grosir == null) p.grosir = p.jual; });
    riwayatTransaksi = await db.transaksi.reverse().toArray();
    riwayatRestock = await db.restock.reverse().toArray();

    perbaruiTampilanBahasa();
    resetFilterLaporanTanggal();
}

// INITIAL LOAD DATA
document.addEventListener('DOMContentLoaded', () => {
    muatDataDariDB();
});

function formatMataUang(angka) {
    let simbol = kamus[bahasaAktif].mataUang;
    let locale = bahasaAktif === 'en' ? 'en-US' : (bahasaAktif === 'zh' ? 'zh-TW' : 'id-ID');
    return `${simbol} ${angka.toLocaleString(locale)}`;
}

function togglePasswordLogin() {
    let inputPass = document.getElementById('input-pass');
    let iconPass = document.getElementById('icon-toggle-pass');

    if (inputPass.type === "password") {
        inputPass.type = "text";
        iconPass.classList.remove("fa-eye");
        iconPass.classList.add("fa-eye-slash");
    } else {
        inputPass.type = "password";
        iconPass.classList.remove("fa-eye-slash");
        iconPass.classList.add("fa-eye");
    }
}

function ubahBahasa(lang) {
    bahasaAktif = lang;
    localStorage.setItem('pos_bahasa', lang);
    perbaruiTampilanBahasa();
}

function perbaruiTampilanBahasa() {
    let t = kamus[bahasaAktif];
    
    if(document.getElementById('stat-label-omset-harian')) document.getElementById('stat-label-omset-harian').innerText = t.omsetHarian;
    if(document.getElementById('stat-label-laba-harian')) document.getElementById('stat-label-laba-harian').innerText = t.bersihHarian;
    if(document.getElementById('stat-label-omset-bulanan')) document.getElementById('stat-label-omset-bulanan').innerText = t.omsetBulanan;
    if(document.getElementById('stat-label-laba-bulanan')) document.getElementById('stat-label-laba-bulanan').innerText = t.bersihBulanan;
    if(document.getElementById('stat-label-omset-total')) document.getElementById('stat-label-omset-total').innerText = t.omsetTotal;
    if(document.getElementById('stat-label-laba-total')) document.getElementById('stat-label-laba-total').innerText = t.labaTotal;

    if(document.getElementById('text-nav-dashboard')) document.getElementById('text-nav-dashboard').innerText = t.navDashboard;
    if(document.getElementById('text-nav-stok')) document.getElementById('text-nav-stok').innerText = t.navStok;
    if(document.getElementById('text-nav-kasir')) document.getElementById('text-nav-kasir').innerText = t.navKasir;
    if(document.getElementById('text-nav-riwayat')) document.getElementById('text-nav-riwayat').innerText = t.navRiwayat;
    if(document.getElementById('text-nav-keluar')) document.getElementById('text-nav-keluar').innerText = t.keluar;

    if(document.getElementById('btn-simpan-produk')) document.getElementById('btn-simpan-produk').innerText = t.simpanProduk;
    if(document.getElementById('title-katalog')) document.getElementById('title-katalog').innerText = t.katalog;
    if(document.getElementById('title-keranjang')) document.getElementById('title-keranjang').innerText = t.keranjang;
    if(document.getElementById('btn-bayar-cetak')) document.getElementById('btn-bayar-cetak').innerText = t.bayar;

    if(document.getElementById('label-total')) document.getElementById('label-total').innerText = (bahasaAktif === 'zh') ? '總計:' : 'Total:';
    if(document.getElementById('label-uang-bayar')) document.getElementById('label-uang-bayar').innerText = (bahasaAktif === 'en') ? 'Amount Paid' : (bahasaAktif === 'zh') ? '实付金额' : 'Uang Dibayar';
    if(document.getElementById('label-kembalian')) document.getElementById('label-kembalian').innerText = (bahasaAktif === 'en') ? 'Change:' : (bahasaAktif === 'zh') ? '找零:' : 'Kembalian:';

    if(document.getElementById('title-input-stok')) document.getElementById('title-input-stok').innerText = t.judulInputStok;
    if(document.getElementById('form-nama')) document.getElementById('form-nama').placeholder = t.placeholderNama;
    if(document.getElementById('form-modal')) document.getElementById('form-modal').placeholder = t.placeholderModal;
    if(document.getElementById('form-jual')) document.getElementById('form-jual').placeholder = t.placeholderJual;
    if(document.getElementById('form-stok')) document.getElementById('form-stok').placeholder = t.placeholderStok;

    if(document.getElementById('title-peringatan-stok')) document.getElementById('title-peringatan-stok').innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-2"></i> ${t.peringatanStok}`;
    if(document.getElementById('input-cari-produk')) document.getElementById('input-cari-produk').placeholder = t.placeholderCari;

    if(document.getElementById('th-waktu')) document.getElementById('th-waktu').innerText = t.tabelWaktu;
    if(document.getElementById('th-detail')) document.getElementById('th-detail').innerText = t.tabelDetail;
    if(document.getElementById('th-omset')) document.getElementById('th-omset').innerText = t.tabelOmset;
    if(document.getElementById('th-laba')) document.getElementById('th-laba').innerText = t.tabelLaba;

    muatDashboard();
    muatLaporanBerdasarkanTanggal();
    muatTabelStok();
    muatTabelRiwayatRestock();
    muatGridKasir();
    renderKeranjang();
    muatTabelRiwayat();
}

function ambilKredensialAdmin() {
    return {
        user: localStorage.getItem('pos_admin_user') || 'admin',
        pass: localStorage.getItem('pos_admin_pass') || btoa('12345')
    };
}

function verifikasiPasswordAdmin(password) {
    const kredensial = ambilKredensialAdmin();
    return btoa(String(password)) === kredensial.pass;
}

function prosesLogin() {
    let user = document.getElementById('input-user').value.trim();
    let pass = document.getElementById('input-pass').value;
    const kredensial = ambilKredensialAdmin();

    if (user === kredensial.user && verifikasiPasswordAdmin(pass)) {
        document.getElementById('view-login').classList.add('hidden');
        document.getElementById('view-app').classList.remove('hidden');
        
        let selectLang = document.getElementById('pilihan-bahasa');
        if(selectLang) selectLang.value = bahasaAktif;

        perbaruiTampilanBahasa();
    } else {
        alert("ID Pengguna atau Password salah!");
    }
}

function logout() {
    document.getElementById('input-user').value = '';
    document.getElementById('input-pass').value = '';
    
    let inputPass = document.getElementById('input-pass');
    let iconPass = document.getElementById('icon-toggle-pass');
    inputPass.type = "password";
    iconPass.classList.remove("fa-eye-slash");
    iconPass.classList.add("fa-eye");

    document.getElementById('view-app').classList.add('hidden');
    document.getElementById('view-login').classList.remove('hidden');
}

function gantiMenu(menu) {
    document.querySelectorAll('[id^="section-"]').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(el => {
        el.classList.remove('bg-blue-600', 'text-white');
        el.classList.add('text-gray-300', 'hover:bg-slate-800');
    });

    document.getElementById(`section-${menu}`).classList.remove('hidden');
    const judul = document.getElementById('judul-halaman');
    if (judul) judul.innerText = ({ dashboard: 'Dashboard & Laporan', stok: 'Stok & Input Barang', kasir: 'Kasir', riwayat: 'Riwayat Transaksi', pengaturan: 'Pengaturan Sistem' })[menu] || menu;
    let btnAktif = document.getElementById(`nav-${menu}`);
    if(btnAktif) {
        btnAktif.classList.add('bg-blue-600', 'text-white');
        btnAktif.classList.remove('text-gray-300', 'hover:bg-slate-800');
    }
    if (menu === 'dashboard') muatLaporanBerdasarkanTanggal();
    if (menu === 'riwayat') muatTabelRiwayat();
}

function resetFilterLaporanTanggal() {
    let hariIni = getLocalDateString(new Date());
    let mulai = document.getElementById('laporan-tanggal-mulai');
    let akhir = document.getElementById('laporan-tanggal-akhir');
    let kanal = document.getElementById('laporan-filter-kanal');
    if (mulai) mulai.value = hariIni;
    if (akhir) akhir.value = hariIni;
    if (kanal) kanal.value = 'semua';
    muatLaporanBerdasarkanTanggal();
}

function muatLaporanBerdasarkanTanggal() {
    let mulai = document.getElementById('laporan-tanggal-mulai')?.value || '';
    let akhir = document.getElementById('laporan-tanggal-akhir')?.value || '';
    let kanalFilter = document.getElementById('laporan-filter-kanal')?.value || 'semua';
    let tbody = document.getElementById('tabel-laporan-tanggal');
    if (!tbody) return;

    if (mulai && akhir && mulai > akhir) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-500">Tanggal awal tidak boleh melewati tanggal akhir.</td></tr>';
        document.getElementById('laporan-filter-jumlah').innerText = '0';
        document.getElementById('laporan-filter-omzet').innerText = formatMataUang(0);
        document.getElementById('laporan-filter-laba').innerText = formatMataUang(0);
        document.getElementById('laporan-rentang-info').innerText = 'Periksa kembali rentang tanggal.';
        return;
    }

    let hasil = riwayatTransaksi.filter(trx => {
        let tanggal = trx.waktuIso || getLocalDateString(new Date(trx.waktu));
        let cocokMulai = !mulai || tanggal >= mulai;
        let cocokAkhir = !akhir || tanggal <= akhir;
        let kanal = trx.kanalPenjualan || 'langsung';
        return cocokMulai && cocokAkhir && (kanalFilter === 'semua' || kanal === kanalFilter);
    });

    let omzet = hasil.reduce((sum, trx) => sum + (Number(trx.totalOmset) || 0), 0);
    let laba = hasil.reduce((sum, trx) => sum + (Number(trx.totalLaba) || 0), 0);
    document.getElementById('laporan-filter-jumlah').innerText = hasil.length.toLocaleString('id-ID');
    document.getElementById('laporan-filter-omzet').innerText = formatMataUang(omzet);
    document.getElementById('laporan-filter-laba').innerText = formatMataUang(laba);
    document.getElementById('laporan-rentang-info').innerText = `Menampilkan ${hasil.length} transaksi dari ${mulai || 'awal data'} sampai ${akhir || 'hari ini'}${kanalFilter === 'semua' ? '' : (kanalFilter === 'shopee' ? ' • Shopee' : ' • Penjualan Langsung')}.`;

    if (hasil.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-400">Tidak ada transaksi pada filter tanggal/kanal ini.</td></tr>';
        return;
    }

    tbody.innerHTML = hasil.map(trx => {
        let kanal = trx.kanalPenjualan || 'langsung';
        let detail = trx.items?.length
            ? trx.items.map(item => `${item.nama} (${item.qty}x - ${item.jenisHarga || 'eceran'})`).join(', ')
            : (trx.detail || '-');
        let tanggalWaktu = trx.waktuFormatted || new Date(trx.waktu).toLocaleString('id-ID');
        return `<tr class="border-b hover:bg-gray-50 align-top">
            <td class="p-3 text-xs text-gray-600 whitespace-nowrap">${tanggalWaktu}</td>
            <td class="p-3"><span class="px-2 py-1 rounded text-xs font-semibold ${kanal === 'shopee' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}">${kanal === 'shopee' ? 'Shopee' : 'Langsung'}</span></td>
            <td class="p-3 text-xs text-gray-700">${detail}</td>
            <td class="p-3 text-xs">${formatMataUang(Number(trx.biayaShopee) || 0)}</td>
            <td class="p-3 font-semibold text-gray-800 whitespace-nowrap">${formatMataUang(Number(trx.totalOmset) || 0)}</td>
            <td class="p-3 font-semibold text-emerald-700 whitespace-nowrap">${formatMataUang(Number(trx.totalLaba) || 0)}</td>
        </tr>`;
    }).join('');
}

function muatDashboard() {
    let tglSekarang = getLocalDateString(new Date()); 
    let blnSekarang = tglSekarang.slice(0, 7);

    let omsetHarian = 0, labaHarian = 0;
    let omsetBulanan = 0, labaBulanan = 0;
    let omsetTotal = 0, labaTotal = 0;

    riwayatTransaksi.forEach(trx => {
        let tglTrx = trx.waktuIso ? trx.waktuIso : getLocalDateString(new Date(trx.waktu));
        let blnTrx = tglTrx.slice(0, 7);

        omsetTotal += trx.totalOmset;
        labaTotal += trx.totalLaba;

        if (blnTrx === blnSekarang) {
            omsetBulanan += trx.totalOmset;
            labaBulanan += trx.totalLaba;
        }

        if (tglTrx === tglSekarang) {
            omsetHarian += trx.totalOmset;
            labaHarian += trx.totalLaba;
        }
    });

    document.getElementById('stat-omset-harian').innerText = formatMataUang(omsetHarian);
    document.getElementById('stat-laba-harian').innerText = formatMataUang(labaHarian);
    document.getElementById('stat-omset-bulanan').innerText = formatMataUang(omsetBulanan);
    document.getElementById('stat-laba-bulanan').innerText = formatMataUang(labaBulanan);
    document.getElementById('stat-omset-total').innerText = formatMataUang(omsetTotal);
    document.getElementById('stat-laba-total').innerText = formatMataUang(labaTotal);

    let containerStokTipis = document.getElementById('list-stok-menipis');
    let t = kamus[bahasaAktif];
    if(containerStokTipis) {
        let produkTipis = produkList.filter(p => p.stok < 5);
        if(produkTipis.length === 0) {
            containerStokTipis.innerHTML = `<p class="text-emerald-700 font-medium">${t.stokAman}</p>`;
        } else {
            containerStokTipis.innerHTML = produkTipis.map(p => `<span class="inline-block bg-red-100 text-red-700 px-2.5 py-1 rounded-md font-bold mr-2 mb-1">${p.nama} (${t.labelSisa}: ${p.stok})</span>`).join('');
        }
    }
}

function muatTabelStok() {
    let tbody = document.getElementById('tabel-stok-body');
    if(!tbody) return;

    if (produkList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-400">Belum ada data barang.</td></tr>`;
        return;
    }

    tbody.innerHTML = produkList.map((p) => {
        let statusStokWarna = p.stok < 5 ? "text-red-600 font-extrabold" : "text-blue-600 font-bold";
        let hargaGrosir = Number(p.grosir ?? p.jual ?? 0);
        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3 font-semibold text-gray-800">${p.nama}</td>
                <td class="p-3 text-gray-600">${formatMataUang(p.modal)}</td>
                <td class="p-3 text-gray-600">${formatMataUang(hargaGrosir)}</td>
                <td class="p-3 text-gray-600">${formatMataUang(p.jual)}</td>
                <td class="p-3 ${statusStokWarna}">${p.stok} pcs</td>
                <td class="p-3 text-center space-x-1">
                    <button onclick="tambahStokLangsung(${p.id})" class="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer">
                        <i class="fa-solid fa-plus-minus mr-1"></i> Restock / Koreksi
                    </button>
                    <button onclick="hapusProdukDenganSandi(${p.id})" class="bg-red-100 hover:bg-red-200 text-red-600 px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer">
                        <i class="fa-solid fa-trash mr-1"></i> Hapus
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function tambahStokLangsung(id) {
    let produk = produkList.find(p => p.id === id);
    if(!produk) return;

    let inputKoreksi = prompt(
        `KOREKSI / PENYESUAIAN STOK:\n` +
        `Nama: ${produk.nama}\n` +
        `Stok Saat Ini: ${produk.stok} pcs\n\n` +
        `Masukkan jumlah perubahan:\n` +
        `• Ketik angka positif untuk tambah (Contoh: 10)\n` +
        `• Ketik tanda minus untuk kurang (Contoh: -5)`
    );
    
    if (inputKoreksi === null) return;
    
    let jumlah = parseInt(inputKoreksi);
    if (isNaN(jumlah) || jumlah === 0) {
        alert("Masukkan angka yang valid (tidak boleh nol)!");
        return;
    }

    if (produk.stok + jumlah < 0) {
        alert("Gagal! Stok akhir tidak boleh menjadi minus (kurang dari 0).");
        return;
    }

    let jenisPerubahan = jumlah > 0 ? "Penambahan (Restock)" : "Pengurangan (Koreksi)";
    produk.stok += jumlah;

    await db.produk.update(id, { stok: produk.stok });

    let restockData = {
        waktuFormatted: new Date().toLocaleString('id-ID'),
        namaBarang: produk.nama,
        jumlahMasuk: jumlah,
        stokAkhir: produk.stok
    };

    await db.restock.add(restockData);
    riwayatRestock.unshift(restockData);

    muatTabelStok();
    muatTabelRiwayatRestock();
    muatGridKasir();
    muatDashboard();

    alert(`${jenisPerubahan} berhasil! Stok "${produk.nama}" sekarang menjadi: ${produk.stok} pcs.`);
}

async function hapusProdukDenganSandi(id) {
    let sandiInput = prompt("Masukkan password administrator untuk menghapus produk:");
    if (sandiInput === null) return;
    if (!verifikasiPasswordAdmin(sandiInput)) {
        alert("Password salah! Penghapusan dibatalkan.");
        return;
    }
    const produk = produkList.find(p => p.id === id);
    if (!produk) { alert("Produk tidak ditemukan."); return; }
    if (!confirm(`Yakin ingin menghapus produk "${produk.nama}"?`)) return;

    await db.produk.delete(id);
    produkList = produkList.filter(p => p.id !== id);
    keranjang = keranjang.filter(item => item.id !== id && item.nama !== produk.nama);
    muatTabelStok();
    muatGridKasir();
    renderKeranjang();
    muatDashboard();
    alert(`Produk "${produk.nama}" berhasil dihapus.`);
}

function simpanKredensialAdmin() {
    const lama = document.getElementById('pengaturan-pass-lama').value;
    const userBaru = document.getElementById('pengaturan-user-baru').value.trim();
    const passBaru = document.getElementById('pengaturan-pass-baru').value;
    const konfirmasi = document.getElementById('pengaturan-pass-konfirmasi').value;
    if (!verifikasiPasswordAdmin(lama)) { alert('Password lama tidak benar.'); return; }
    if (!userBaru) { alert('ID administrator tidak boleh kosong.'); return; }
    if (passBaru.length < 5) { alert('Password baru minimal 5 karakter.'); return; }
    if (passBaru !== konfirmasi) { alert('Konfirmasi password baru tidak cocok.'); return; }
    localStorage.setItem('pos_admin_user', userBaru);
    localStorage.setItem('pos_admin_pass', btoa(passBaru));
    ['pengaturan-pass-lama','pengaturan-pass-baru','pengaturan-pass-konfirmasi'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('pengaturan-user-baru').value = userBaru;
    alert('ID dan password administrator berhasil diganti. Gunakan data baru saat login berikutnya.');
}

async function resetSeluruhSistem() {
    const sandi = prompt('Masukkan password administrator untuk reset seluruh sistem:');
    if (sandi === null) return;
    if (!verifikasiPasswordAdmin(sandi)) { alert('Password salah. Reset dibatalkan.'); return; }
    const konfirmasi = prompt('PERINGATAN: Semua produk, stok, restock, dan transaksi akan dihapus permanen. Ketik RESET untuk melanjutkan:');
    if (konfirmasi !== 'RESET') { alert('Reset dibatalkan.'); return; }
    await db.transaction('rw', db.produk, db.transaksi, db.restock, async () => {
        await db.produk.clear();
        await db.transaksi.clear();
        await db.restock.clear();
    });
    produkList = [];
    riwayatTransaksi = [];
    riwayatRestock = [];
    keranjang = [];
    muatTabelStok();
    muatGridKasir();
    renderKeranjang();
    muatTabelRiwayat();
    muatTabelRiwayatRestock();
    muatDashboard();
    muatLaporanBerdasarkanTanggal();
    alert('Reset selesai. Semua data produk dan transaksi telah dikosongkan. ID dan password administrator tetap tersimpan.');
}

async function tambahProdukBaru() {
    let nama = document.getElementById('form-nama').value.trim();
    let modal = parseFloat(document.getElementById('form-modal').value);
    let grosir = parseFloat(document.getElementById('form-grosir').value);
    let jual = parseFloat(document.getElementById('form-jual').value);
    let stok = parseInt(document.getElementById('form-stok').value);

    if (!nama || isNaN(modal) || isNaN(grosir) || isNaN(jual) || isNaN(stok) || modal < 0 || grosir < 0 || jual < 0 || stok < 0) {
        alert("Semua kolom harga modal, grosir, eceran, dan stok harus diisi dengan angka valid!");
        return;
    }

    let produkAda = produkList.find(p => p.nama.toLowerCase() === nama.toLowerCase());

    if (produkAda) {
        produkAda.stok += stok;
        produkAda.modal = modal;
        produkAda.grosir = grosir;
        produkAda.jual = jual;

        await db.produk.update(produkAda.id, { stok: produkAda.stok, modal, grosir, jual });

        let restockData = {
            waktuFormatted: new Date().toLocaleString('id-ID'),
            namaBarang: produkAda.nama,
            jumlahMasuk: stok,
            stokAkhir: produkAda.stok
        };
        await db.restock.add(restockData);
        riwayatRestock.unshift(restockData);

        alert(`Barang "${produkAda.nama}" sudah ada. Stok berhasil ditambahkan sebanyak +${stok} pcs!`);
    } else {
        let newId = await db.produk.add({ nama, modal, grosir, jual, stok });
        produkList.push({ id: newId, nama, modal, grosir, jual, stok });

        let restockData = {
            waktuFormatted: new Date().toLocaleString('id-ID'),
            namaBarang: nama,
            jumlahMasuk: stok,
            stokAkhir: stok
        };
        await db.restock.add(restockData);
        riwayatRestock.unshift(restockData);

        alert(`Produk baru "${nama}" berhasil ditambahkan!`);
    }

    muatTabelStok();
    muatTabelRiwayatRestock();
    muatGridKasir();
    muatDashboard();

    document.getElementById('form-nama').value = '';
    document.getElementById('form-modal').value = '';
    document.getElementById('form-grosir').value = '';
    document.getElementById('form-jual').value = '';
    document.getElementById('form-stok').value = '';
}

function escapeHTMLRiwayat(value) {
    return String(value ?? '').replace(/[&<>\"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
}

// Menampilkan transaksi tersimpan dari IndexedDB ke menu Riwayat Transaksi.
function muatTabelRiwayat() {
    const tbody = document.getElementById('tabel-riwayat-body');
    if (!tbody) return;

    if (!Array.isArray(riwayatTransaksi) || riwayatTransaksi.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400">Belum ada riwayat transaksi. Transaksi akan muncul setelah pembayaran berhasil disimpan.</td></tr>';
        return;
    }

    tbody.innerHTML = riwayatTransaksi.map(trx => {
        const waktu = trx.waktuFormatted || (trx.waktu ? new Date(trx.waktu).toLocaleString('id-ID') : '-');
        const kanal = trx.kanalPenjualan === 'shopee' ? 'Shopee' : 'Penjualan Langsung';
        const detail = trx.items?.length
            ? trx.items.map(item => `${escapeHTMLRiwayat(item.nama)} (${Number(item.qty) || 0}x - ${escapeHTMLRiwayat(item.jenisHarga || 'eceran')})`).join('<br>')
            : escapeHTMLRiwayat(trx.detail || '-');
        const omzet = Number(trx.totalOmset) || 0;
        const laba = Number(trx.totalLaba) || 0;
        return `<tr class="border-b hover:bg-gray-50 align-top">
            <td class="p-3 text-xs text-gray-600 whitespace-nowrap">${escapeHTMLRiwayat(waktu)}<br><span class="inline-block mt-1 px-2 py-0.5 rounded ${trx.kanalPenjualan === 'shopee' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}">${kanal}</span></td>
            <td class="p-3 text-xs text-gray-700">${detail}</td>
            <td class="p-3 text-xs font-semibold whitespace-nowrap">${formatMataUang(omzet)}</td>
            <td class="p-3 text-xs font-semibold text-emerald-700 whitespace-nowrap">${formatMataUang(laba)}</td>
        </tr>`;
    }).join('');
}

function muatTabelRiwayatRestock() {
    let tbody = document.getElementById('tabel-riwayat-restock-body');
    if(!tbody) return;

    if (riwayatRestock.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-gray-400">Belum ada riwayat penambahan stok.</td></tr>`;
        return;
    }

    tbody.innerHTML = riwayatRestock.map(item => {
        let warnaJumlah = item.jumlahMasuk > 0 ? "text-emerald-600 font-bold" : "text-red-600 font-bold";
        let teksJumlah = item.jumlahMasuk > 0 ? `+${item.jumlahMasuk} pcs` : `${item.jumlahMasuk} pcs`;

        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3 text-gray-600 font-mono text-xs">${item.waktuFormatted}</td>
                <td class="p-3 font-semibold text-gray-800">${item.namaBarang}</td>
                <td class="p-3 ${warnaJumlah}">${teksJumlah}</td>
                <td class="p-3 text-gray-700">${item.stokAkhir} pcs</td>
            </tr>
        `;
    }).join('');
}

function muatGridKasir() {
    let grid = document.getElementById('grid-produk-kasir');
    if(!grid) return;

    let keyword = document.getElementById('input-cari-produk') ? document.getElementById('input-cari-produk').value.toLowerCase() : "";
    let produkFiltered = produkList.filter(p => p.nama.toLowerCase().includes(keyword));

    if (produkFiltered.length === 0) {
        grid.innerHTML = `<p class="col-span-3 text-center text-gray-400 py-8">Produk tidak ditemukan.</p>`;
        return;
    }

    grid.innerHTML = produkFiltered.map((p) => {
        return `
            <div onclick="tambahKeKeranjang(${p.id})" class="bg-white p-4 rounded-lg shadow-xs border border-gray-200 hover:border-blue-500 cursor-pointer transition flex flex-col justify-between">
                <div>
                    <h4 class="font-bold text-gray-800 text-sm">${p.nama}</h4>
                    <p class="text-xs text-gray-500 mt-1">Stok: ${p.stok}</p>
                </div>
                <div class="mt-3 flex justify-between items-center">
                    <span class="text-blue-600 font-bold text-xs">Eceran ${formatMataUang(p.jual)}<br><span class="text-emerald-600">Grosir ${formatMataUang(p.grosir ?? p.jual)}</span></span>
                    <span class="bg-blue-50 text-blue-600 p-1.5 rounded-full text-xs"><i class="fa-solid fa-plus"></i></span>
                </div>
            </div>
        `;
    }).join('');
}

function tambahKeKeranjang(id) {
    bunyiBeep();
    let produk = produkList.find(p => p.id === id);
    if (!produk || produk.stok <= 0) {
        alert("Stok barang habis!");
        return;
    }

    let itemAda = keranjang.find(item => item.id === id);
    if (itemAda) {
        if (itemAda.qty < produk.stok) itemAda.qty++;
        else alert("Jumlah melebihi stok tersedia!");
    } else {
        keranjang.push({
            id: produk.id,
            nama: produk.nama,
            harga: Number(produk.jual || 0),
            jenisHarga: "eceran",
            modal: Number(produk.modal || 0),
            qty: 1
        });
    }
    renderKeranjang();
}

function ubahJenisHargaKeranjang(idx, jenis) {
    let item = keranjang[idx];
    if (!item) return;
    let produk = produkList.find(p => p.id === item.id);
    if (!produk) return;
    item.jenisHarga = jenis;
    item.harga = jenis === "grosir"
        ? Number(produk.grosir ?? produk.jual ?? 0)
        : Number(produk.jual || 0);
    renderKeranjang();
}

function renderKeranjang() {
    let list = document.getElementById('list-keranjang');
    if(!list) return;

    if (keranjang.length === 0) {
        list.innerHTML = `<p class="text-gray-400 text-center mt-12">Belum ada item dipilih</p>`;
        document.getElementById('kasir-total-harga').innerText = formatMataUang(0);
        hitungKembalian();
        return;
    }

    list.innerHTML = keranjang.map((item, idx) => {
        let subtotal = item.harga * item.qty;
        return `
            <div class="bg-gray-50 p-2 rounded border space-y-1">
                <div class="flex justify-between items-start gap-2">
                    <div class="min-w-0">
                        <h5 class="font-semibold text-gray-800">${item.nama}</h5>
                        <p class="text-[11px] text-gray-500">${item.qty} x ${formatMataUang(item.harga)}</p>
                    </div>
                    <span class="font-bold text-sm whitespace-nowrap">${formatMataUang(subtotal)}</span>
                </div>
                <div class="flex justify-between items-center gap-2">
                    <select onchange="ubahJenisHargaKeranjang(${idx}, this.value)" class="border rounded px-2 py-1 text-xs bg-white">
                        <option value="eceran" ${item.jenisHarga === "eceran" ? "selected" : ""}>Harga Eceran</option>
                        <option value="grosir" ${item.jenisHarga === "grosir" ? "selected" : ""}>Harga Grosir</option>
                    </select>
                    <div class="flex items-center gap-2">
                        <button onclick="ubahQtyKeranjang(${idx}, -1)" class="text-gray-500 hover:text-red-600 px-1 cursor-pointer"><i class="fa-solid fa-minus"></i></button>
                        <button onclick="ubahQtyKeranjang(${idx}, 1)" class="text-gray-500 hover:text-blue-600 px-1 cursor-pointer"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    hitungKembalian();
}

function ubahQtyKeranjang(idx, delta) {
    let item = keranjang[idx];
    if (!item) return;

    let produk = produkList.find(p => p.id === item.id);
    let stokTersedia = produk ? produk.stok : item.qty;
    item.qty += delta;

    if (item.qty > stokTersedia) {
        item.qty = stokTersedia;
        alert("Stok tidak mencukupi!");
    }
    if (item.qty <= 0) keranjang.splice(idx, 1);
    renderKeranjang();
}

function ubahKanalPenjualan() {
    let kanal = document.getElementById('kasir-kanal')?.value || 'langsung';
    let areaBiaya = document.getElementById('area-biaya-shopee');
    if (areaBiaya) areaBiaya.classList.toggle('hidden', kanal !== 'shopee');
    hitungKembalian();
}

function hitungTotalAkhir() {
    let totalAkhir = keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    return { subtotal: totalAkhir, diskon: 0, totalAkhir };
}

function hitungKembalian() {
    let { totalAkhir } = hitungTotalAkhir();
    let bayar = parseFloat(document.getElementById('input-uang-bayar')?.value) || 0;
    let kembalian = bayar - totalAkhir;
    let totalEl = document.getElementById('kasir-total-harga');
    let kembaliEl = document.getElementById('kasir-uang-kembalian');
    if (totalEl) totalEl.innerText = formatMataUang(totalAkhir);
    if (kembaliEl) kembaliEl.innerText = formatMataUang(kembalian >= 0 ? kembalian : 0);
}

async function prosesPembayaranKasir() {
    if (keranjang.length === 0) {
        alert("Keranjang masih kosong!");
        return;
    }

    let { totalAkhir } = hitungTotalAkhir();
    let totalModal = keranjang.reduce((sum, item) => sum + (item.modal * item.qty), 0);
    let kanal = document.getElementById('kasir-kanal')?.value || 'langsung';
    let biayaShopee = kanal === 'shopee'
        ? Math.max(0, Number(document.getElementById('input-biaya-shopee')?.value) || 0)
        : 0;
    let bayar = parseFloat(document.getElementById('input-uang-bayar').value) || 0;

    if (bayar < totalAkhir) {
        alert("Uang pembayaran kurang!");
        return;
    }
    if (biayaShopee > totalAkhir - totalModal) {
        if (!confirm("Biaya Shopee lebih besar daripada laba kotor transaksi. Tetap simpan transaksi?")) return;
    }

    bunyiSukses();

    for (let item of keranjang) {
        let p = produkList.find(prod => prod.id === item.id);
        if (p) {
            p.stok -= item.qty;
            await db.produk.update(p.id, { stok: p.stok });
        }
    }

    let labaKotor = totalAkhir - totalModal;
    let totalLaba = labaKotor - biayaShopee;
    let sekarang = new Date();
    let waktuStr = sekarang.toLocaleString('id-ID');
    let waktuIsoFormat = getLocalDateString(sekarang);
    let detailStr = keranjang.map(i => `${i.nama} (${i.qty}x - ${i.jenisHarga || 'eceran'})`).join(', ');

    let trxData = {
        waktu: sekarang.toISOString(),
        waktuIso: waktuIsoFormat,
        waktuFormatted: waktuStr,
        detail: detailStr,
        kanalPenjualan: kanal,
        biayaShopee,
        totalModal,
        labaKotor,
        totalOmset: totalAkhir,
        totalLaba,
        items: keranjang.map(i => ({
            idProduk: i.id, nama: i.nama, qty: i.qty, harga: i.harga,
            jenisHarga: i.jenisHarga || 'eceran', modal: i.modal
        }))
    };

    let newTrxId = await db.transaksi.add(trxData);
    trxData.id = newTrxId;
    riwayatTransaksi.unshift(trxData);

    muatDashboard();
    muatTabelStok();
    muatGridKasir();

    let isiStrukHtml = `<p><b>Waktu:</b> ${waktuStr}</p>
        <p><b>Kanal:</b> ${kanal === 'shopee' ? 'Shopee' : 'Penjualan Langsung'}</p><hr class="my-1"><div class="space-y-1">`;
    keranjang.forEach(i => {
        isiStrukHtml += `<div class="flex justify-between"><span>${i.nama} (${i.qty}x - ${i.jenisHarga})</span><span>${formatMataUang(i.harga * i.qty)}</span></div>`;
    });
    let kembalian = bayar - totalAkhir;
    isiStrukHtml += `</div><hr class="my-1">
        <div class="flex justify-between font-bold"><span>Total:</span><span>${formatMataUang(totalAkhir)}</span></div>`;
    if (kanal === 'shopee') isiStrukHtml += `<div class="flex justify-between"><span>Biaya Shopee:</span><span>${formatMataUang(biayaShopee)}</span></div>`;
    isiStrukHtml += `<div class="flex justify-between"><span>Laba Bersih:</span><span>${formatMataUang(totalLaba)}</span></div>
        <div class="flex justify-between"><span>Bayar:</span><span>${formatMataUang(bayar)}</span></div>
        <div class="flex justify-between"><span>Kembali:</span><span>${formatMataUang(kembalian)}</span></div>`;

    document.getElementById('isi-struk').innerHTML = isiStrukHtml;
    document.getElementById('modal-struk').classList.remove('hidden');

    keranjang = [];
    document.getElementById('input-uang-bayar').value = '';
    if (document.getElementById('input-biaya-shopee')) document.getElementById('input-biaya-shopee').value = '0';
    if (document.getElementById('kasir-kanal')) document.getElementById('kasir-kanal').value = 'langsung';
    ubahKanalPenjualan();
    renderKeranjang();
    muatTabelRiwayat();
}

function bunyiBeep() {
    try {
        let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let now = audioCtx.currentTime;
        
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        
        osc.type = 'square'; 
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(1800, now + 0.04); 
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.08);

        setTimeout(() => audioCtx.close(), 200);
    } catch (e) {}
}

function bunyiSukses() {
    try {
        let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let now = audioCtx.currentTime;
        let notes = [523.25, 659.25, 783.99, 1046.50]; 
        
        notes.forEach((freq, index) => {
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            
            osc.type = 'sine'; 
            osc.frequency.setValueAtTime(freq, now + (index * 0.07));
            
            gain.gain.setValueAtTime(0.1, now + (index * 0.07));
            gain.gain.exponentialRampToValueAtTime(0.001, now + (index * 0.07) + 0.2);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(now + (index * 0.07));
            osc.stop(now + (index * 0.07) + 0.2);
        });

        setTimeout(() => audioCtx.close(), 600);
    } catch (e) {}
}
// Menutup modal struk tanpa mencetak nota.
// Transaksi sudah tersimpan ke IndexedDB sebelum modal ini ditampilkan.
function tutupStruk() {
    const modal = document.getElementById('modal-struk');
    if (modal) modal.classList.add('hidden');
}
