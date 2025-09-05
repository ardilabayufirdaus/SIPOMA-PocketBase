# Dokumentasi Fitur Hapus Pengguna

## Ringkasan

Implementasi fitur penghapusan pengguna dengan aturan khusus untuk role Super Admin.

## Aturan Bisnis

1. **Hanya Super Admin yang dapat menghapus pengguna lain**
2. **Super Admin tidak dapat dihapus oleh siapa pun (termasuk Super Admin lain)**

## Perubahan yang Dilakukan

### 1. Komponen UserTable (`components/UserTable.tsx`)

- **Ditambahkan**: Import `TrashIcon` untuk button delete
- **Ditambahkan**: Prop `currentUser` dan `onDeleteUser`
- **Ditambahkan**: Fungsi helper `canDeleteUser()` untuk validasi
- **Ditambahkan**: Button delete dengan kondisi visibility

```tsx
const canDeleteUser = (user: User): boolean => {
  // Super admin users cannot be deleted
  if (user.role === "Super Admin") {
    return false;
  }
  // Only super admin can delete other users
  return currentUser?.role === "Super Admin";
};
```

### 2. Hook useUsers (`hooks/useUsers.ts`)

- **Ditambahkan**: Validasi di fungsi `deleteUser()`
- **Ditambahkan**: Pengecekan role sebelum penghapusan

```typescript
// Prevent deletion of Super Admin users
if (userToDelete.role === UserRole.SUPER_ADMIN) {
  console.error("Cannot delete Super Admin users");
  return;
}
```

### 3. App Component (`App.tsx`)

- **Ditambahkan**: Fungsi `handleDeleteUser()` dengan validasi lengkap
- **Ditambahkan**: Toast notifications untuk feedback
- **Ditambahkan**: Confirmasi sebelum penghapusan

### 4. UserManagementPage (`pages/UserManagementPage.tsx`)

- **Ditambahkan**: Props `currentUser` dan `onDeleteUser`
- **Diteruskan**: Props ke komponen UserTable

### 5. Translations (`translations.ts`)

- **Ditambahkan**: Pesan dalam bahasa Inggris dan Indonesia:
  - `user_deleted_success`: "User deleted successfully!" / "Pengguna berhasil dihapus!"
  - `user_not_found`: "User not found" / "Pengguna tidak ditemukan"
  - `cannot_delete_super_admin`: "Super Admin users cannot be deleted" / "Pengguna Super Admin tidak dapat dihapus"
  - `only_super_admin_can_delete`: "Only Super Admin can delete users" / "Hanya Super Admin yang dapat menghapus pengguna"
  - `confirm_delete_user`: "Are you sure you want to delete this user?" / "Apakah Anda yakin ingin menghapus pengguna ini?"
  - `delete_user`: "Delete User" / "Hapus Pengguna"

## Alur Penghapusan Pengguna

### 1. Validasi UI

- Button delete hanya tampil jika:
  - User yang login adalah Super Admin
  - User target bukan Super Admin

### 2. Validasi Frontend

- Pengecekan role user yang login
- Pengecekan role user target
- Konfirmasi penghapusan

### 3. Validasi Backend (Hook)

- Double-check role user target
- Penghapusan dari database users
- Penghapusan dari Supabase Auth

## Keamanan

- **Double validation**: Validasi dilakukan di UI dan backend
- **Role-based access**: Hanya Super Admin yang dapat melakukan penghapusan
- **Protected Super Admin**: Super Admin tidak dapat dihapus
- **Confirmation**: Konfirmasi sebelum penghapusan untuk mencegah kesalahan

## Testing

1. Login sebagai Super Admin
2. Navigasi ke User Management
3. Verifikasi button delete tampil untuk user non-Super Admin
4. Verifikasi button delete tidak tampil untuk user Super Admin
5. Test penghapusan user normal (harus berhasil)
6. Test akses sebagai user non-Super Admin (button delete tidak tampil)

## Error Handling

- Toast notifications untuk semua skenario error
- Pesan error yang informatif dalam dua bahasa
- Graceful handling untuk edge cases

## UI/UX Improvements

- Consistent styling dengan button lain
- Hover effects yang sesuai
- Accessibility labels
- Responsive design
