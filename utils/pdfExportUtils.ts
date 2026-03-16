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
