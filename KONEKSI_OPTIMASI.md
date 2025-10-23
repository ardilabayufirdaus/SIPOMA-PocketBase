# Optimasi Koneksi PocketBase untuk SIPOMA

Dokumen ini menjelaskan optimasi yang telah diimplementasikan pada aplikasi SIPOMA untuk mempercepat koneksi ke server PocketBase dan meningkatkan performa aplikasi secara keseluruhan.

## Fitur Optimasi yang Telah Diimplementasikan

1. **Connection Pool**
   - Pre-koneksi sebelum user membutuhkan data
   - Health check berkala untuk memastikan koneksi tetap aktif

2. **Sistem Cache**
   - Cache untuk data yang jarang berubah
   - TTL (Time-To-Live) yang dapat dikonfigurasi untuk setiap data
   - Auto-cleaning untuk data yang sudah kedaluwarsa

3. **Data Preloader**
   - Prefetch data penting saat aplikasi dimulai
   - Prioritas loading berdasarkan kepentingan data

4. **Smart Loading System**
   - Loading skeleton dengan prioritas
   - Timeout dan retry yang cerdas
   - Mempertimbangkan kondisi koneksi saat loading

5. **Query Optimizer**
   - Seleksi field untuk mengurangi ukuran data
   - Pagination optimal untuk performa
   - Batch operations untuk multiple records

## Cara Menggunakan Fitur Optimasi

### 1. Connection Pool

Connection Pool secara otomatis diinisialisasi di AppWrapper.tsx. Untuk menggunakannya di komponen lain:

```tsx
import { connectionPool } from '../utils/connectionPool';

function MyComponent() {
  useEffect(() => {
    // Cek status koneksi
    const isConnected = connectionPool.isConnectionActive();

    // Lakukan tindakan berdasarkan status koneksi
    if (!isConnected) {
      console.warn('Koneksi tidak tersedia');
    }
  }, []);

  return <div>{/* komponen content */}</div>;
}
```

### 2. Sistem Cache

Gunakan sistem cache untuk data yang jarang berubah:

```tsx
import { dataCache } from '../utils/dataCache';

// Simpan data ke cache
dataCache.set('key_cache', data, 300000); // TTL 5 menit (dalam ms)

// Ambil data dari cache
const cachedData = dataCache.get('key_cache');
if (cachedData) {
  // Gunakan data dari cache
} else {
  // Ambil data dari server dan simpan di cache
}

// Hapus cache berdasarkan pattern
dataCache.removeByPattern(/^prefetch_/);

// Hapus cache spesifik
dataCache.remove('specific_key');

// Bersihkan semua cache
dataCache.clear();
```

### 3. Optimasi Query

Gunakan Query Optimizer untuk mengoptimalkan permintaan ke server:

```tsx
import { optimizedQuery, optimizedGetOne, batchOperation } from '../utils/queryOptimizer';

// Contoh mengambil data dengan optimasi
async function fetchOptimizedData() {
  try {
    // Query dengan paginasi, filter, dan caching
    const result = await optimizedQuery('collection_name', {
      page: 1,
      perPage: 20,
      filter: 'field="value"',
      sort: '-created',
      fields: ['id', 'name', 'created'], // Hanya ambil field yang dibutuhkan
      cacheKey: 'my_data_cache',
      cacheTtl: 10 * 60 * 1000, // 10 menit
    });

    // Get one dengan caching
    const singleRecord = await optimizedGetOne('collection_name', 'record_id', {
      fields: ['id', 'name', 'created'],
      cacheKey: 'single_record',
      cacheTtl: 5 * 60 * 1000, // 5 menit
    });

    // Batch operation
    const createResults = await batchOperation('collection_name', arrayOfNewRecords, 'create');

    return result;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}
```

### 4. Smart Loader

Gunakan Smart Loader untuk menampilkan loading dengan prioritas:

```tsx
import SmartLoader from '../components/SmartLoader';
import LoadingSkeleton from '../components/LoadingSkeleton';

function MyComponent() {
  // Untuk data penting dengan prioritas tinggi
  return (
    <SmartLoader
      priority="high"
      fallback={<LoadingSkeleton />}
      retry={true}
      onTimeout={() => console.warn('Loading timeout')}
    >
      <ActualContent data={data} />
    </SmartLoader>
  );
}
```

### 5. Data Preloader

Data Preloader sudah terpasang di AppWrapper.tsx dan secara otomatis akan melakukan prefetch data penting saat aplikasi dimulai.

Untuk menambahkan atau mengubah data yang di-prefetch, edit file `components/DataPreloader.tsx`:

```tsx
// Ubah array ini untuk menambahkan koleksi yang ingin di-prefetch
const PREFETCH_COLLECTIONS = [
  'parameter_settings',
  'plant_units',
  'pic_settings',
  // Tambahkan koleksi lain di sini
];
```

## Best Practices untuk Optimasi

1. **Pilih Data dengan Bijak**
   - Hanya ambil field yang benar-benar diperlukan
   - Gunakan paginasi untuk data besar
   - Filter data di server, bukan di client

2. **Manfaatkan Cache dengan Tepat**
   - Set TTL cache sesuai dengan frekuensi perubahan data
   - Bersihkan cache yang sudah tidak relevan
   - Gunakan cache untuk data master yang jarang berubah

3. **Prioritaskan Loading**
   - Prioritas tinggi untuk data yang langsung terlihat user
   - Prioritas rendah untuk data yang bisa dimuat kemudian
   - Gunakan skeleton loading untuk UX yang baik

4. **Handle Kesalahan dengan Baik**
   - Selalu siapkan fallback untuk data yang gagal dimuat
   - Tampilkan pesan error yang informatif
   - Sediakan opsi retry untuk koneksi yang gagal

## Menghadapi Koneksi Lambat

Ketika koneksi lambat, sistem akan:

1. Menampilkan skeleton loading sesuai prioritas
2. Mencoba menggunakan data dari cache jika tersedia
3. Melakukan retry dengan exponential backoff
4. Memberikan feedback ke user tentang status koneksi

Komponen yang menggunakan data dari server sebaiknya:

1. Selalu check kondisi loading dan error
2. Tampilkan fallback UI yang informatif
3. Gunakan data dari cache sebagai sementara
4. Berikan opsi untuk refresh manual

## Kesimpulan

Dengan mengimplementasikan optimasi ini, aplikasi SIPOMA akan:

1. Memuat lebih cepat bahkan dalam kondisi jaringan lambat
2. Lebih tangguh terhadap gangguan koneksi
3. Memberikan UX yang lebih baik dengan loading yang terencana
4. Mengurangi beban pada server PocketBase

Perlu diingat bahwa tidak ada solusi sempurna untuk koneksi lambat. Optimasi ini bertujuan untuk meningkatkan pengalaman pengguna semaksimal mungkin dalam kondisi jaringan yang tidak ideal.
