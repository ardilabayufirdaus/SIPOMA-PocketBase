# 🔔 Fitur Notifikasi SIPOMA - Quick Start Guide

## 🎯 Fitur Utama

Fitur notifikasi di header SIPOMA telah dikembangkan dengan berbagai peningkatan modern:

### ✨ Highlights

- 🔴 **Real-time Notifications** - Update otomatis tanpa refresh
- 🌐 **Browser Notifications** - Notifikasi native browser
- 🔊 **Sound Alerts** - Suara peringatan yang dapat di-toggle
- ⚙️ **Smart Settings** - Pengaturan yang dapat dikustomisasi
- 📱 **Responsive Design** - Optimal untuk mobile dan desktop
- 🌙 **Dark Mode Support** - Full support tema gelap

## 🚀 Cara Menggunakan

### 1. Bell Icon di Header

- Klik icon 🔔 di header untuk membuka panel notifikasi
- Badge merah menunjukkan jumlah notifikasi yang belum dibaca
- Icon berubah menjadi 🔕 jika notifikasi browser dinonaktifkan

### 2. Panel Notifikasi

- **Mark as Read** ✅ - Klik untuk menandai notifikasi sebagai dibaca
- **Snooze** ⏰ - Tunda notifikasi dengan pilihan waktu (15 menit, 1 jam, 4 jam, 1 hari)
- **Dismiss** ❌ - Tutup notifikasi permanent
- **Mark All as Read** - Tandai semua notifikasi sebagai dibaca sekaligus

### 3. Settings Panel

Klik icon ⚙️ di panel notifikasi untuk mengatur:

- **Browser Notifications** - Toggle notifikasi browser
- **Sound Alerts** - Toggle suara peringatan
- **Critical Only** - Tampilkan hanya notifikasi critical

### 4. Testing (Development Mode)

Pada mode development, tersedia tools testing di bawah header:

- **Test Notification** - Buat notifikasi custom
- **Create Demo** - Buat set notifikasi demo
- **Clear Demo** - Hapus notifikasi demo

## 🎨 Visual Indicators

### Severity Colors

- 🔴 **Critical** - Merah (perlu perhatian segera)
- 🟡 **Warning** - Kuning (perlu perhatian)
- 🔵 **Info** - Biru (informational)

### Category Badges

- **System** - Notifikasi sistem
- **Maintenance** - Maintenance dan perawatan
- **Production** - Proses produksi
- **User** - Aktivitas pengguna
- **Security** - Keamanan sistem

## 📱 Browser Notifications

### Setup

1. Saat pertama kali menggunakan, browser akan meminta permission
2. Klik "Allow" untuk mengaktifkan notifikasi browser
3. Notifikasi akan muncul bahkan ketika tab tidak aktif

### Features

- Auto-close setelah 5 detik
- Klik notifikasi untuk focus ke aplikasi
- Suara dapat di-toggle melalui settings

## 🔧 For Developers

### Creating Notifications

```typescript
import { useNotifications } from "../hooks/useNotifications";
import { AlertSeverity } from "../types";

const { createNotification } = useNotifications();

// Simple notification
await createNotification("System updated", AlertSeverity.INFO);

// With category
await createNotification(
  "Maintenance required",
  AlertSeverity.WARNING,
  "maintenance"
);
```

### Hook Usage

```typescript
const {
  notifications, // Filtered notifications
  unreadCount, // Unread count
  settings, // User settings
  markAsRead, // Mark single as read
  markAllAsRead, // Mark all as read
  dismissNotification, // Dismiss notification
  snoozeNotification, // Snooze notification
  updateSettings, // Update settings
} = useNotifications();
```

## 🌟 Rekomendasi Penggunaan

### Best Practices

1. **Critical notifications** - Untuk error sistem atau keamanan
2. **Warning notifications** - Untuk maintenance atau threshold alerts
3. **Info notifications** - Untuk update status atau achievement

### User Experience

- Gunakan snooze untuk notifikasi non-urgent yang masih relevan
- Dismiss untuk notifikasi yang tidak perlu ditindaklanjuti
- Atur "Critical Only" mode saat focus pada task penting

### Performance

- Settings disimpan di localStorage (persistent)
- Real-time connection otomatis cleanup
- Efficient re-rendering dengan React hooks

## 🐛 Troubleshooting

### Browser Notifications Tidak Muncul

1. Check permission di browser settings
2. Pastikan setting "Browser Notifications" aktif
3. Refresh page jika perlu

### Sound Tidak Terdengar

1. Check setting "Sound Alerts" aktif
2. Check volume browser/system
3. Test dengan notification baru

### Notifikasi Tidak Update Real-time

1. Check koneksi internet
2. Refresh page untuk reconnect
3. Check console untuk error Supabase

---

**🎉 Selamat menggunakan fitur notifikasi SIPOMA yang telah ditingkatkan!**
