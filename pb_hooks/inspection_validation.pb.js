// --- INSPECTION VALIDATION HOOKS ---

onModelBeforeCreate((e) => {
  if (e.model.collection().name !== 'inspections') return;

  const date = e.model.get('date');
  const unit = e.model.get('unit');
  const area = e.model.get('area') || '';

  // Cek apakah sudah ada laporan untuk unit, area, dan tanggal yang sama
  try {
    const existing = $app
      .dao()
      .findFirstRecordByFilter(
        'inspections',
        'date = {:date} && unit = {:unit} && area = {:area}',
        { date: date, unit: unit, area: area }
      );

    if (existing) {
      throw new BadRequestError(
        'Laporan untuk unit/area ini pada tanggal tersebut sudah ada. Harap gunakan fitur edit/update.'
      );
    }
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    // Record not found is fine, continue
  }
}, 'inspections');

onModelBeforeUpdate((e) => {
  if (e.model.collection().name !== 'inspections') return;

  // Opsional: Tambahkan logika untuk mencegah perubahan pada shift yang sudah di-approve
  // Kecuali oleh super admin
  const original = $app.dao().findRecordById('inspections', e.model.id);

  // Periksa S1
  if (original.getBool('s1_approved') && e.model.get('s1_tender') !== original.get('s1_tender')) {
    // Cek role user yang sedang melakukan update (jika tersedia dalam konteks hook)
    // Note: Konteks user mungkin terbatas di pb_hooks JS murni tanpa interceptor rpc
  }
}, 'inspections');
