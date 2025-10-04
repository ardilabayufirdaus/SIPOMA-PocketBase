import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useReportSettings } from '../../hooks/useReportSettings';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { useCcrParameterData } from '../../hooks/useCcrParameterData';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import useCcrDowntimeData from '../../hooks/useCcrDowntimeData';
import { useCcrSiloData } from '../../hooks/useCcrSiloData';
import { useSiloCapacities } from '../../hooks/useSiloCapacities';
import {
  ParameterSetting,
  CcrParameterData,
  ParameterDataType,
  CcrDowntimeData,
  SiloCapacity,
} from '../../types';
import {
  formatDate,
  formatNumberIndonesian,
  calculateDuration,
  formatDuration,
} from '../../utils/formatters';
import { EnhancedButton, useAccessibility } from '../../components/ui/EnhancedComponents';
import { InteractiveReport } from './components/InteractiveReport';

declare global {
  interface Window {
    jspdf: any;
  }
}

// Canvas Drawing Helper
const drawReportOnCanvas = (canvas: HTMLCanvasElement, data: any, t: any) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { groupedHeaders, rows, footer, title, date, downtimeData, siloData, operatorData } = data;
  const allParams = groupedHeaders.flatMap((g: any) => g.parameters);

  // --- Configuration (Logical units) ---
  const FONT_FAMILY = 'Inter, sans-serif';
  const PADDING = 40;
  const HEADER_HEIGHT = 100;
  const ROW_HEIGHT = 32;
  const FOOTER_ROW_HEIGHT = 36;
  const COL_HOUR_WIDTH = 70;
  const COL_SHIFT_WIDTH = 110;
  const baseWidth = 2400; // The report's logical width for high quality

  const availableWidth = baseWidth - PADDING * 2 - COL_HOUR_WIDTH - COL_SHIFT_WIDTH;
  const paramColWidth = allParams.length > 0 ? availableWidth / allParams.length : 100;
  const tableHeaderHeight = 60;
  const tableStartY = HEADER_HEIGHT + PADDING / 2;
  const totalTableHeight =
    tableHeaderHeight + rows.length * ROW_HEIGHT + Object.keys(footer).length * FOOTER_ROW_HEIGHT;

  // --- Operator Table Configuration ---
  const OPERATOR_SPACING = 40;
  const OPERATOR_TITLE_HEIGHT = 40;
  const OPERATOR_HEADER_HEIGHT = 40;
  const OPERATOR_ROW_HEIGHT = 32;

  const operatorTableHeight =
    operatorData && operatorData.length > 0
      ? OPERATOR_SPACING +
        OPERATOR_TITLE_HEIGHT +
        OPERATOR_HEADER_HEIGHT +
        operatorData.length * OPERATOR_ROW_HEIGHT
      : 0;

  // --- Silo Table Configuration ---
  const SILO_SPACING = 40;
  const SILO_TITLE_HEIGHT = 40;
  const SILO_HEADER_HEIGHT = 60; // For nested headers
  const SILO_ROW_HEIGHT = 32;

  const siloTableHeight =
    siloData && siloData.length > 0
      ? SILO_SPACING + SILO_TITLE_HEIGHT + SILO_HEADER_HEIGHT + siloData.length * SILO_ROW_HEIGHT
      : 0;

  // --- Downtime Table Configuration ---
  const DOWNTIME_SPACING = 40;
  const DOWNTIME_TITLE_HEIGHT = 40;
  const DOWNTIME_HEADER_HEIGHT = 40;
  const DOWNTIME_ROW_HEIGHT = 32;

  const downtimeTableHeight =
    downtimeData && downtimeData.length > 0
      ? DOWNTIME_SPACING +
        DOWNTIME_TITLE_HEIGHT +
        DOWNTIME_HEADER_HEIGHT +
        downtimeData.length * DOWNTIME_ROW_HEIGHT
      : 0;

  const baseHeight =
    tableStartY +
    totalTableHeight +
    operatorTableHeight +
    siloTableHeight +
    downtimeTableHeight +
    PADDING;

  // --- High-Resolution Scaling ---
  const ratio = 3;

  canvas.width = baseWidth * ratio;
  canvas.height = baseHeight * ratio;
  canvas.style.width = `${baseWidth}px`;
  canvas.style.height = `${baseHeight}px`;

  ctx.scale(ratio, ratio);

  // --- Styles ---
  const styles = {
    headerBg: '#1E293B', // slate-800
    headerText: '#FFFFFF',
    titleFont: `bold 28px ${FONT_FAMILY}`,
    subtitleFont: `16px ${FONT_FAMILY}`,
    tableHeaderBg: '#F1F5F9', // slate-100
    tableHeaderText: '#475569', // slate-600
    tableHeaderTextBold: `bold 13px ${FONT_FAMILY}`,
    tableHeaderTextSmall: `11px ${FONT_FAMILY}`,
    borderColor: '#E2E8F0', // slate-200
    rowText: `13px ${FONT_FAMILY}`,
    rowTextBold: `bold 13px ${FONT_FAMILY}`,
    textColor: '#334155', // slate-700
  };

  // 1. Clear & Draw Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, baseWidth, baseHeight);

  // 2. Draw Main Header
  ctx.fillStyle = styles.headerBg;
  ctx.fillRect(0, 0, baseWidth, HEADER_HEIGHT);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.moveTo(PADDING, HEADER_HEIGHT - 15);
  ctx.lineTo(PADDING, 15);
  ctx.lineTo(PADDING + 25, 35);
  ctx.lineTo(PADDING + 25, HEADER_HEIGHT - 15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.beginPath();
  ctx.moveTo(PADDING + 25, HEADER_HEIGHT - 15);
  ctx.lineTo(PADDING + 25, 35);
  ctx.lineTo(PADDING + 50, 15);
  ctx.lineTo(PADDING + 50, HEADER_HEIGHT - 15);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = styles.headerText;
  ctx.font = styles.titleFont;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, PADDING + 65, HEADER_HEIGHT / 2 - 10);
  ctx.font = styles.subtitleFont;
  ctx.fillText(`SIPOMA - ${t.appSubtitle}`, PADDING + 65, HEADER_HEIGHT / 2 + 15);

  ctx.textAlign = 'right';
  ctx.fillText(date, baseWidth - PADDING, HEADER_HEIGHT / 2);

  // 3. Draw Parameter Table Headers
  let currentX = PADDING + COL_HOUR_WIDTH + COL_SHIFT_WIDTH;
  ctx.fillStyle = styles.tableHeaderBg;
  ctx.fillRect(PADDING, tableStartY, baseWidth - PADDING * 2, tableHeaderHeight);

  ctx.font = styles.tableHeaderTextBold;
  ctx.fillStyle = styles.tableHeaderText;
  ctx.textAlign = 'center';

  groupedHeaders.forEach((group: any) => {
    const groupWidth = group.parameters.length * paramColWidth;
    const categoryX = currentX + groupWidth / 2;
    ctx.fillText(group.category, categoryX, tableStartY + 20);
    currentX += groupWidth;
  });

  ctx.font = styles.tableHeaderTextSmall;
  let paramX = PADDING + COL_HOUR_WIDTH + COL_SHIFT_WIDTH;
  allParams.forEach((param: any) => {
    const text = param.parameter;
    ctx.fillText(text, paramX + paramColWidth / 2, tableStartY + 45, paramColWidth - 8);
    paramX += paramColWidth;
  });

  ctx.font = styles.tableHeaderTextBold;
  ctx.fillText(t.hour, PADDING + COL_HOUR_WIDTH / 2, tableStartY + tableHeaderHeight / 2);
  ctx.fillText(
    t.shift,
    PADDING + COL_HOUR_WIDTH + COL_SHIFT_WIDTH / 2,
    tableStartY + tableHeaderHeight / 2
  );

  // 4. Draw Parameter Table Body
  let currentY = tableStartY + tableHeaderHeight;
  ctx.font = styles.rowText;
  ctx.fillStyle = styles.textColor;

  rows.forEach((row: any, rowIndex: number) => {
    ctx.textBaseline = 'middle';
    if (rowIndex % 2 !== 0) {
      ctx.fillStyle = '#F8FAFC'; // slate-50
      ctx.fillRect(PADDING, currentY, baseWidth - PADDING * 2, ROW_HEIGHT);
      ctx.fillStyle = styles.textColor;
    }

    ctx.textAlign = 'center';
    ctx.fillText(
      row.hour.toString().padStart(2, '0') + ':00',
      PADDING + COL_HOUR_WIDTH / 2,
      currentY + ROW_HEIGHT / 2
    );
    ctx.fillText(
      row.shift,
      PADDING + COL_HOUR_WIDTH + COL_SHIFT_WIDTH / 2,
      currentY + ROW_HEIGHT / 2
    );

    paramX = PADDING + COL_HOUR_WIDTH + COL_SHIFT_WIDTH;
    allParams.forEach((param: any) => {
      const value = row.values[param.id];
      const text = typeof value === 'number' ? formatNumberIndonesian(value) : value || '-';
      ctx.fillText(text, paramX + paramColWidth / 2, currentY + ROW_HEIGHT / 2);
      paramX += paramColWidth;
    });
    currentY += ROW_HEIGHT;
  });

  // 5. Draw Parameter Table Footer
  ctx.font = styles.rowTextBold;
  Object.entries(footer).forEach(([statName, values]) => {
    ctx.fillStyle = styles.tableHeaderBg;
    ctx.fillRect(PADDING, currentY, baseWidth - PADDING * 2, FOOTER_ROW_HEIGHT);
    ctx.fillStyle = styles.tableHeaderText;
    ctx.textAlign = 'right';
    ctx.fillText(
      statName,
      PADDING + COL_HOUR_WIDTH + COL_SHIFT_WIDTH - 10,
      currentY + FOOTER_ROW_HEIGHT / 2
    );

    ctx.textAlign = 'center';
    paramX = PADDING + COL_HOUR_WIDTH + COL_SHIFT_WIDTH;
    allParams.forEach((param: any) => {
      const value = (values as any)[param.id];
      const text = typeof value === 'number' ? formatNumberIndonesian(value) : value || '-';
      ctx.fillText(text, paramX + paramColWidth / 2, currentY + FOOTER_ROW_HEIGHT / 2);
      paramX += paramColWidth;
    });
    currentY += FOOTER_ROW_HEIGHT;
  });

  // 6. Draw Parameter Table Borders
  ctx.strokeStyle = styles.borderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(PADDING, tableStartY, baseWidth - PADDING * 2, currentY - tableStartY);
  paramX = PADDING + COL_HOUR_WIDTH;
  ctx.beginPath();
  ctx.moveTo(paramX, tableStartY);
  ctx.lineTo(paramX, currentY);
  paramX += COL_SHIFT_WIDTH;
  ctx.moveTo(paramX, tableStartY);
  ctx.lineTo(paramX, currentY);
  allParams.forEach(() => {
    ctx.moveTo(paramX + paramColWidth, tableStartY);
    ctx.lineTo(paramX + paramColWidth, currentY);
    paramX += paramColWidth;
  });
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(PADDING, tableStartY + tableHeaderHeight);
  ctx.lineTo(baseWidth - PADDING, tableStartY + tableHeaderHeight);
  ctx.moveTo(PADDING + COL_HOUR_WIDTH + COL_SHIFT_WIDTH, tableStartY + 28);
  ctx.lineTo(baseWidth - PADDING, tableStartY + 28);
  ctx.stroke();

  // 7. Draw Operator Table (if data exists)
  if (operatorData && operatorData.length > 0) {
    currentY += OPERATOR_SPACING;
    const operatorTableStartY = currentY;

    // Draw Title
    ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.fillStyle = styles.textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.operator_report_title, PADDING, currentY + OPERATOR_TITLE_HEIGHT / 2);
    currentY += OPERATOR_TITLE_HEIGHT;

    // Define columns
    const operatorTableWidth = baseWidth / 2.5 - PADDING; // Use a fraction of the width for a compact table
    const opCols = {
      shift: operatorTableWidth * 0.45,
      name: operatorTableWidth * 0.55,
    };

    // Draw Headers
    ctx.fillStyle = styles.tableHeaderBg;
    ctx.fillRect(PADDING, currentY, operatorTableWidth, OPERATOR_HEADER_HEIGHT);
    ctx.font = styles.tableHeaderTextBold;
    ctx.fillStyle = styles.tableHeaderText;
    ctx.textAlign = 'center';
    ctx.fillText(t.shift, PADDING + opCols.shift / 2, currentY + OPERATOR_HEADER_HEIGHT / 2);
    ctx.fillText(
      t.name,
      PADDING + opCols.shift + opCols.name / 2,
      currentY + OPERATOR_HEADER_HEIGHT / 2
    );
    currentY += OPERATOR_HEADER_HEIGHT;

    // Draw Rows
    ctx.font = styles.rowText;
    ctx.fillStyle = styles.textColor;
    operatorData.forEach((op: any, index: number) => {
      if (index % 2 !== 0) {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(PADDING, currentY, operatorTableWidth, OPERATOR_ROW_HEIGHT);
        ctx.fillStyle = styles.textColor;
      }

      ctx.textAlign = 'center';
      ctx.fillText(op.shift, PADDING + opCols.shift / 2, currentY + OPERATOR_ROW_HEIGHT / 2);
      ctx.fillText(
        op.name,
        PADDING + opCols.shift + opCols.name / 2,
        currentY + OPERATOR_ROW_HEIGHT / 2
      );

      currentY += OPERATOR_ROW_HEIGHT;
    });

    // Draw Borders
    ctx.strokeStyle = styles.borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      PADDING,
      operatorTableStartY + OPERATOR_TITLE_HEIGHT,
      operatorTableWidth,
      currentY - (operatorTableStartY + OPERATOR_TITLE_HEIGHT)
    );
    ctx.beginPath();
    const vLineX = PADDING + opCols.shift;
    ctx.moveTo(vLineX, operatorTableStartY + OPERATOR_TITLE_HEIGHT);
    ctx.lineTo(vLineX, currentY);
    ctx.stroke();
  }

  // 8. Draw Silo Stock Table (if data exists)
  if (siloData && siloData.length > 0) {
    currentY += SILO_SPACING;
    const siloTableStartY = currentY;

    // Draw Title
    ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.fillStyle = styles.textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.silo_stock_report_title, PADDING, currentY + SILO_TITLE_HEIGHT / 2);
    currentY += SILO_TITLE_HEIGHT;

    // Define columns
    const siloTableWidth = baseWidth - PADDING * 2;
    const colSiloNameWidth = 300;
    const shiftColWidth = (siloTableWidth - colSiloNameWidth) / 3;
    const subColWidth = shiftColWidth / 3;

    // Draw Headers
    ctx.fillStyle = styles.tableHeaderBg;
    ctx.fillRect(PADDING, currentY, siloTableWidth, SILO_HEADER_HEIGHT);
    ctx.font = styles.tableHeaderTextBold;
    ctx.fillStyle = styles.tableHeaderText;
    ctx.textAlign = 'center';

    let headerX = PADDING + colSiloNameWidth;
    ['shift_1', 'shift_2', 'shift_3'].forEach((shiftKey) => {
      ctx.fillText(t[shiftKey], headerX + shiftColWidth / 2, currentY + 20);
      headerX += shiftColWidth;
    });

    ctx.font = styles.tableHeaderTextSmall;
    headerX = PADDING + colSiloNameWidth;
    for (let i = 0; i < 3; i++) {
      ctx.fillText(t.empty_space, headerX + subColWidth / 2, currentY + 45, subColWidth - 4);
      headerX += subColWidth;
      ctx.fillText(t.content, headerX + subColWidth / 2, currentY + 45, subColWidth - 4);
      headerX += subColWidth;
      ctx.fillText(t.percentage, headerX + subColWidth / 2, currentY + 45, subColWidth - 4);
      headerX += subColWidth;
    }

    ctx.font = styles.tableHeaderTextBold;
    ctx.textAlign = 'left';
    ctx.fillText(t.silo_name, PADDING + 15, currentY + SILO_HEADER_HEIGHT / 2);
    currentY += SILO_HEADER_HEIGHT;

    // Draw Rows
    ctx.font = styles.rowText;
    ctx.fillStyle = styles.textColor;
    siloData.forEach((sd: any, index: number) => {
      if (index % 2 !== 0) {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(PADDING, currentY, siloTableWidth, SILO_ROW_HEIGHT);
        ctx.fillStyle = styles.textColor;
      }

      ctx.textAlign = 'left';
      ctx.fillText(
        sd.master.silo_name,
        PADDING + 15,
        currentY + SILO_ROW_HEIGHT / 2,
        colSiloNameWidth - 20
      );

      ctx.textAlign = 'center';
      let cellX = PADDING + colSiloNameWidth;
      ['shift1', 'shift2', 'shift3'].forEach((shiftKey) => {
        const shiftData = sd[shiftKey];
        const content = shiftData?.content;
        const capacity = sd.master.capacity;
        const percentage =
          capacity > 0 && typeof content === 'number' ? (content / capacity) * 100 : 0;

        ctx.fillText(
          formatNumberIndonesian(shiftData?.emptySpace) || '-',
          cellX + subColWidth / 2,
          currentY + SILO_ROW_HEIGHT / 2
        );
        cellX += subColWidth;
        ctx.fillText(
          formatNumberIndonesian(content) || '-',
          cellX + subColWidth / 2,
          currentY + SILO_ROW_HEIGHT / 2
        );
        cellX += subColWidth;
        ctx.fillText(
          percentage > 0 ? `${percentage.toFixed(1)}%` : '-',
          cellX + subColWidth / 2,
          currentY + SILO_ROW_HEIGHT / 2
        );
        cellX += subColWidth;
      });

      currentY += SILO_ROW_HEIGHT;
    });

    // Draw Borders
    ctx.strokeStyle = styles.borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(PADDING, siloTableStartY, siloTableWidth, currentY - siloTableStartY);
    ctx.beginPath();
    let vLineX = PADDING + colSiloNameWidth;
    ctx.moveTo(vLineX, siloTableStartY + SILO_TITLE_HEIGHT); // Silo Name vertical line
    ctx.lineTo(vLineX, currentY);

    ctx.moveTo(PADDING, siloTableStartY + SILO_TITLE_HEIGHT + 28); // Horizontal sub-header line
    ctx.lineTo(baseWidth - PADDING, siloTableStartY + SILO_TITLE_HEIGHT + 28);

    for (let i = 0; i < 3; i++) {
      ctx.moveTo(vLineX, siloTableStartY + SILO_TITLE_HEIGHT); // Main shift vertical lines
      ctx.lineTo(vLineX, currentY);
      let subLineX = vLineX;
      for (let j = 0; j < 2; j++) {
        subLineX += subColWidth;
        ctx.moveTo(subLineX, siloTableStartY + SILO_TITLE_HEIGHT + 28); // Sub-col vertical lines
        ctx.lineTo(subLineX, currentY);
      }
      vLineX += shiftColWidth;
    }
    ctx.stroke();
  }

  // 9. Draw Downtime Table (if data exists)
  if (downtimeData && downtimeData.length > 0) {
    currentY += DOWNTIME_SPACING;
    const downtimeTableStartY = currentY;

    // Draw Title
    ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.fillStyle = styles.textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.downtime_report_title, PADDING, currentY + DOWNTIME_TITLE_HEIGHT / 2);
    currentY += DOWNTIME_TITLE_HEIGHT;

    // Define columns
    const downtimeTableWidth = baseWidth - PADDING * 2;
    const dtCols = {
      start: 100,
      end: 100,
      duration: 120,
      pic: 200,
      problem: 0,
    };
    dtCols.problem = downtimeTableWidth - dtCols.start - dtCols.end - dtCols.duration - dtCols.pic;

    const dtHeaders = [
      { key: 'start_time', label: t.start_time, width: dtCols.start },
      { key: 'end_time', label: t.end_time, width: dtCols.end },
      { key: 'duration', label: t.duration, width: dtCols.duration },
      { key: 'pic', label: t.pic, width: dtCols.pic },
      { key: 'problem', label: t.problem, width: dtCols.problem },
    ];

    // Draw Headers
    ctx.fillStyle = styles.tableHeaderBg;
    ctx.fillRect(PADDING, currentY, downtimeTableWidth, DOWNTIME_HEADER_HEIGHT);
    ctx.font = styles.tableHeaderTextBold;
    ctx.fillStyle = styles.tableHeaderText;
    ctx.textAlign = 'center';
    let headerX = PADDING;
    dtHeaders.forEach((header) => {
      ctx.fillText(header.label, headerX + header.width / 2, currentY + DOWNTIME_HEADER_HEIGHT / 2);
      headerX += header.width;
    });
    currentY += DOWNTIME_HEADER_HEIGHT;

    // Draw Rows
    ctx.font = styles.rowText;
    ctx.fillStyle = styles.textColor;
    downtimeData.forEach((d: CcrDowntimeData, index: number) => {
      if (index % 2 !== 0) {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(PADDING, currentY, downtimeTableWidth, DOWNTIME_ROW_HEIGHT);
        ctx.fillStyle = styles.textColor;
      }

      // FIX: Use snake_case properties `start_time` and `end_time`
      const { hours, minutes } = calculateDuration(d.start_time, d.end_time);
      const durationText = formatDuration(hours, minutes);

      let cellX = PADDING;
      ctx.textAlign = 'center';
      // FIX: Use snake_case properties `start_time` and `end_time`
      ctx.fillText(d.start_time, cellX + dtCols.start / 2, currentY + DOWNTIME_ROW_HEIGHT / 2);
      cellX += dtCols.start;
      ctx.fillText(d.end_time, cellX + dtCols.end / 2, currentY + DOWNTIME_ROW_HEIGHT / 2);
      cellX += dtCols.end;
      ctx.fillText(durationText, cellX + dtCols.duration / 2, currentY + DOWNTIME_ROW_HEIGHT / 2);
      cellX += dtCols.duration;
      ctx.fillText(d.pic, cellX + dtCols.pic / 2, currentY + DOWNTIME_ROW_HEIGHT / 2);
      cellX += dtCols.pic;

      ctx.textAlign = 'left';
      ctx.fillText(
        d.problem.replace(/\n/g, ' '),
        cellX + 10,
        currentY + DOWNTIME_ROW_HEIGHT / 2,
        dtCols.problem - 20
      );

      currentY += DOWNTIME_ROW_HEIGHT;
    });

    // Draw Borders for Downtime Table
    ctx.strokeStyle = styles.borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      PADDING,
      downtimeTableStartY + DOWNTIME_TITLE_HEIGHT,
      downtimeTableWidth,
      currentY - (downtimeTableStartY + DOWNTIME_TITLE_HEIGHT)
    );
    ctx.beginPath();
    let vLineX = PADDING;
    dtHeaders.slice(0, -1).forEach((h) => {
      vLineX += h.width;
      ctx.moveTo(vLineX, downtimeTableStartY + DOWNTIME_TITLE_HEIGHT);
      ctx.lineTo(vLineX, currentY);
    });
    ctx.stroke();
  }
};

