import PocketBase from 'pocketbase';

const PB_URL = 'http://172.18.6.98:8090';
const PB_EMAIL = 'ardila.firdaus@sig.id';
const PB_PASSWORD = 'makassar@270989';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

async function setupContractsCollection() {
  try {
    console.log('Authenticating as admin to PocketBase...');
    await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
    console.log('Admin authentication successful!');

    const collectionName = 'contracts_sla';
    let existingCollection = null;

    try {
      existingCollection = await pb.collections.getOne(collectionName);
      console.log(`Collection '${collectionName}' already exists.`);
    } catch (e) {
      console.log(`Collection '${collectionName}' does not exist yet. Creating...`);
    }

    const schema = [
      { name: 'po_number', type: 'text', required: true },
      { name: 'contract_title', type: 'text', required: true },
      { name: 'vendor_name', type: 'text', required: true },
      { name: 'category', type: 'text', required: true },
      { name: 'start_date', type: 'text', required: true },
      { name: 'end_date', type: 'text', required: true },
      { name: 'contract_budget', type: 'number', required: true },
      { name: 'budget_absorbed', type: 'number' },
      { name: 'initial_volume', type: 'number' },
      { name: 'absorbed_volume', type: 'number' },
      { name: 'volume_unit', type: 'text' },
      {
        name: 'contract_pdf',
        type: 'file',
        options: {
          maxSelect: 1,
          maxSize: 52428800, // 50MB
          mimeTypes: ['application/pdf'],
        },
      },
      {
        name: 'sap_po_screenshot',
        type: 'file',
        options: {
          maxSelect: 1,
          maxSize: 20971520, // 20MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        },
      },
      {
        name: 'attachments',
        type: 'file',
        options: {
          maxSelect: 10,
          maxSize: 52428800,
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        },
      },
      { name: 'pic_name', type: 'text' },
      { name: 'pic_contact', type: 'text' },
      { name: 'status', type: 'text' }, // 'Active', 'Near Expiry', 'Expired', 'Completed', 'Draft'
      { name: 'sla_kpi_target', type: 'text' },
      { name: 'sla_status', type: 'text' }, // 'Achieved', 'On Track', 'Warning', 'Breached'
      { name: 'notes', type: 'text' },
    ];

    if (!existingCollection) {
      await pb.collections.create({
        name: collectionName,
        type: 'base',
        schema: schema,
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
      });
      console.log(`Collection '${collectionName}' created successfully!`);
    } else {
      // Update schema if needed
      await pb.collections.update(existingCollection.id, {
        schema: schema,
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
      });
      console.log(`Collection '${collectionName}' updated successfully!`);
    }

    // Check if initial seed data is needed
    const countRecords = await pb.collection(collectionName).getList(1, 1);
    if (countRecords.totalItems === 0) {
      console.log('Seeding initial sample contracts...');
      const samples = [
        {
          po_number: 'PO-4500128901',
          contract_title: 'Pengadaan & Pasokan Bahan Baku Gypsum Sintetik Pabrik Tonasa',
          vendor_name: 'PT Petrokimia Semen Nusantara',
          category: 'Raw Material',
          start_date: '2026-01-01',
          end_date: '2026-09-30', // Near expiry H-37 from Aug 24
          contract_budget: 1850000000,
          budget_absorbed: 1420000000,
          initial_volume: 25000,
          absorbed_volume: 19800,
          volume_unit: 'Ton',
          pic_name: 'Ahmad Fauzi (Seksi Raw Material)',
          pic_contact: '081234567890',
          status: 'Active',
          sla_kpi_target: 'Kadar Kemurnian > 92%, Waktu Pengiriman Max 48 Jam, Toleransi Susut < 0.5%',
          sla_status: 'Achieved',
          notes: 'Mendekati masa habis kontrak (H-37). Siapkan dokumen perpanjangan / addendum volume.',
        },
        {
          po_number: 'PO-4500130244',
          contract_title: 'Jasa Pemeliharaan & Overhaul Vertical Roller Mill (VRM) Tuban',
          vendor_name: 'PT FLSmidth Maintenance Indonesia',
          category: 'Maintenance & Sparepart',
          start_date: '2026-03-15',
          end_date: '2026-11-15', // Near expiry H-83 from Aug 24
          contract_budget: 3200000000,
          budget_absorbed: 2150000000,
          initial_volume: 450,
          absorbed_volume: 310,
          volume_unit: 'Jam Kerja / Manhour',
          pic_name: 'Bambang Sutrisno (Unit Maintenance)',
          pic_contact: '081398765432',
          status: 'Active',
          sla_kpi_target: 'Availability VRM > 96.5%, MTBF > 720 Jam, Response Emergency < 2 Jam',
          sla_status: 'On Track',
          notes: 'Kontrak jasa maintenance semester II. Evaluasi SLA rutin tiap akhir bulan.',
        },
        {
          po_number: 'PO-4500119850',
          contract_title: 'Pengangkutan & Distribusi Semen Curah Wilayah Sulawesi Selatan',
          vendor_name: 'PT Trans Logistik Sejahtera',
          category: 'Logistik & Transport',
          start_date: '2025-09-01',
          end_date: '2026-08-31', // Critical expiry H-7
          contract_budget: 4750000000,
          budget_absorbed: 4620000000,
          initial_volume: 120000,
          absorbed_volume: 118400,
          volume_unit: 'Ton Curah',
          pic_name: 'Rahmat Hidayat (Logistik)',
          pic_contact: '081122334455',
          status: 'Near Expiry',
          sla_kpi_target: 'Lead Time Pengiriman On-Time > 98%, Zero Accident, Armada GPS Live',
          sla_status: 'Achieved',
          notes: 'URGENT: Masa berlaku tinggal 7 hari lagi. Proses tender ulang sedang berjalan.',
        },
        {
          po_number: 'PO-4500145612',
          contract_title: 'Pengadaan Refractory Castable & Brick Kiln Line 4',
          vendor_name: 'PT RHI Magnesita Refractory',
          category: 'Maintenance & Sparepart',
          start_date: '2026-05-01',
          end_date: '2027-04-30', // Active > 90 days
          contract_budget: 2900000000,
          budget_absorbed: 870000000,
          initial_volume: 350,
          absorbed_volume: 110,
          volume_unit: 'Ton Material',
          pic_name: 'Dedi Kurniawan (Refractory Specialist)',
          pic_contact: '081567890123',
          status: 'Active',
          sla_kpi_target: 'Ketahanan Suhu > 1450 C, Garansi Pemasangan 12 Bulan',
          sla_status: 'Achieved',
          notes: 'Pengadaan material refractory untuk persiapan annual shutdown.',
        },
        {
          po_number: 'PO-4500098421',
          contract_title: 'Jasa Kalibrasi Alat Ukur Instrumentasi & Laboratorium CCR',
          vendor_name: 'PT Sucofindo (Persero)',
          category: 'Outsourcing & Jasa',
          start_date: '2025-06-01',
          end_date: '2026-05-31', // Expired
          contract_budget: 480000000,
          budget_absorbed: 480000000,
          initial_volume: 120,
          absorbed_volume: 120,
          volume_unit: 'Titik Kalibrasi',
          pic_name: 'Siti Nurhaliza (QC & Lab)',
          pic_contact: '081789012345',
          status: 'Expired',
          sla_kpi_target: 'Sertifikasi KAN Terakreditasi, Ketepatan Hasil Kalibrasi 100%',
          sla_status: 'Achieved',
          notes: 'Kontrak telah selesai 100%. Arsip laporan dan BAST sudah lengkap.',
        },
      ];

      for (const sample of samples) {
        await pb.collection(collectionName).create(sample);
        console.log(`Sample contract created: ${sample.po_number}`);
      }
    }

    console.log('Setup finished successfully!');
  } catch (error) {
    console.error('Error during setup:', error);
  }
}

setupContractsCollection();
