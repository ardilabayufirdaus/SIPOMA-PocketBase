# Penyesuaian Skema ccr_silo_data

## Perubahan Skema

Skema koleksi `ccr_silo_data` telah diubah dari format nested menjadi format flat fields:

### Skema Lama (Nested)

```json
{
  "date": "2023-10-19",
  "silo_id": "relation_to_silo",
  "shift1": {
    "emptySpace": 12.5,
    "content": 45.3
  },
  "shift2": {
    "emptySpace": 13.2,
    "content": 44.6
  },
  "shift3": {
    "emptySpace": 14.0,
    "content": 43.8
  }
}
```

### Skema Baru (Flat Fields)

```json
{
  "date": "2023-10-19",
  "silo_id": "relation_to_silo",
  "shift1_empty_space": 12.5,
  "shift1_content": 45.3,
  "shift2_empty_space": 13.2,
  "shift2_content": 44.6,
  "shift3_empty_space": 14.0,
  "shift3_content": 43.8
}
```

## Perubahan Kode

### 1. Konversi Format Data

Untuk menjaga kompatibilitas dengan UI yang tetap mengharapkan format nested, fungsi `getShiftData` di `useCcrSiloData.ts` digunakan untuk mengonversi format flat fields ke format nested:

```typescript
const getShiftData = (item: Record<string, unknown>, shiftNum: number) => {
  const emptySpaceField = `shift${shiftNum}_empty_space`;
  const contentField = `shift${shiftNum}_content`;

  const emptySpace =
    typeof item[emptySpaceField] === 'number' ? (item[emptySpaceField] as number) : undefined;
  const content =
    typeof item[contentField] === 'number' ? (item[contentField] as number) : undefined;

  return {
    emptySpace: emptySpace,
    content: content,
  };
};
```

### 2. Pengambilan Data dari Database

Data diambil dari database dan dikonversi ke format yang diharapkan UI:

```typescript
return {
  id: item.id || '',
  silo_id: item.silo_id || '',
  date: item.date || formattedDate,
  // ...
  shift1: getShiftData(item, 1),
  shift2: getShiftData(item, 2),
  shift3: getShiftData(item, 3),
};
```

### 3. Penyimpanan Data ke Database

Saat menyimpan data, format nested dikonversi ke format flat fields:

```typescript
// Convert from nested format to flat field format
const shiftNum = shift.replace('shift', '');
const flatFieldName = `shift${shiftNum}_${field}`;

// Set the value directly to the flat field
updateData[flatFieldName] = value;
```

### 4. Penghapusan Data

Saat menghapus data field tertentu, field flat ditetapkan ke null:

```typescript
const shiftNum = shift.replace('shift', '');
const flatFieldName = `shift${shiftNum}_${field}`;
updateData[flatFieldName] = null;
```

## Catatan Penting

- UI tidak perlu diubah karena konversi format dilakukan di lapisan layanan
- Skema baru lebih efisien untuk kueri dan indeksasi di database
- Saat menyimpan data baru, gunakan format flat fields, bukan nested
