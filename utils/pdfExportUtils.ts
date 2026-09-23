import { format } from 'date-fns';

interface ExportProjectData {
  title: string;
  status: string;
  progress: number;
  budget: string | number;
  tasksCount: number;
  completedTasksCount: number;
}

interface ExportMetrics {
  totalProjects: number;
  avgProgress: string;
  completedProjects: number;
  delayedProjects: number;
  activeTasks: number;
  overdueTasks: number;
  projectHealthScore: number;
}

export const exportDashboardToPDF = async (
  projects: ExportProjectData[],
  metrics: ExportMetrics,
  t: Record<string, string>,
  charts?: Record<string, string>
) => {
  // Dynamic imports for library stability
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: false, // Keep images sharp
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  const colors: Record<string, [number, number, number]> = {
    aubergine: [44, 0, 30],
    purple: [119, 33, 111],
    orange: [233, 84, 32],
    green: [14, 132, 32],
    slate: [100, 116, 139],
    lightSlate: [241, 245, 249],
  };

  // Header
  doc.setFillColor(colors.aubergine[0], colors.aubergine[1], colors.aubergine[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('SIPOMA', margin, 20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(t.project_dashboard_title || 'Project Management Dashboard', margin, 28);

  const dateStr = format(new Date(), 'dd MMMM yyyy, HH:mm');
  doc.setFontSize(10);
  doc.text(`Generated on: ${dateStr}`, pageWidth - margin, 20, { align: 'right' });
  doc.text(`Health Score: ${metrics.projectHealthScore}%`, pageWidth - margin, 28, {
    align: 'right',
  });

  // Insights Section
  let currentY = 50;
  doc.setTextColor(colors.aubergine[0], colors.aubergine[1], colors.aubergine[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(t.executive_insights || 'Executive Insights', margin, currentY);
  currentY += 8;

  const tileWidth = (pageWidth - margin * 2 - 10) / 3;
  const tileHeight = 25;

  const drawTile = (
    x: number,
    y: number,
    label: string,
    value: string | number,
    color: number[]
  ) => {
    doc.setFillColor(colors.lightSlate[0], colors.lightSlate[1], colors.lightSlate[2]);
    doc.roundedRect(x, y, tileWidth, tileHeight, 3, 3, 'F');
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(x, y, 2, tileHeight, 'F');
    doc.setTextColor(colors.slate[0], colors.slate[1], colors.slate[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(label.toUpperCase(), x + 6, y + 8);
    doc.setTextColor(colors.aubergine[0], colors.aubergine[1], colors.aubergine[2]);
    doc.setFontSize(16);
    doc.text(String(value), x + 6, y + 18);
  };

  drawTile(
    margin,
    currentY,
    t.total_projects || 'Total Projects',
    metrics.totalProjects,
    colors.aubergine
  );
  drawTile(
    margin + tileWidth + 5,
    currentY,
    t.overall_progress_all || 'Overall Progress',
    metrics.avgProgress,
    colors.orange
  );
  drawTile(
    margin + (tileWidth + 5) * 2,
    currentY,
    t.projects_completed_count || 'Completed',
    metrics.completedProjects,
    colors.green
  );
  currentY += tileHeight + 5;
  drawTile(
    margin,
    currentY,
    t.projects_delayed || 'Delayed',
    metrics.delayedProjects,
    colors.orange
  );
  drawTile(
    margin + tileWidth + 5,
    currentY,
    t.active_tasks || 'Active Tasks',
    metrics.activeTasks,
    colors.purple
  );
  drawTile(
    margin + (tileWidth + 5) * 2,
    currentY,
    t.overdue_tasks || 'Overdue Tasks',
    metrics.overdueTasks,
    colors.orange
  );
  currentY += tileHeight + 15;

  // Visual Analytics
  if (charts && Object.keys(charts).length > 0) {
    doc.setTextColor(colors.aubergine[0], colors.aubergine[1], colors.aubergine[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Visual Analytics', margin, currentY);
    currentY += 10;

    const boxWidth = (pageWidth - margin * 2 - 10) / 2;

    // Row 1: Donut (Square) & Financial (Rect)
    if (charts.statusDonut) {
      doc.setFontSize(10);
      doc.text(t.projects_by_status || 'Projects by Status', margin, currentY - 3);
      const donutDim = 55; // Square
      const donutX = margin + (boxWidth - donutDim) / 2;
      doc.addImage(
        charts.statusDonut,
        'PNG',
        donutX,
        currentY,
        donutDim,
        donutDim,
        undefined,
        'SLOW'
      );
    }

    if (charts.budgetComparison) {
      doc.setFontSize(10);
      doc.text(t.financial_overview || 'Financial Overview', margin + boxWidth + 10, currentY - 3);
      const budgetW = boxWidth;
      const budgetH = 55; // Aspect ratio matches h-64 in JS
      doc.addImage(
        charts.budgetComparison,
        'PNG',
        margin + boxWidth + 10,
        currentY,
        budgetW,
        budgetH,
        undefined,
        'SLOW'
      );
    }

    currentY += 65 + 15;

    // Row 2: Tasks Forecast (Wide)
    if (charts.resourceAllocation) {
      doc.setFontSize(10);
      doc.text(t.tasks_forecast || 'Tasks Forecast', margin, currentY - 3);
      const forecastW = pageWidth - margin * 2;
      const forecastH = 70; // Aspect ratio matches h-48 in JS
      doc.addImage(
        charts.resourceAllocation,
        'PNG',
        margin,
        currentY,
        forecastW,
        forecastH,
        undefined,
        'SLOW'
      );
      currentY += forecastH + 15;
    }
  }

  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 25;
  }

  // Table
  doc.setTextColor(colors.aubergine[0], colors.aubergine[1], colors.aubergine[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(t.project_list || 'Project Performance List', margin, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    head: [['Project Name', 'Status', 'Progress', 'Budget', 'Tasks (Done/Total)']],
    body: projects.map((p) => [
      p.title,
      p.status,
      `${p.progress.toFixed(1)}%`,
      p.budget,
      `${p.completedTasksCount} / ${p.tasksCount}`,
    ]),
    headStyles: {
      fillColor: colors.purple,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: margin, right: margin },
  });

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(colors.slate[0], colors.slate[1], colors.slate[2]);
    doc.text(
      `SIPOMA - Project Management Report | Page ${i} of ${pages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  doc.save(`SIPOMA_Project_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export interface ProjectDetailPDFData {
  projectTitle: string;
  projectDescription?: string;
  budget: number;
  projectStatus: string;
  healthScore: number;
  healthGrade: string;
  overallProgress: number;
  plannedProgress: number;
  deviation: number;
  spi: number;
  duration: number;
  daysElapsed: number;
  daysRemaining: number;
  startDateFormatted: string;
  endDateFormatted: string;
  predictedCompletionFormatted: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  sCurveImage?: string | null;
  tasks: {
    activity: string;
    plannedStart: string;
    plannedEnd: string;
    actualStart: string;
    actualEnd: string;
    percentComplete: number;
    status: string;
    photoUrls?: string[];
  }[];
}

export const exportProjectDetailReportToPDF = async (
  data: ProjectDetailPDFData,
  t: Record<string, string>
) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: false,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const colors = {
    primary: [30, 41, 59] as [number, number, number], // slate-800
    indigo: [79, 70, 229] as [number, number, number], // indigo-600
    emerald: [16, 185, 129] as [number, number, number], // emerald-500
    rose: [225, 29, 72] as [number, number, number], // rose-600
    slate: [100, 116, 139] as [number, number, number], // slate-500
    lightBg: [248, 250, 252] as [number, number, number], // slate-50
    border: [226, 232, 240] as [number, number, number],
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1: RINGKASAN EKSEKUTIF & KURVA-S PROGRESS
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. Top Header Bar
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Decorative accent line
  doc.setFillColor(colors.indigo[0], colors.indigo[1], colors.indigo[2]);
  doc.rect(0, 34, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PT SEMEN TONASA', margin, 14);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('SIPOMA - EXECUTIVE PROJECT MANAGEMENT REPORT', margin, 21);
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text('CONFIDENTIAL - FOR INTERNAL MANAGEMENT USE ONLY', margin, 27);

  const dateStr = format(new Date(), 'dd MMMM yyyy, HH:mm');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Dicetak: ${dateStr}`, pageWidth - margin, 14, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${data.projectStatus.toUpperCase()}`, pageWidth - margin, 20, {
    align: 'right',
  });
  doc.text(`Health Score: ${data.healthScore}% (${data.healthGrade})`, pageWidth - margin, 26, {
    align: 'right',
  });

  // 2. Project Title & Scope
  let currentY = 43;
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.projectTitle, margin, currentY);

  currentY += 5.5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.slate[0], colors.slate[1], colors.slate[2]);
  const scheduleLine = `Periode Proyek: ${data.startDateFormatted} s/d ${data.endDateFormatted} (${data.duration || 0} Hari Kalender)`;
  doc.text(scheduleLine, margin, currentY);

  if (data.projectDescription) {
    currentY += 4.5;
    const splitDesc = doc.splitTextToSize(data.projectDescription, pageWidth - margin * 2);
    doc.text(splitDesc, margin, currentY);
    currentY += splitDesc.length * 3.8;
  } else {
    currentY += 3;
  }

  // 3. Strategic KPI Cards (4 Tiles)
  currentY += 3;
  const colGap = 3.5;
  const tileWidth = (pageWidth - margin * 2 - colGap * 3) / 4;
  const tileHeight = 20;

  const drawKpiTile = (
    x: number,
    y: number,
    title: string,
    value: string,
    subValue: string,
    accentColor: [number, number, number]
  ) => {
    doc.setFillColor(colors.lightBg[0], colors.lightBg[1], colors.lightBg[2]);
    doc.roundedRect(x, y, tileWidth, tileHeight, 2, 2, 'F');

    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.roundedRect(x, y, tileWidth, tileHeight, 2, 2, 'S');

    // Accent left bar
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(x, y, 1.8, tileHeight, 'F');

    doc.setTextColor(colors.slate[0], colors.slate[1], colors.slate[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(title.toUpperCase(), x + 3.5, y + 5.5);

    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFontSize(11);
    doc.text(value, x + 3.5, y + 12.5);

    doc.setTextColor(colors.slate[0], colors.slate[1], colors.slate[2]);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(subValue, x + 3.5, y + 17);
  };

  drawKpiTile(
    margin,
    currentY,
    'Progress Aktual',
    `${data.overallProgress.toFixed(1)}%`,
    `Target: ${data.plannedProgress.toFixed(1)}%`,
    colors.emerald
  );

  drawKpiTile(
    margin + tileWidth + colGap,
    currentY,
    'Deviasi Jadwal',
    `${data.deviation > 0 ? '+' : ''}${data.deviation.toFixed(1)}%`,
    `Indeks SPI: ${data.spi.toFixed(2)}`,
    data.deviation >= 0 ? colors.indigo : colors.rose
  );

  drawKpiTile(
    margin + (tileWidth + colGap) * 2,
    currentY,
    'Timeline Durasi',
    `${data.duration || 0} Hari`,
    `${data.daysRemaining} hari tersisa`,
    colors.indigo
  );

  const budgetStr = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(data.budget || 0);

  drawKpiTile(
    margin + (tileWidth + colGap) * 3,
    currentY,
    'Total Anggaran',
    budgetStr,
    `${data.totalTasks} Tugas Terdaftar`,
    colors.primary
  );

  currentY += tileHeight + 5;

  // 4. Executive Summary Callout Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 20, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 20, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('RINGKASAN EKSEKUTIF & REKOMENDASI PIMPINAN:', margin + 3.5, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `• Status proyek saat ini ${data.projectStatus} (Deviasi ${data.deviation > 0 ? '+' : ''}${data.deviation.toFixed(1)}%, SPI ${data.spi.toFixed(2)}). Prediksi selesai: ${data.predictedCompletionFormatted || data.endDateFormatted}.`,
    margin + 3.5,
    currentY + 10
  );
  doc.text(
    `• Distribusi tugas: ${data.completedTasks} Selesai, ${data.inProgressTasks} Sedang Berjalan, dan ${data.overdueTasks} Melewati Batas Waktu.`,
    margin + 3.5,
    currentY + 15
  );

  currentY += 25;

  // 5. Kurva-S Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('KURVA-S PROGRESS (PLANNED VS ACTUAL CUMULATIVE)', margin, currentY);

  currentY += 4;
  const chartHeight = 118;

  if (data.sCurveImage) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, chartHeight, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, chartHeight, 2, 2, 'S');

      doc.addImage(
        data.sCurveImage,
        'PNG',
        margin + 2,
        currentY + 2,
        pageWidth - margin * 2 - 4,
        chartHeight - 4,
        undefined,
        'FAST'
      );
    } catch {
      // Fallback if image rendering fails
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, chartHeight, 2, 2, 'F');
    }
  } else {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, chartHeight, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, chartHeight, 2, 2, 'S');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.slate[0], colors.slate[1], colors.slate[2]);
    doc.text('Kurva-S visualisasi progress proyek', pageWidth / 2, currentY + chartHeight / 2, {
      align: 'center',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2: GANTT CHART TIMELINE & TABEL DELIVERABLES
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();

  // Page 2 Mini Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setFillColor(colors.indigo[0], colors.indigo[1], colors.indigo[2]);
  doc.rect(0, 20, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PT SEMEN TONASA', margin, 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`JADWAL GANTT & TABEL AKTIVITAS PROYEK — ${data.projectTitle}`, margin, 16);

  doc.setFontSize(7.5);
  doc.text(`Dicetak: ${dateStr}`, pageWidth - margin, 14, { align: 'right' });

  currentY = 27;

  // 6. Visual Vector Gantt Chart Timeline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('VISUALISASI JADWAL GANTT TIMELINE', margin, currentY);

  currentY += 4;
  const ganttHeight = Math.min(68, 10 + data.tasks.length * 4.6);
  const ganttLabelWidth = 52;
  const ganttChartWidth = pageWidth - margin * 2 - ganttLabelWidth;
  const ganttChartX = margin + ganttLabelWidth;

  // Gantt box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, ganttHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, ganttHeight, 2, 2, 'S');

  // Calculate timeline start and end timestamps
  const parseTaskTime = (tStr: string) => {
    if (!tStr || tStr === '-') return 0;
    const parts = tStr.split(/[/-]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
      } else if (parts[0].length === 4) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
      }
    }
    const d = new Date(tStr).getTime();
    return isNaN(d) ? 0 : d;
  };

  const startTimes = data.tasks
    .map((t_task) => parseTaskTime(t_task.plannedStart))
    .filter((t_val) => t_val > 0);
  const endTimes = data.tasks
    .map((t_task) => parseTaskTime(t_task.plannedEnd))
    .filter((t_val) => t_val > 0);

  const minTime = startTimes.length > 0 ? Math.min(...startTimes) : Date.now();
  const maxTime = endTimes.length > 0 ? Math.max(...endTimes) : minTime + 86400000 * 30;
  const totalTimelineSpan = Math.max(86400000, maxTime - minTime);

  // Time grid line headers
  const numGridLines = 4;
  for (let g = 0; g <= numGridLines; g++) {
    const gridX = ganttChartX + (g / numGridLines) * ganttChartWidth;
    const gridDate = new Date(minTime + (g / numGridLines) * totalTimelineSpan);
    const dateLabel = `${String(gridDate.getDate()).padStart(2, '0')}/${String(gridDate.getMonth() + 1).padStart(2, '0')}`;

    doc.setDrawColor(226, 232, 240);
    doc.line(gridX, currentY + 6, gridX, currentY + ganttHeight - 2);

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(dateLabel, gridX, currentY + 5, { align: 'center' });
  }

  // Draw task bars
  const todayTime = new Date().setHours(0, 0, 0, 0);
  const maxTasksToShow = Math.min(data.tasks.length, 12);
  const rowH = (ganttHeight - 8) / maxTasksToShow;

  for (let idx = 0; idx < maxTasksToShow; idx++) {
    const task = data.tasks[idx];
    const taskRowY = currentY + 7 + idx * rowH;

    // Task label
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const truncatedLabel =
      task.activity.length > 28 ? task.activity.substring(0, 26) + '...' : task.activity;
    doc.text(truncatedLabel, margin + 3, taskRowY + rowH * 0.7);

    // Calculate bar X and width
    const pStart = parseTaskTime(task.plannedStart) || minTime;
    const pEnd = parseTaskTime(task.plannedEnd) || pStart;

    const offsetRatio = Math.max(0, Math.min(1, (pStart - minTime) / totalTimelineSpan));
    const durationRatio = Math.max(
      0.02,
      Math.min(1 - offsetRatio, Math.max(86400000, pEnd - pStart + 86400000) / totalTimelineSpan)
    );

    const barX = ganttChartX + offsetRatio * ganttChartWidth;
    const barW = Math.max(2.5, durationRatio * ganttChartWidth);
    const barH = Math.max(2.2, rowH * 0.55);
    const barY = taskRowY + (rowH - barH) / 2;

    // Planned bar (light indigo background)
    doc.setFillColor(224, 231, 255);
    doc.roundedRect(barX, barY, barW, barH, 0.6, 0.6, 'F');

    // Progress fill bar
    const pct = task.percentComplete || 0;
    if (pct > 0) {
      const fillW = Math.max(1, barW * (pct / 100));
      if (pct >= 100) {
        doc.setFillColor(16, 185, 129); // Emerald
      } else {
        doc.setFillColor(79, 70, 229); // Indigo
      }
      doc.roundedRect(barX, barY, fillW, barH, 0.6, 0.6, 'F');
    }

    // Overdue outline marker
    if (pct < 100 && pEnd < todayTime) {
      doc.setDrawColor(225, 29, 72);
      doc.roundedRect(barX, barY, barW, barH, 0.6, 0.6, 'S');
    }

    // Percentage text
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(pct >= 100 ? 16 : 79, pct >= 100 ? 185 : 70, pct >= 100 ? 129 : 229);
    doc.text(`${pct}%`, barX + barW + 1.2, barY + barH * 0.8);
  }

  currentY += ganttHeight + 6;

  // 7. Tasks Deliverables Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('RINCIAN AKTIVITAS & DELIVERABLES PROYEK', margin, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'No',
        'Aktivitas / Deliverables',
        'Rencana Mulai',
        'Rencana Selesai',
        'Realisasi Mulai',
        'Progress (%)',
        'Status',
      ],
    ],
    body: data.tasks.map((t_task, idx) => [
      idx + 1,
      t_task.activity,
      t_task.plannedStart || '-',
      t_task.plannedEnd || '-',
      t_task.actualStart || '-',
      `${t_task.percentComplete}%`,
      t_task.status,
    ]),
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  // 8. Signature & Approval Section
  const finalY = (doc as any).lastAutoTable
    ? (doc as any).lastAutoTable.finalY + 12
    : currentY + 35;

  if (finalY > pageHeight - 40) {
    doc.addPage();
  }

  const signY = finalY > pageHeight - 40 ? 30 : finalY;
  const signColWidth = (pageWidth - margin * 2) / 3;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);

  doc.text('Dibuat Oleh:', margin + signColWidth * 0.5, signY, { align: 'center' });
  doc.text('Diperiksa Oleh:', margin + signColWidth * 1.5, signY, { align: 'center' });
  doc.text('Disetujui Oleh:', margin + signColWidth * 2.5, signY, { align: 'center' });

  doc.text('( Project Leader )', margin + signColWidth * 0.5, signY + 18, { align: 'center' });
  doc.text('( Unit Manager )', margin + signColWidth * 1.5, signY + 18, { align: 'center' });
  doc.text('( General Manager / Direksi )', margin + signColWidth * 2.5, signY + 18, {
    align: 'center',
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 3+: EVIDENCE & DOKUMENTASI FOTO AKTIVITAS PROYEK
  // ═══════════════════════════════════════════════════════════════════════════
  const convertImageUrlToBase64 = async (
    url: string
  ): Promise<{ base64: string; width: number; height: number } | null> => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) return null;
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const img = new Image();
          img.onload = () => {
            resolve({
              base64,
              width: img.naturalWidth || 800,
              height: img.naturalHeight || 600,
            });
          };
          img.onerror = () => resolve({ base64, width: 800, height: 600 });
          img.src = base64;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('Failed to load image for PDF:', url, err);
      return null;
    }
  };

  interface EvidenceItem {
    activity: string;
    plannedStart: string;
    plannedEnd: string;
    actualStart: string;
    actualEnd: string;
    percentComplete: number;
    status: string;
    photoUrl: string;
  }

  const rawEvidenceList: EvidenceItem[] = [];
  data.tasks.forEach((t_task) => {
    if (t_task.photoUrls && t_task.photoUrls.length > 0) {
      t_task.photoUrls.forEach((url) => {
        if (url) {
          rawEvidenceList.push({
            activity: t_task.activity,
            plannedStart: t_task.plannedStart,
            plannedEnd: t_task.plannedEnd,
            actualStart: t_task.actualStart,
            actualEnd: t_task.actualEnd,
            percentComplete: t_task.percentComplete,
            status: t_task.status,
            photoUrl: url,
          });
        }
      });
    }
  });

  if (rawEvidenceList.length > 0) {
    const loadedEvidence = await Promise.all(
      rawEvidenceList.map(async (item) => {
        const imgData = await convertImageUrlToBase64(item.photoUrl);
        return { ...item, imgData };
      })
    );

    const validEvidence = loadedEvidence.filter((item) => item.imgData && item.imgData.base64);

    if (validEvidence.length > 0) {
      const itemsPerPage = 4;
      const totalEvidencePages = Math.ceil(validEvidence.length / itemsPerPage);

      for (let pageIdx = 0; pageIdx < totalEvidencePages; pageIdx++) {
        doc.addPage();

        // Page Header
        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setFillColor(colors.indigo[0], colors.indigo[1], colors.indigo[2]);
        doc.rect(0, 20, pageWidth, 1.5, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('PT SEMEN TONASA', margin, 10);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`DOKUMENTASI & EVIDENCE FOTO AKTIVITAS PROYEK — ${data.projectTitle}`, margin, 16);

        doc.setFontSize(7.5);
        doc.text(`Dicetak: ${dateStr}`, pageWidth - margin, 14, { align: 'right' });

        const evCurrentY = 27;

        // Section Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text(
          `LAMPIRAN EVIDENCE VISUAL (HALAMAN ${pageIdx + 1} DARI ${totalEvidencePages})`,
          margin,
          evCurrentY
        );

        const gridStartY = evCurrentY + 5;

        // 2x2 Grid Configuration
        const cardGapX = 6;
        const cardGapY = 6;
        const cardWidth = (pageWidth - margin * 2 - cardGapX) / 2;
        const cardHeight = 114;

        const pageItems = validEvidence.slice(pageIdx * itemsPerPage, (pageIdx + 1) * itemsPerPage);

        pageItems.forEach((evItem, itemIdx) => {
          const col = itemIdx % 2;
          const row = Math.floor(itemIdx / 2);
          const cardX = margin + col * (cardWidth + cardGapX);
          const cardY = gridStartY + row * (cardHeight + cardGapY);

          // Card Background & Outer Border
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, 'S');

          // Photo container area (within card)
          const photoContainerX = cardX + 3;
          const photoContainerY = cardY + 3;
          const photoContainerW = cardWidth - 6;
          const photoContainerH = 76;

          // Photo container background
          doc.setFillColor(241, 245, 249);
          doc.roundedRect(
            photoContainerX,
            photoContainerY,
            photoContainerW,
            photoContainerH,
            1.5,
            1.5,
            'F'
          );
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(
            photoContainerX,
            photoContainerY,
            photoContainerW,
            photoContainerH,
            1.5,
            1.5,
            'S'
          );

          // Draw Image with Aspect Ratio Preservation
          if (evItem.imgData) {
            try {
              const origW = evItem.imgData.width || 800;
              const origH = evItem.imgData.height || 600;
              const aspectRatio = origW / origH;

              let drawW = photoContainerW;
              let drawH = drawW / aspectRatio;

              if (drawH > photoContainerH) {
                drawH = photoContainerH;
                drawW = drawH * aspectRatio;
              }

              const imgX = photoContainerX + (photoContainerW - drawW) / 2;
              const imgY = photoContainerY + (photoContainerH - drawH) / 2;

              doc.addImage(
                evItem.imgData.base64,
                'JPEG',
                imgX,
                imgY,
                drawW,
                drawH,
                undefined,
                'FAST'
              );
            } catch (imgErr) {
              console.warn('Error inserting image into PDF:', imgErr);
            }
          }

          // Metadata Caption Box
          const metaY = photoContainerY + photoContainerH + 3.5;

          // Activity Title
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          const truncatedTitle =
            evItem.activity.length > 42
              ? evItem.activity.substring(0, 40) + '...'
              : evItem.activity;
          doc.text(truncatedTitle, cardX + 3.5, metaY + 1.5);

          // Schedule & Date info
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          const dateLabel =
            evItem.actualStart && evItem.actualStart !== '-'
              ? `Realisasi: ${evItem.actualStart}${evItem.actualEnd && evItem.actualEnd !== '-' ? ` s/d ${evItem.actualEnd}` : ''}`
              : `Rencana: ${evItem.plannedStart} s/d ${evItem.plannedEnd}`;
          doc.text(dateLabel, cardX + 3.5, metaY + 6.5);

          // Progress & Status Pill Badge
          const isDone = evItem.percentComplete >= 100;
          const isOverdue = evItem.status === 'Terlambat';
          const badgeBgColor = isDone ? colors.emerald : isOverdue ? colors.rose : colors.indigo;

          const badgeW = 38;
          const badgeH = 5.5;
          const badgeX = cardX + cardWidth - badgeW - 3.5;
          const badgeY = metaY + 10;

          doc.setFillColor(badgeBgColor[0], badgeBgColor[1], badgeBgColor[2]);
          doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, 'F');

          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(5.5);
          doc.text(
            `${evItem.percentComplete}% • ${evItem.status.toUpperCase()}`,
            badgeX + badgeW / 2,
            badgeY + 3.8,
            { align: 'center' }
          );
        });
      }
    }
  }

  // 9. Page Numbering & Watermark
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(colors.slate[0], colors.slate[1], colors.slate[2]);
    doc.text(
      `SIPOMA • PT Semen Tonasa - Laporan Manajemen Proyek | Halaman ${i} dari ${pages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const cleanTitle = data.projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`Laporan_Eksekutif_${cleanTitle}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};
