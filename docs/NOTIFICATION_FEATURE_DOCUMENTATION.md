# Dokumentasi Fitur Notifikasi SIPOMA

## Ringkasan

Fitur notifikasi di header aplikasi SIPOMA telah dikembangkan dengan berbagai peningkatan untuk memberikan pengalaman pengguna yang lebih baik dan fleksibel.

## Fitur Baru yang Ditambahkan

### 1. Hook `useNotifications`

**Lokasi:** `hooks/useNotifications.ts`

**Fitur Utama:**

- **Real-time Notifications:** Menggunakan Supabase real-time subscription
- **Browser Notifications:** Mendukung notifikasi browser native
- **Sound Alerts:** Pemutaran suara notifikasi menggunakan Web Audio API
- **Notification Settings:** Pengaturan yang dapat dikustomisasi dan persisten
- **Snooze & Dismiss:** Fitur untuk menunda atau menutup notifikasi
- **Category System:** Kategorisasi notifikasi (system, maintenance, production, user, security)

**API Functions:**

```typescript
const {
  notifications, // Array notifikasi yang sudah difilter
  allNotifications, // Semua notifikasi (termasuk yang di-dismiss)
  unreadCount, // Jumlah notifikasi yang belum dibaca
  loading, // Status loading
  settings, // Pengaturan notifikasi
  markAsRead, // Tandai sebagai dibaca
  markAllAsRead, // Tandai semua sebagai dibaca
  dismissNotification, // Tutup notifikasi
  snoozeNotification, // Tunda notifikasi
  createNotification, // Buat notifikasi baru
  updateSettings, // Update pengaturan
  refetch, // Refresh data
} = useNotifications();
```

### 2. Komponen `NotificationPanel`

**Lokasi:** `components/NotificationPanel.tsx`

**Fitur UI:**

- **Smart Dropdown:** Panel notifikasi yang responsif dan dapat dikustomisasi
- **Visual Indicators:** Indikator visual untuk severity dan kategori
- **Action Buttons:** Tombol untuk mark as read, snooze, dan dismiss
- **Settings Panel:** Panel pengaturan terintegrasi
- **Notification Counter:** Penghitung notifikasi dengan animasi
- **Empty State:** Tampilan ketika tidak ada notifikasi

**Props Interface:**

```typescript
interface NotificationPanelProps {
  notifications: ExtendedAlert[];
  unreadCount: number;
  settings: NotificationSettings;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onUpdateSettings: (settings: Partial<NotificationSettings>) => void;
  t: any;
  isOpen: boolean;
  onToggle: () => void;
}
```

### 3. Komponen `NotificationCreator` (Development Tool)

**Lokasi:** `components/NotificationCreator.tsx`

**Fungsi:**

- Tool untuk membuat notifikasi test saat development
- Modal form dengan field message, severity, dan category
- Hanya tampil pada mode development

### 4. Icon Components Baru

**Lokasi:** `components/icons/`

**Icon yang Ditambahkan:**

- `BellSlashIcon` - Icon untuk notifikasi dinonaktifkan
- `XMarkIcon` - Icon close/dismiss
- `CheckIcon` - Icon check/mark as read
- `EyeSlashIcon` - Icon untuk empty state
- `SpeakerWaveIcon` - Icon sound enabled
- `SpeakerXMarkIcon` - Icon sound disabled

### 5. Enhanced Types

**Lokasi:** `hooks/useNotifications.ts`

**Type Definitions:**

```typescript
interface NotificationSettings {
  email: boolean;
  browser: boolean;
  sound: boolean;
  showCriticalOnly: boolean;
}

interface ExtendedAlert extends Alert {
  category?: 'system' | 'maintenance' | 'production' | 'user' | 'security';
  actionUrl?: string;
  dismissed?: boolean;
  snoozedUntil?: Date;
}
```

## Fitur yang Diimplementasikan

### 1. Browser Notifications

- Request permission otomatis saat pertama kali load
- Notifikasi native browser dengan icon aplikasi
- Auto-close setelah 5 detik
- Click-to-focus pada aplikasi

### 2. Sound Alerts

- Suara beep menggunakan Web Audio API
- Dapat dinonaktifkan melalui settings
- Frekuensi 800Hz dengan fade out

### 3. Real-time Updates

- Menggunakan Supabase real-time subscription
- Otomatis update UI ketika ada notifikasi baru
- Sinkronisasi state antar tab/window

### 4. Notification Management

- **Mark as Read:** Tandai notifikasi sebagai dibaca
- **Mark All as Read:** Tandai semua notifikasi sebagai dibaca
- **Dismiss:** Tutup notifikasi (disembunyikan dari UI)
- **Snooze:** Tunda notifikasi dengan opsi waktu (15 menit, 1 jam, 4 jam, 1 hari)

### 5. Settings & Preferences

