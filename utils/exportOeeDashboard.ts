import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportOeeDashboard = async (
  date: string,
  unitMetrics: any[],
  allData: {
    parameters: any[];
    downtime: any[];
    capacity: any[];
  }
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIPOMA System';
  workbook.lastModifiedBy = 'SIPOMA System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. OEE SUMMARY SHEET
  const summarySheet = workbook.addWorksheet('OEE Summary');
  summarySheet.columns = [
    { header: 'Unit', key: 'unit', width: 15 },
    { header: 'Availability (%)', key: 'availability', width: 15 },
    { header: 'Performance (%)', key: 'performance', width: 15 },
    { header: 'Quality (%)', key: 'quality', width: 15 },
    { header: 'OEE (%)', key: 'oee', width: 15 },
    { header: 'MTD OEE (%)', key: 'mtd', width: 15 },
    { header: 'YTD OEE (%)', key: 'ytd', width: 15 },
  ];

  unitMetrics.forEach((m) => {
    summarySheet.addRow({
      unit: m.unit,
      availability: m.daily.availability.toFixed(2),
      performance: m.daily.performance.toFixed(2),
      quality: m.daily.quality.toFixed(2),
      oee: m.daily.oee.toFixed(2),
      mtd: m.comparisons.mtd.toFixed(2),
      ytd: m.comparisons.ytd.toFixed(2),
    });
  });

  // Apply basic styling to header
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  };

  // 2. DOWNTIME DETAIL SHEET
  const downtimeSheet = workbook.addWorksheet('Downtime Analysis');
  downtimeSheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Start Time', key: 'start_time', width: 10 },
    { header: 'Duration (min)', key: 'duration', width: 15 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Remarks', key: 'remarks', width: 40 },
  ];

  allData.downtime.forEach((d) => {
    downtimeSheet.addRow({
      date: d.date,
      unit: d.plant_unit,
      start_time: d.start_time,
      duration: d.duration,
      status: d.status,
      remarks: d.remarks,
    });
  });

  // 3. PERFORMANCE HOURLY SHEET
  const perfSheet = workbook.addWorksheet('Hourly Performance');
  const perfHeader = ['Unit', 'Date', ...Array.from({ length: 24 }, (_, i) => `H${i + 1}`)];
  perfSheet.addRow(perfHeader);

  allData.parameters.forEach((p) => {
    const row = [p.plant_unit, p.date];
    for (let i = 1; i <= 24; i++) {
      row.push(p[`hour${i}`] || 0);
    }
    perfSheet.addRow(row);
  });

  // SAVE FILE
  const buffer = await workbook.xlsx.writeBuffer();
  const fileBlob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(fileBlob, `OEE_Dashboard_Report_${date}.xlsx`);
};
