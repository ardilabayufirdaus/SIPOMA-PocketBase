import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { EnrichedContract } from '../hooks/useContractsData';
import { ContractSummaryStats } from '../types';

interface ExportContractExcelParams {
  contracts: EnrichedContract[];
  stats?: ContractSummaryStats;
  language?: string;
  userName?: string;
  activeFilterSummary?: string;
}

export const exportContractsToExcel = async ({
  contracts,
  stats,
  language = 'id',
  userName = 'Admin SIPOMA',
  activeFilterSummary = 'Semua Kontrak',
}: ExportContractExcelParams): Promise<void> => {
  const isID = language === 'id';
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIPOMA - PT Semen Tonasa (SIG)';
  workbook.lastModifiedBy = userName;
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet(isID ? 'Daftar Kontrak & SLA' : 'Contracts & SLA', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 0, ySplit: 9 }],
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  // Border styles
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'CBD5E1' } },
    left: { style: 'thin', color: { argb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
    right: { style: 'thin', color: { argb: 'CBD5E1' } },
  };

  const totalBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: '334155' } },
    left: { style: 'thin', color: { argb: 'CBD5E1' } },
    bottom: { style: 'double', color: { argb: '0F172A' } },
    right: { style: 'thin', color: { argb: 'CBD5E1' } },
  };

  // 1. TITLE BANNER (Rows 1-2)
  worksheet.mergeCells('A1:Y1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = isID
    ? 'SIPOMA - SISTEM MONITORING & MANAJEMEN KONTRAK & SLA'
    : 'SIPOMA - CONTRACT & SLA MANAGEMENT MONITORING REPORT';
  titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0F2942' }, // Navy Primary
  };
  worksheet.getRow(1).height = 32;

  worksheet.mergeCells('A2:Y2');
  const subTitleCell = worksheet.getCell('A2');
  subTitleCell.value = isID
    ? 'PT SEMEN TONASA (SEMEN INDONESIA GROUP) — LAPORAN REKAPITULASI REALISASI ANGGARAN, VOLUME & MASA BERLAKU H-90'
    : 'PT SEMEN TONASA (SEMEN INDONESIA GROUP) — BUDGET REALIZATION, VOLUME & H-90 EXPIRY RECAPITULATION';
  subTitleCell.font = {
    name: 'Calibri',
    size: 10,
    italic: true,
    bold: true,
    color: { argb: 'E2E8F0' },
  };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  subTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E3A5F' },
  };
  worksheet.getRow(2).height = 20;

  // 2. METADATA INFO (Row 4)
  worksheet.mergeCells('A4:D4');
  worksheet.getCell('A4').value =
    `${isID ? 'Tanggal Ekspor' : 'Export Date'}: ${new Date().toLocaleString(isID ? 'id-ID' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  worksheet.getCell('A4').font = { size: 9, bold: true, color: { argb: '475569' } };

  worksheet.mergeCells('E4:I4');
  worksheet.getCell('E4').value = `${isID ? 'Diekspor Oleh' : 'Exported By'}: ${userName}`;
  worksheet.getCell('E4').font = { size: 9, bold: true, color: { argb: '475569' } };

  worksheet.mergeCells('J4:M4');
  worksheet.getCell('J4').value =
    `${isID ? 'Filter Aktif' : 'Active Filter'}: ${activeFilterSummary}`;
  worksheet.getCell('J4').font = { size: 9, bold: true, color: { argb: '475569' } };

  worksheet.mergeCells('N4:P4');
  worksheet.getCell('N4').value =
    `${isID ? 'Total Data' : 'Total Items'}: ${contracts.length} ${isID ? 'Kontrak' : 'Contracts'}`;
  worksheet.getCell('N4').font = { size: 9, bold: true, color: { argb: '0F172A' } };

  // 3. EXECUTIVE KPI CARDS BLOCK (Rows 6-7)
  const totalBudget = contracts.reduce((acc, c) => acc + (Number(c.contract_budget) || 0), 0);
  const totalAbsorbed = contracts.reduce((acc, c) => acc + (Number(c.budget_absorbed) || 0), 0);
  const totalRemainingBudget = Math.max(0, totalBudget - totalAbsorbed);
  const avgAbsorptionPct = totalBudget > 0 ? (totalAbsorbed / totalBudget) * 100 : 0;
  const h90Count = contracts.filter((c) => c.isH90).length;
  const h30Count = contracts.filter((c) => c.isH30).length;
  const activeCount = contracts.filter((c) => c.expiryStatus === 'active').length;
  const expiredCount = contracts.filter((c) => c.expiryStatus === 'expired').length;

  // KPI 1: Total & Aktif
  worksheet.mergeCells('A6:C6');
  worksheet.mergeCells('A7:C7');
  worksheet.getCell('A6').value = isID ? 'TOTAL KONTRAK TERDAFTAR' : 'TOTAL CONTRACTS';
  worksheet.getCell('A6').font = { size: 9, bold: true, color: { argb: '1E3A8A' } };
  worksheet.getCell('A6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } };
  worksheet.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell('A7').value =
    `${contracts.length} (${activeCount} ${isID ? 'Aktif' : 'Active'} / ${expiredCount} ${isID ? 'Kedaluwarsa' : 'Expired'})`;
  worksheet.getCell('A7').font = { size: 11, bold: true, color: { argb: '1E40AF' } };
  worksheet.getCell('A7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EFF6FF' } };
  worksheet.getCell('A7').alignment = { horizontal: 'center', vertical: 'middle' };

  // KPI 2: Pagu Anggaran
  worksheet.mergeCells('D6:G6');
  worksheet.mergeCells('D7:G7');
  worksheet.getCell('D6').value = isID ? 'TOTAL PAGU ANGGARAN' : 'TOTAL CONTRACT BUDGET';
  worksheet.getCell('D6').font = { size: 9, bold: true, color: { argb: '065F46' } };
  worksheet.getCell('D6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
  worksheet.getCell('D6').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell('D7').value = totalBudget;
  worksheet.getCell('D7').numFmt = '"Rp "#,##0';
  worksheet.getCell('D7').font = { size: 12, bold: true, color: { argb: '047857' } };
  worksheet.getCell('D7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } };
  worksheet.getCell('D7').alignment = { horizontal: 'center', vertical: 'middle' };

  // KPI 3: Realisasi Serapan
  worksheet.mergeCells('H6:K6');
  worksheet.mergeCells('H7:K7');
  worksheet.getCell('H6').value = isID ? 'REALISASI SERAPAN (PENYERAPAN)' : 'BUDGET ABSORPTION';
  worksheet.getCell('H6').font = { size: 9, bold: true, color: { argb: '065F46' } };
  worksheet.getCell('H6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
  worksheet.getCell('H6').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell('H7').value =
    `${totalAbsorbed.toLocaleString('id-ID')} (${avgAbsorptionPct.toFixed(1)}%)`;
  worksheet.getCell('H7').font = { size: 11, bold: true, color: { argb: '047857' } };
  worksheet.getCell('H7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } };
  worksheet.getCell('H7').alignment = { horizontal: 'center', vertical: 'middle' };

  // KPI 4: Sisa Anggaran
  worksheet.mergeCells('L6:O6');
  worksheet.mergeCells('L7:O7');
  worksheet.getCell('L6').value = isID ? 'SISA PAGU ANGGARAN' : 'REMAINING BUDGET';
  worksheet.getCell('L6').font = { size: 9, bold: true, color: { argb: '374151' } };
  worksheet.getCell('L6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E5E7EB' } };
  worksheet.getCell('L6').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell('L7').value = totalRemainingBudget;
  worksheet.getCell('L7').numFmt = '"Rp "#,##0';
  worksheet.getCell('L7').font = { size: 12, bold: true, color: { argb: '1F2937' } };
  worksheet.getCell('L7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } };
  worksheet.getCell('L7').alignment = { horizontal: 'center', vertical: 'middle' };

  // KPI 5: Peringatan H-90 / H-30
  worksheet.mergeCells('P6:S6');
  worksheet.mergeCells('P7:S7');
  worksheet.getCell('P6').value = isID
    ? 'PERINGATAN MASA BERLAKU (H-90 / H-30)'
    : 'EXPIRY ALERT (H-90 / H-30)';
  worksheet.getCell('P6').font = { size: 9, bold: true, color: { argb: '92400E' } };
  worksheet.getCell('P6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
  worksheet.getCell('P6').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell('P7').value =
    `${h90Count} ${isID ? 'Kontrak H-90' : 'H-90 Contracts'} (${h30Count} ${isID ? 'Kritis H-30' : 'Critical'})`;
  worksheet.getCell('P7').font = {
    size: 11,
    bold: true,
    color: h30Count > 0 ? { argb: 'BE123C' } : { argb: 'B45309' },
  };
  worksheet.getCell('P7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEB' } };
  worksheet.getCell('P7').alignment = { horizontal: 'center', vertical: 'middle' };

  ['A6', 'D6', 'H6', 'L6', 'P6', 'A7', 'D7', 'H7', 'L7', 'P7'].forEach((cellRef) => {
    worksheet.getCell(cellRef).border = thinBorder;
  });

  // 4. MAIN DATA TABLE HEADERS (Row 9)
  const headers = [
    { key: 'no', title: isID ? 'NO' : 'NO', width: 6, align: 'center' },
    {
      key: 'po_number',
      title: isID ? 'NOMOR PO SAP' : 'SAP PO NUMBER',
      width: 17,
      align: 'center',
    },
    {
      key: 'contract_title',
      title: isID ? 'JUDUL / NAMA KONTRAK' : 'CONTRACT TITLE',
      width: 38,
      align: 'left',
    },
    { key: 'category', title: isID ? 'KATEGORI' : 'CATEGORY', width: 22, align: 'center' },
    {
      key: 'vendor_name',
      title: isID ? 'REKANAN / VENDOR' : 'VENDOR / SUPPLIER',
      width: 32,
      align: 'left',
    },
    { key: 'start_date', title: isID ? 'TGL MULAI' : 'START DATE', width: 14, align: 'center' },
    { key: 'end_date', title: isID ? 'TGL BERAKHIR' : 'END DATE', width: 14, align: 'center' },
    { key: 'days_remaining', title: isID ? 'SISA HARI' : 'DAYS LEFT', width: 12, align: 'center' },
    {
      key: 'expiry_status',
      title: isID ? 'STATUS MASA BERLAKU' : 'EXPIRY STATUS',
      width: 20,
      align: 'center',
    },
    {
      key: 'contract_status',
      title: isID ? 'STATUS KONTRAK' : 'STATUS',
      width: 14,
      align: 'center',
    },
    { key: 'currency', title: isID ? 'MATA UANG' : 'CURRENCY', width: 13, align: 'center' },
    { key: 'contract_budget', title: isID ? 'PAGU ANGGARAN' : 'BUDGET', width: 22, align: 'right' },
    {
      key: 'budget_absorbed',
      title: isID ? 'REALISASI SERAPAN' : 'ABSORBED BUDGET',
      width: 22,
      align: 'right',
    },
    {
      key: 'budget_remaining',
      title: isID ? 'SISA ANGGARAN' : 'REMAINING BUDGET',
      width: 22,
      align: 'right',
    },
    {
      key: 'budget_pct',
      title: isID ? '% SERAPAN BIAYA' : '% BUDGET ABSORPTION',
      width: 16,
      align: 'center',
    },
    {
      key: 'initial_volume',
      title: isID ? 'PAGU VOLUME' : 'INITIAL VOL',
      width: 16,
      align: 'right',
    },
    {
      key: 'absorbed_volume',
      title: isID ? 'REALISASI VOLUME' : 'ABSORBED VOL',
      width: 16,
      align: 'right',
    },
    {
      key: 'volume_remaining',
      title: isID ? 'SISA VOLUME' : 'REMAINING VOL',
      width: 16,
      align: 'right',
    },
    { key: 'volume_unit', title: isID ? 'SATUAN' : 'UNIT', width: 10, align: 'center' },
    {
      key: 'volume_pct',
      title: isID ? '% SERAPAN VOLUME' : '% VOL ABSORPTION',
      width: 16,
      align: 'center',
    },
    { key: 'sla_status', title: isID ? 'STATUS SLA' : 'SLA STATUS', width: 14, align: 'center' },
    {
      key: 'sla_kpi_target',
      title: isID ? 'TARGET KPI / SLA' : 'SLA KPI TARGET',
      width: 30,
      align: 'left',
    },
    {
      key: 'pic_name',
      title: isID ? 'PIC PENGAWAS' : 'SUPERVISOR (PIC)',
      width: 20,
      align: 'left',
    },
    { key: 'pic_contact', title: isID ? 'KONTAK PIC' : 'PIC CONTACT', width: 16, align: 'center' },
    {
      key: 'docs_status',
      title: isID ? 'STATUS DOKUMEN DIGITAL' : 'DIGITAL DOCUMENTS',
      width: 24,
      align: 'center',
    },
    { key: 'notes', title: isID ? 'CATATAN KONTRAK' : 'NOTES', width: 30, align: 'left' },
  ];

  const headerRow = worksheet.getRow(9);
  headerRow.height = 28;

  headers.forEach((h, idx) => {
    const colNumber = idx + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.title;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E293B' }, // Slate-800
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: '0F172A' } },
      bottom: { style: 'medium', color: { argb: '0F172A' } },
      left: { style: 'thin', color: { argb: '475569' } },
      right: { style: 'thin', color: { argb: '475569' } },
    };
    worksheet.getColumn(colNumber).width = h.width;
  });

  // Enable AutoFilter on header row
  worksheet.autoFilter = {
    from: { row: 9, column: 1 },
    to: { row: 9, column: headers.length },
  };

  // 5. INSERT DATA ROWS
  let currentRow = 10;

  contracts.forEach((contract, index) => {
    const row = worksheet.getRow(currentRow);
    row.height = 24;

    const isEven = index % 2 === 0;
    const defaultBgColor = isEven ? 'FFFFFF' : 'F8FAFC'; // Clean zebra striping

    // Compute status text & fill color
    let expiryLabel = isID ? 'Aktif' : 'Active';
    let expiryBgColor = defaultBgColor;
    let expiryTextColor = '0F172A';

    if (contract.expiryStatus === 'expired') {
      expiryLabel = isID ? 'Kedaluwarsa' : 'Expired';
      expiryBgColor = 'FEE2E2'; // Light rose
      expiryTextColor = '991B1B';
    } else if (contract.isH30) {
      expiryLabel = `${isID ? 'Kritis H-' : 'Critical H-'}${contract.daysRemaining}`;
      expiryBgColor = 'FFE4E6'; // Rose
      expiryTextColor = 'BE123C';
    } else if (contract.isH90) {
      expiryLabel = `${isID ? 'Peringatan H-' : 'Warning H-'}${contract.daysRemaining}`;
      expiryBgColor = 'FEF3C7'; // Amber
      expiryTextColor = '92400E';
    }

    // Docs summary string
    const docParts = [];
    if (contract.contract_pdf) docParts.push('PDF');
    if (contract.sap_po_screenshot) docParts.push('SAP');
    const attachCount = Array.isArray(contract.attachments) ? contract.attachments.length : 0;
    if (attachCount > 0) docParts.push(`${attachCount} Lampiran`);
    const docsSummary = docParts.length > 0 ? docParts.join(' + ') : isID ? 'Belum Ada' : 'None';

    const curr = (contract.currency || 'IDR').toUpperCase();
    const currencyNumFmt =
      curr === 'USD' ? '"$ "#,##0.00' : curr === 'EUR' ? '"€ "#,##0.00' : '"Rp "#,##0';

    // Values mapping
    const rowValues = [
      index + 1,
      contract.po_number,
      contract.contract_title,
      contract.category,
      contract.vendor_name,
      contract.start_date || '-',
      contract.end_date || '-',
      contract.daysRemaining,
      expiryLabel,
      contract.status || 'Active',
      curr,
      contract.contract_budget || 0,
      contract.budget_absorbed || 0,
      contract.budgetRemaining || 0,
      (contract.budgetAbsorptionPct || 0) / 100, // For Excel % format
      contract.initial_volume || 0,
      contract.absorbed_volume || 0,
      contract.volumeRemaining || 0,
      contract.volume_unit || '-',
      (contract.volumeAbsorptionPct || 0) / 100,
      contract.sla_status || 'On Track',
      contract.sla_kpi_target || '-',
      contract.pic_name || '-',
      contract.pic_contact || '-',
      docsSummary,
      contract.notes || '-',
    ];

    rowValues.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      cell.border = thinBorder;
      cell.font = { name: 'Calibri', size: 9.5, color: { argb: '1E293B' } };

      // Background Fill (default zebra or special)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: defaultBgColor },
      };

      // Alignment & Formatting rules based on column index
      const colKey = headers[colIdx].key;

      if (colKey === 'no') {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: '64748B' } };
      } else if (colKey === 'po_number') {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Consolas', size: 9.5, bold: true, color: { argb: '1E40AF' } };
      } else if (colKey === 'currency') {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = {
          name: 'Calibri',
          size: 9.5,
          bold: true,
          color:
            curr === 'USD'
              ? { argb: '2563EB' }
              : curr === 'EUR'
                ? { argb: '4F46E5' }
                : { argb: '059669' },
        };
      } else if (
        colKey === 'contract_budget' ||
        colKey === 'budget_absorbed' ||
        colKey === 'budget_remaining'
      ) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = currencyNumFmt;
        cell.font = { name: 'Calibri', size: 9.5, bold: colKey === 'contract_budget' };
      } else if (colKey === 'budget_pct' || colKey === 'volume_pct') {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.numFmt = '0.0%';
        cell.font = { name: 'Calibri', size: 9.5, bold: true };
      } else if (
        colKey === 'initial_volume' ||
        colKey === 'absorbed_volume' ||
        colKey === 'volume_remaining'
      ) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0';
      } else if (
        colKey === 'start_date' ||
        colKey === 'end_date' ||
        colKey === 'days_remaining' ||
        colKey === 'volume_unit' ||
        colKey === 'pic_contact'
      ) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colKey === 'expiry_status') {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: expiryBgColor } };
        cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: expiryTextColor } };
      } else if (colKey === 'sla_status') {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        const slaColor =
          contract.sla_status === 'Breached'
            ? 'EF4444'
            : contract.sla_status === 'Warning'
              ? 'F59E0B'
              : '10B981';
        cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: slaColor } };
      } else {
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          wrapText: colKey === 'contract_title' || colKey === 'sla_kpi_target',
        };
      }
    });

    currentRow++;
  });

  // 6. TOTAL & SUMMARY BOTTOM ROW
  const totalRow = worksheet.getRow(currentRow);
  totalRow.height = 26;

  worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
  const totalLabelCell = totalRow.getCell(1);
  totalLabelCell.value = isID ? 'TOTAL KESELURUHAN PORTOFOLIO KONTRAK' : 'PORTFOLIO GRAND TOTAL';
  totalLabelCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '0F172A' } };
  totalLabelCell.alignment = { vertical: 'middle', horizontal: 'center' };
  totalLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
  totalLabelCell.border = totalBorder;

  // Pagu Budget Total Formula (Column L, 12)
  const budgetColCell = totalRow.getCell(12);
  budgetColCell.value = { formula: `SUM(L10:L${currentRow - 1})` };
  budgetColCell.numFmt = '"Rp "#,##0';
  budgetColCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '0F172A' } };
  budgetColCell.alignment = { vertical: 'middle', horizontal: 'right' };
  budgetColCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
  budgetColCell.border = totalBorder;

  // Absorbed Budget Total Formula (Column M, 13)
  const absorbedColCell = totalRow.getCell(13);
  absorbedColCell.value = { formula: `SUM(M10:M${currentRow - 1})` };
  absorbedColCell.numFmt = '"Rp "#,##0';
  absorbedColCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '047857' } };
  absorbedColCell.alignment = { vertical: 'middle', horizontal: 'right' };
  absorbedColCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
  absorbedColCell.border = totalBorder;

  // Remaining Budget Total Formula (Column N, 14)
  const remainingColCell = totalRow.getCell(14);
  remainingColCell.value = { formula: `SUM(N10:N${currentRow - 1})` };
  remainingColCell.numFmt = '"Rp "#,##0';
  remainingColCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '1E3A8A' } };
  remainingColCell.alignment = { vertical: 'middle', horizontal: 'right' };
  remainingColCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
  remainingColCell.border = totalBorder;

  // Average Absorption % Formula (Column O, 15)
  const avgPctCell = totalRow.getCell(15);
  avgPctCell.value = { formula: `IF(L${currentRow}>0, M${currentRow}/L${currentRow}, 0)` };
  avgPctCell.numFmt = '0.0%';
  avgPctCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '0F172A' } };
  avgPctCell.alignment = { vertical: 'middle', horizontal: 'center' };
  avgPctCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
  avgPctCell.border = totalBorder;

  // Blank filler cells for remainder of total row (Columns 16 to headers.length)
  for (let c = 16; c <= headers.length; c++) {
    const fillerCell = totalRow.getCell(c);
    fillerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
    fillerCell.border = totalBorder;
  }

  // 7. MULTI-CURRENCY GRAND SUMMARY BREAKDOWN TABLE
  currentRow += 3;

  // Title Banner for Multi-Currency Summary
  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const summaryTitleCell = worksheet.getCell(`A${currentRow}`);
  summaryTitleCell.value = isID
    ? 'REKAPITULASI TOTAL ANGGARAN BERDASARKAN MATA UANG (MULTI-CURRENCY SUMMARY)'
    : 'PORTFOLIO BUDGET SUMMARY BY CURRENCY';
  summaryTitleCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: '1E3A8A' } };
  summaryTitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  summaryTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } };
  summaryTitleCell.border = thinBorder;
  worksheet.getRow(currentRow).height = 24;

  currentRow++;

  // Multi-Currency Table Headers
  const summaryHeaders = [
    { title: isID ? 'MATA UANG' : 'CURRENCY', width: 22, align: 'left' },
    { title: isID ? 'KODE' : 'CODE', width: 12, align: 'center' },
    { title: isID ? 'JUMLAH KONTRAK' : 'CONTRACT COUNT', width: 18, align: 'center' },
    { title: isID ? 'TOTAL PAGU ANGGARAN' : 'TOTAL BUDGET', width: 24, align: 'right' },
    { title: isID ? 'REALISASI SERAPAN' : 'ABSORBED BUDGET', width: 24, align: 'right' },
    { title: isID ? 'SISA PAGU ANGGARAN' : 'REMAINING BUDGET', width: 24, align: 'right' },
    { title: isID ? '% PENYERAPAN' : '% ABSORPTION', width: 16, align: 'center' },
  ];

  const summaryHeaderRow = worksheet.getRow(currentRow);
  summaryHeaderRow.height = 24;

  summaryHeaders.forEach((sh, idx) => {
    const cell = summaryHeaderRow.getCell(idx + 1);
    cell.value = sh.title;
    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });

  currentRow++;

  // Currency Data Rows
  const currencyConfigs = [
    { code: 'IDR', name: 'Indonesian Rupiah (IDR)', symbol: 'Rp', numFmt: '"Rp "#,##0' },
    { code: 'USD', name: 'US Dollar (USD)', symbol: '$', numFmt: '"$ "#,##0.00' },
    { code: 'EUR', name: 'Euro (EUR)', symbol: '€', numFmt: '"€ "#,##0.00' },
  ];

  currencyConfigs.forEach((cc) => {
    const currencyContracts = contracts.filter(
      (c) => (c.currency || 'IDR').toUpperCase() === cc.code
    );
    const count = currencyContracts.length;
    const cBudget = currencyContracts.reduce((acc, c) => acc + (Number(c.contract_budget) || 0), 0);
    const cAbsorbed = currencyContracts.reduce(
      (acc, c) => acc + (Number(c.budget_absorbed) || 0),
      0
    );
    const cRemaining = Math.max(0, cBudget - cAbsorbed);
    const cPct = cBudget > 0 ? cAbsorbed / cBudget : 0;

    const row = worksheet.getRow(currentRow);
    row.height = 22;

    const cValues = [cc.name, cc.code, count, cBudget, cAbsorbed, cRemaining, cPct];

    cValues.forEach((val, idx) => {
      const cell = row.getCell(idx + 1);
      cell.value = val;
      cell.border = thinBorder;
      cell.font = { name: 'Calibri', size: 9.5, color: { argb: '1E293B' } };

      if (idx === 0) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.font = { name: 'Calibri', size: 9.5, bold: true };
      } else if (idx === 1 || idx === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Calibri', size: 9.5, bold: idx === 1 };
      } else if (idx >= 3 && idx <= 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = cc.numFmt;
        cell.font = { name: 'Calibri', size: 9.5, bold: idx === 3 };
      } else if (idx === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.numFmt = '0.0%';
        cell.font = { name: 'Calibri', size: 9.5, bold: true };
      }
    });

    currentRow++;
  });

  // 8. WRITE TO BUFFER & SAVE
  const buffer = await workbook.xlsx.writeBuffer();
  const fileBlob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `SIPOMA_Rekapitulasi_Kontrak_SLA_${dateStr}.xlsx`;
  saveAs(fileBlob, fileName);
};