- **Browser Notifications:** Toggle notifikasi browser
- **Sound Alerts:** Toggle suara notifikasi
- **Critical Only:** Tampilkan hanya notifikasi critical
- Settings disimpan di localStorage untuk persistensi

### 6. Visual Improvements

- **Severity Colors:** Merah (Critical), Kuning (Warning), Biru (Info)
- **Category Badges:** Label kategori yang dapat disesuaikan
- **Emoji Icons:** Emoji untuk severity indication
- **Responsive Design:** Optimal untuk mobile dan desktop
- **Dark Mode Support:** Full support untuk tema gelap

## Penggunaan

### 1. Basic Usage (di Header)

```tsx
import { useNotifications } from '../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

const {
  notifications,
  unreadCount,
  settings,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  snoozeNotification,
  updateSettings,
} = useNotifications();

<NotificationPanel
  notifications={notifications}
  unreadCount={unreadCount}
  settings={settings}
  onMarkAsRead={markAsRead}
  onMarkAllAsRead={markAllAsRead}
  onDismiss={dismissNotification}
  onSnooze={snoozeNotification}
  onUpdateSettings={updateSettings}
  t={t}
  isOpen={isNotifMenuOpen}
  onToggle={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
/>;
```

### 2. Creating Notifications

```tsx
const { createNotification } = useNotifications();

// Buat notifikasi sederhana
await createNotification('Server restart required', AlertSeverity.WARNING);

// Buat notifikasi dengan kategori
await createNotification('New user registered', AlertSeverity.INFO, 'user');

// Buat notifikasi dengan action URL
await createNotification(
  'Critical system error detected',
  AlertSeverity.CRITICAL,
  'system',
  '/dashboard/system'
);
```

### 3. Managing Settings

```tsx
const { settings, updateSettings } = useNotifications();

// Toggle browser notifications
updateSettings({ browser: !settings.browser });

// Enable critical only mode
updateSettings({ showCriticalOnly: true });

// Disable sound alerts
updateSettings({ sound: false });
```

## Database Schema

Untuk implementasi penuh, tabel `alerts` memerlukan kolom tambahan (opsional):

```sql
-- Tambahan kolom untuk fitur extended (opsional)
ALTER TABLE alerts ADD COLUMN category VARCHAR(20);
ALTER TABLE alerts ADD COLUMN action_url TEXT;
ALTER TABLE alerts ADD COLUMN dismissed BOOLEAN DEFAULT FALSE;
ALTER TABLE alerts ADD COLUMN snoozed_until TIMESTAMP;
```

## Translations

Terjemahan baru yang ditambahkan:

**English:**

- `notification_settings`: "Notification Settings"
- `browser_notifications`: "Browser Notifications"
- `sound_alerts`: "Sound Alerts"
- `critical_only`: "Critical Only"
- `snooze_notification`: "Snooze"
- `dismiss_notification`: "Dismiss"
- `mark_as_read`: "Mark as read"

**Indonesian:**

- `notification_settings`: "Pengaturan Notifikasi"
- `browser_notifications`: "Notifikasi Browser"
- `sound_alerts`: "Suara Peringatan"
- `critical_only`: "Hanya Kritis"
- `snooze_notification`: "Tunda"
- `dismiss_notification`: "Tutup"
- `mark_as_read`: "Tandai dibaca"

## Testing

Untuk testing fitur, gunakan NotificationCreator yang muncul di mode development:

1. Jalankan aplikasi dengan `npm run dev`
2. Klik tombol "Test Notification" yang muncul di bawah header
3. Isi form dengan pesan, severity, dan kategori
4. Submit untuk membuat notifikasi test

## Browser Compatibility

- **Modern Browsers:** Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Notification API:** Supported in all modern browsers
- **Web Audio API:** Fallback graceful jika tidak didukung
- **LocalStorage:** Universal support

## Performance Considerations

- **Real-time Connection:** Single subscription untuk efisiensi
- **Local Storage:** Minimal data untuk settings
- **Memory Management:** Auto cleanup untuk notifikasi lama
- **Debounced Updates:** Prevent excessive re-renders

## Future Enhancements

1. **Email Notifications:** Integrasi email untuk notifikasi critical
2. **Push Notifications:** Service worker untuk offline notifications
3. **Notification History:** Full history page dengan pagination
4. **Advanced Filtering:** Filter berdasarkan date range, category, dll
5. **Notification Templates:** Template system untuk notifikasi berulang
6. **User Preferences:** Per-user notification preferences
7. **Rich Notifications:** Support untuk media dan attachment
8. **Bulk Actions:** Select multiple notifications untuk bulk operations

---

Fitur notifikasi ini memberikan fondasi yang solid untuk sistem notifikasi yang dapat berkembang sesuai kebutuhan aplikasi SIPOMA ke depannya.