const ReportPage: React.FC<{ t: Record<string, string> }> = ({ t }) => {
  const { announceToScreenReader } = useAccessibility();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<{
    groupedHeaders: Array<{
      category: string;
      parameters: Array<{
        id: string;
        parameter: string;
        unit: string;
        data_type: string;
      }>;
    }>;
    rows: Array<{
      hour: number;
      shift: string;
      values: Record<string, string | number>;
    }>;
    footer: Record<string, Record<string, string>>;
    title: string;
    date: string;
    downtimeData: CcrDowntimeData[];
    siloData: Array<{
      master: {
        silo_name: string;
        capacity: number;
      };
      shift1: {
        emptySpace?: number;
        content?: number;
      };
      shift2: {
        emptySpace?: number;
        content?: number;
      };
      shift3: {
        emptySpace?: number;
        content?: number;
      };
    }>;
    operatorData: Array<{
      shift: string;
      name: string;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { records: reportSettings, loading: reportSettingsLoading } = useReportSettings();
  const { records: parameterSettings, loading: parameterSettingsLoading } = useParameterSettings();
  const { getDataForDate } = useCcrParameterData();
  const { records: plantUnits, loading: plantUnitsLoading } = usePlantUnits();
  const { getDowntimeForDate } = useCcrDowntimeData();
  const { getDataForDate: getSiloDataForDate } = useCcrSiloData();
  const { records: siloMasterData, loading: siloMasterLoading } = useSiloCapacities();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');

  const plantCategories = useMemo(() => {
    if (plantUnitsLoading || !plantUnits.length) return [];
    return [...new Set(plantUnits.map((unit) => unit.category).sort())];
  }, [plantUnits, plantUnitsLoading]);

  const unitsForCategory = useMemo(() => {
    if (plantUnitsLoading || !plantUnits.length || !selectedCategory) return [];
    return plantUnits
      .filter((unit) => unit.category === selectedCategory)
      .map((unit) => unit.unit)
      .sort();
  }, [plantUnits, selectedCategory, plantUnitsLoading]);

  useEffect(() => {
    if (plantCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(plantCategories[0]);
    }
  }, [plantCategories]); // Removed selectedCategory to prevent loop

  useEffect(() => {
    if (unitsForCategory.length > 0) {
      if (!unitsForCategory.includes(selectedUnit)) {
        setSelectedUnit(unitsForCategory[0]);
      }
    } else {
      if (selectedUnit !== '') {
        setSelectedUnit('');
      }
    }
  }, [unitsForCategory]); // Simplified dependency

  useEffect(() => {
    setReportData(null);
  }, [selectedCategory, selectedUnit, selectedDate]);

  const reportConfig = useMemo(() => {
    if (
      reportSettingsLoading ||
      parameterSettingsLoading ||
      !reportSettings.length ||
      !parameterSettings.length
    ) {
      return [];
    }

    const paramMap = new Map(parameterSettings.map((p) => [p.id, p]));

    const filteredSettings = reportSettings.filter((rs) => {
      // FIX: Use snake_case property `parameter_id`
      const param = paramMap.get(rs.parameter_id) as ParameterSetting | undefined;
      return param && param.unit === selectedUnit && param.category === selectedCategory;
    });

    const settingsWithDetails = filteredSettings
      .map((rs) => ({
        ...rs,
        // FIX: Use snake_case property `parameter_id`
        parameter: paramMap.get(rs.parameter_id) as ParameterSetting | undefined,
      }))
      .filter((rs): rs is typeof rs & { parameter: ParameterSetting } => !!rs.parameter);

    const grouped = settingsWithDetails.reduce(
      (acc, current) => {
        const category = current.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(current.parameter);
        return acc;
      },
      {} as Record<string, ParameterSetting[]>
    );

    return Object.entries(grouped).map(([category, parameters]) => ({
      category,
      parameters: (parameters as ParameterSetting[]).sort((a, b) =>
        a.parameter.localeCompare(b.parameter)
      ),
    }));
  }, [
    reportSettings,
    parameterSettings,
    selectedUnit,
    selectedCategory,
    reportSettingsLoading,
    parameterSettingsLoading,
  ]);

  const getShiftForHour = (h: number) => {
    if (h >= 1 && h <= 7) return `${t.shift_3} (${t.shift_3_cont})`;
    if (h >= 8 && h <= 15) return t.shift_1;
    if (h >= 16 && h <= 22) return t.shift_2;
    return t.shift_3;
  };

  const handleGenerateReport = useCallback(async () => {
    if (!canvasRef.current || reportConfig.length === 0) return;

    // Validasi filter sebelum generate
    if (!selectedCategory || !selectedUnit) {
      console.warn('Category and unit must be selected before generating report');
      return;
    }

    setIsLoading(true);
    setReportData(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 50));

      // FIX: await async data fetching functions
      const ccrDataForDate = await getDataForDate(selectedDate);
      // FIX: Use snake_case property `parameter_id`
      const ccrDataMap = new Map(ccrDataForDate.map((d) => [d.parameter_id, d]));

      const downtimeDataForDate = getDowntimeForDate(selectedDate);
      const filteredDowntimeData = downtimeDataForDate.filter((d) => d.unit === selectedUnit);

      // FIX: await async data fetching functions
      const allSiloDataForDate = await getSiloDataForDate(selectedDate);
      const siloMasterMap = new Map(siloMasterData.map((s) => [s.id, s]));
      const filteredSiloData = allSiloDataForDate
        .filter((data) => {
          // FIX: Use snake_case property `silo_id`
          const master = siloMasterMap.get(data.silo_id) as SiloCapacity | undefined;
          return master && master.unit === selectedUnit;
        })
        .map((data) => ({
          ...data,
          master: siloMasterMap.get(data.silo_id) as SiloCapacity | undefined,
        })) // FIX: Use snake_case property `silo_id`
        .filter((data): data is typeof data & { master: SiloCapacity } => !!data.master);

      const operatorParam = parameterSettings.find((p) => p.parameter === 'Operator Name');
      let operatorData: { shift: string; name: string }[] = [];

      if (operatorParam) {
        const operatorDataRecord = ccrDataMap.get(operatorParam.id) as CcrParameterData | undefined;

        const getOperatorForShift = (hours: number[]) => {
          if (!operatorDataRecord) return '-';
          for (const hour of hours) {
            // FIX: Use snake_case property `hourly_values`
            const hourData = operatorDataRecord.hourly_values[hour];

            // Handle new structure: {value, user_name, timestamp} or legacy direct value
            let operator = '';
            if (hourData && typeof hourData === 'object' && 'value' in hourData) {
              operator = String(hourData.value || '');
            } else if (typeof hourData === 'string' || typeof hourData === 'number') {
              operator = String(hourData);
            }

            if (operator && operator.trim() !== '') return operator;
          }
          return '-';
        };

        operatorData = [
          {
            shift: `${t.shift_3} (${t.shift_3_cont})`,
            name: getOperatorForShift([1, 2, 3, 4, 5, 6, 7]),
          },
          {
            shift: t.shift_1,
            name: getOperatorForShift([8, 9, 10, 11, 12, 13, 14, 15]),
          },
          {
            shift: t.shift_2,
            name: getOperatorForShift([16, 17, 18, 19, 20, 21, 22]),
          },
          { shift: t.shift_3, name: getOperatorForShift([23, 24]) },
        ];
      }

      const allParams = reportConfig.flatMap((g) => g.parameters);

      const rows = Array.from({ length: 24 }, (_, i) => {
        const hour = i + 1;
        const values: Record<string, string | number> = {};
        allParams.forEach((param) => {
          // FIX: Use snake_case property `hourly_values`
          const paramData = ccrDataMap.get(param.id) as CcrParameterData | undefined;
          const hourData = paramData?.hourly_values[hour];

          // Handle new structure: {value, user_name, timestamp} or legacy direct value
          if (hourData && typeof hourData === 'object' && 'value' in hourData) {
            values[param.id] = hourData.value;
          } else if (typeof hourData === 'string' || typeof hourData === 'number') {
            values[param.id] = hourData;
          } else {
            values[param.id] = '';
          }
        });
        return {
          hour,
          shift: getShiftForHour(hour),
          values,
        };
      });

      const footerStats: { [key: string]: { [key: string]: string } } = {
        [t.average]: {},
        [t.min]: {},
        [t.max]: {},
      };

      allParams.forEach((param) => {
        // FIX: Use snake_case property `data_type`
        if (param.data_type === ParameterDataType.NUMBER) {
          const values = rows
            .map((r) => {
              const val = r.values[param.id];
              // Exclude empty strings, null, undefined, and convert to number
              return val !== '' && val != null && val != undefined ? Number(val) : NaN;
            })
            .filter((v) => !isNaN(v) && v !== 0); // Exclude NaN and 0 values
          if (values.length > 0) {
            footerStats[t.average][param.id] = formatNumberIndonesian(
              values.reduce((a, b) => a + b, 0) / values.length
            );
            footerStats[t.min][param.id] = formatNumberIndonesian(Math.min(...values));
            footerStats[t.max][param.id] = formatNumberIndonesian(Math.max(...values));
          }
        }
      });

      const dataForReport = {
        groupedHeaders: reportConfig,
        rows,
        footer: footerStats,
        title: `${t.op_report_title} - ${selectedUnit}`,
        date: formatDate(selectedDate),
        downtimeData: filteredDowntimeData,
        siloData: filteredSiloData,
        operatorData: operatorData,
      };

      setReportData(dataForReport);

      // Also draw on canvas for download functionality
      drawReportOnCanvas(canvasRef.current, dataForReport, t);
    } catch (error) {
      console.error('Error generating report:', error);
      // Could add toast notification here for user feedback
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedDate,
    selectedUnit,
    selectedCategory,
    reportConfig,
    t,
    getDataForDate,
    getDowntimeForDate,
    getSiloDataForDate,
    siloMasterData,
    parameterSettings,
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.op_report}
          </h2>
          <div className="flex flex-col lg:flex-row items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label
                htmlFor="report-category"
                className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap"
              >
                {t.plant_category_label}:
              </label>
              <select
                id="report-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              >
                {plantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label
                htmlFor="report-unit"
                className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap"
              >
                {t.unit_label}:
              </label>
              <select
                id="report-unit"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                disabled={unitsForCategory.length === 0}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-600"
              >
                {unitsForCategory.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label
                htmlFor="report-date"
                className="text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                {t.select_date}:
              </label>
              <input
                type="date"
                id="report-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <EnhancedButton
                onClick={handleGenerateReport}
                disabled={isLoading || reportConfig.length === 0}
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                ariaLabel={t.generate_report_button}
                loading={isLoading}
              >
                {isLoading ? t.generating_report_message : t.generate_report_button}
              </EnhancedButton>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md min-h-[60vh] flex items-center justify-center">
        <canvas ref={canvasRef} className="hidden"></canvas>
        {reportConfig.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400">
            <h3 className="text-lg font-semibold">{t.no_report_parameters}</h3>
            <p>Please configure parameters in Plant Operations - Master Data.</p>
          </div>
        )}
        {isLoading && (
          <div className="text-center text-slate-500 dark:text-slate-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4">{t.generating_report_message}</p>
          </div>
        )}
        {reportData && !isLoading && (
          <InteractiveReport
            groupedHeaders={reportData.groupedHeaders}
            rows={reportData.rows}
            footer={reportData.footer}
            title={reportData.title}
            date={reportData.date}
            downtimeData={reportData.downtimeData}
            siloData={reportData.siloData}
            operatorData={reportData.operatorData}
            t={t}
          />
        )}
        {!isLoading && !reportData && reportConfig.length > 0 && (
          <div className="text-center text-slate-400 dark:text-slate-500">
            <p>
              Select filters and click &quot;Generate Report&quot; to view the daily operational
              report.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;
