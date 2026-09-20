# TaskCanvas — Final Project LBE RPL 2026

TaskCanvas adalah aplikasi To Do List berbasis web yang dikembangkan sebagai Final Project LBE Lab RPL ITS 2026.

Project ini dikembangkan secara kolaboratif menggunakan workflow Git dan GitHub dengan struktur branch:

`main → dev → feature/*`

Aplikasi dibuat menggunakan HTML, CSS, dan JavaScript murni tanpa framework.

---

## Fitur

### Fitur Wajib

Project ini mengimplementasikan seluruh 6 fitur wajib dari Final Project:

1. **Mark as Complete**
   - Menandai task sebagai selesai.
   - Task yang selesai ditampilkan dengan status completed.

2. **Edit Task**
   - Mengubah isi task yang sudah dibuat.

3. **Filter Task**
   - Menampilkan seluruh task.
   - Menampilkan task yang masih aktif.
   - Menampilkan task yang sudah selesai.

4. **LocalStorage**
   - Data task disimpan menggunakan browser LocalStorage.
   - Data tetap tersedia setelah halaman di-refresh.

5. **Task Counter**
   - Menampilkan jumlah task yang masih belum selesai.

6. **Clear Completed**
   - Menghapus seluruh task yang sudah selesai sekaligus.

### Fitur Tambahan

Selain fitur wajib, project juga memiliki pengembangan tambahan pada tampilan dan organisasi task:

- Project management
- Project-based navigation
- Subject/section organization
- Archive Project
- Sidebar navigation
- Responsive interface
- Interactive project cards
- Excalidraw-inspired visual design

> Fitur tambahan di atas hanya dicantumkan apabila sudah tersedia pada branch `main` versi final.

---

## 🛠️ Teknologi

Project ini menggunakan:

- HTML5
- CSS3
- Vanilla JavaScript
- LocalStorage
- Git
- GitHub

Tidak menggunakan framework frontend seperti React, Vue, atau Bootstrap.

---

## 📁 Struktur Project

```text
Kelompok-2/
│
├── src/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
│
├── LICENSE
└── README.md
