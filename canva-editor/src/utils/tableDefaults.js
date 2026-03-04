import { CHART_COLOR_SCHEMES } from './defaults';

export function generateDefaultCells(rows, cols, colorScheme = 'purple', style = 'clean') {
  const colors = CHART_COLOR_SCHEMES[colorScheme] || CHART_COLOR_SCHEMES.purple;
  const primary = colors[0];
  const cells = [];

  for (let r = 0; r < rows; r++) {
    const row = [];
    const isHeaderRow = r === 0;
    const isHeaderCol = (c) => c === 0;

    for (let c = 0; c < cols; c++) {
      const isHeader = isHeaderRow || isHeaderCol(c);
      let bg = '#ffffff';
      let color = '#1e293b';

      if (style === 'dark') {
        bg = isHeader ? primary : '#1e293b';
        color = '#ffffff';
      } else if (style === 'striped') {
        bg = isHeader ? primary : r % 2 === 0 ? '#ffffff' : '#f8fafc';
        color = isHeader ? '#ffffff' : '#1e293b';
      } else if (style === 'minimal') {
        bg = isHeader ? primary : '#ffffff';
        color = isHeader ? '#ffffff' : '#1e293b';
      } else if (style === 'bordered') {
        bg = isHeader ? primary : '#ffffff';
        color = isHeader ? '#ffffff' : '#1e293b';
      } else {
        bg = isHeader ? primary : '#ffffff';
        color = isHeader ? '#ffffff' : '#1e293b';
      }

      row.push({
        text: r === 0 && c === 0 ? 'Header' : `Cell ${r + 1},${c + 1}`,
        bold: isHeader,
        align: c === 0 ? 'left' : 'center',
        bg,
        color,
      });
    }
    cells.push(row);
  }
  return cells;
}

export const TABLE_PRESETS = [
  { id: 'blank-2x2', label: '2×2 Table', rows: 2, cols: 2, headerRow: true, headerCol: false, style: 'clean', colorScheme: 'purple' },
  { id: 'blank-3x3', label: '3×3 Table', rows: 3, cols: 3, headerRow: true, headerCol: false, style: 'clean', colorScheme: 'purple' },
  { id: 'blank-4x4', label: '4×4 Table', rows: 4, cols: 4, headerRow: true, headerCol: false, style: 'clean', colorScheme: 'purple' },
  {
    id: 'kpi-summary',
    label: 'KPI Summary',
    rows: 2,
    cols: 4,
    headerRow: true,
    headerCol: false,
    style: 'striped',
    colorScheme: 'purple',
    cells: [
      [{ text: 'Metric', bold: true, align: 'left', bg: '#7c3aed', color: '#ffffff' }, { text: 'Q1', bold: true, align: 'center', bg: '#7c3aed', color: '#ffffff' }, { text: 'Q2', bold: true, align: 'center', bg: '#7c3aed', color: '#ffffff' }, { text: 'Q3', bold: true, align: 'center', bg: '#7c3aed', color: '#ffffff' }],
      [{ text: 'Revenue', bold: false, align: 'left', bg: '#ffffff', color: '#1e293b' }, { text: '$240K', bold: false, align: 'center', bg: '#ffffff', color: '#1e293b' }, { text: '$310K', bold: false, align: 'center', bg: '#ffffff', color: '#1e293b' }, { text: '$380K', bold: false, align: 'center', bg: '#ffffff', color: '#1e293b' }],
    ],
  },
  {
    id: 'comparison',
    label: 'Comparison Table',
    rows: 4,
    cols: 3,
    headerRow: true,
    headerCol: false,
    style: 'bordered',
    colorScheme: 'blue',
    cells: [
      [{ text: 'Feature', bold: true, align: 'left', bg: '#2563eb', color: '#ffffff' }, { text: 'Plan A', bold: true, align: 'center', bg: '#2563eb', color: '#ffffff' }, { text: 'Plan B', bold: true, align: 'center', bg: '#2563eb', color: '#ffffff' }],
      [{ text: 'Storage', bold: false, align: 'left', bg: '#ffffff', color: '#1e293b' }, { text: 'Yes', bold: false, align: 'center', bg: '#f0fdf4', color: '#16a34a' }, { text: 'Yes', bold: false, align: 'center', bg: '#f0fdf4', color: '#16a34a' }],
      [{ text: 'Support', bold: false, align: 'left', bg: '#f8fafc', color: '#1e293b' }, { text: 'No', bold: false, align: 'center', bg: '#fef2f2', color: '#dc2626' }, { text: 'Yes', bold: false, align: 'center', bg: '#f0fdf4', color: '#16a34a' }],
      [{ text: 'API', bold: false, align: 'left', bg: '#ffffff', color: '#1e293b' }, { text: 'No', bold: false, align: 'center', bg: '#fef2f2', color: '#dc2626' }, { text: 'Yes', bold: false, align: 'center', bg: '#f0fdf4', color: '#16a34a' }],
    ],
  },
  {
    id: 'timeline',
    label: 'Timeline Table',
    rows: 5,
    cols: 2,
    headerRow: true,
    headerCol: false,
    style: 'minimal',
    colorScheme: 'teal',
    cells: [
      [{ text: 'Phase', bold: true, align: 'left', bg: '#0d9488', color: '#ffffff' }, { text: 'Timeline', bold: true, align: 'left', bg: '#0d9488', color: '#ffffff' }],
      [{ text: 'Discovery', bold: false, align: 'left', bg: '#ffffff', color: '#1e293b' }, { text: 'Weeks 1-2', bold: false, align: 'left', bg: '#ffffff', color: '#64748b' }],
      [{ text: 'Design', bold: false, align: 'left', bg: '#f8fafc', color: '#1e293b' }, { text: 'Weeks 3-4', bold: false, align: 'left', bg: '#f8fafc', color: '#64748b' }],
      [{ text: 'Build', bold: false, align: 'left', bg: '#ffffff', color: '#1e293b' }, { text: 'Weeks 5-10', bold: false, align: 'left', bg: '#ffffff', color: '#64748b' }],
      [{ text: 'Launch', bold: false, align: 'left', bg: '#f8fafc', color: '#1e293b' }, { text: 'Week 11', bold: false, align: 'left', bg: '#f8fafc', color: '#64748b' }],
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing Table',
    rows: 5,
    cols: 4,
    headerRow: true,
    headerCol: false,
    style: 'striped',
    colorScheme: 'purple',
    cells: [
      [{ text: 'Plan', bold: true, align: 'left', bg: '#7c3aed', color: '#ffffff' }, { text: 'Starter', bold: true, align: 'center', bg: '#7c3aed', color: '#ffffff' }, { text: 'Pro', bold: true, align: 'center', bg: '#7c3aed', color: '#ffffff' }, { text: 'Enterprise', bold: true, align: 'center', bg: '#7c3aed', color: '#ffffff' }],
      [{ text: 'Price', bold: false, align: 'left', bg: '#ffffff', color: '#1e293b' }, { text: '$0/mo', bold: false, align: 'center', bg: '#ffffff', color: '#1e293b' }, { text: '$29/mo', bold: false, align: 'center', bg: '#ffffff', color: '#7c3aed' }, { text: 'Custom', bold: false, align: 'center', bg: '#ffffff', color: '#1e293b' }],
      [{ text: 'Users', bold: false, align: 'left', bg: '#f8fafc', color: '#1e293b' }, { text: '3', bold: false, align: 'center', bg: '#f8fafc', color: '#64748b' }, { text: 'Unlimited', bold: false, align: 'center', bg: '#f8fafc', color: '#64748b' }, { text: 'Unlimited', bold: false, align: 'center', bg: '#f8fafc', color: '#64748b' }],
      [{ text: 'Storage', bold: false, align: 'left', bg: '#ffffff', color: '#1e293b' }, { text: '5 GB', bold: false, align: 'center', bg: '#ffffff', color: '#64748b' }, { text: '50 GB', bold: false, align: 'center', bg: '#ffffff', color: '#64748b' }, { text: 'Unlimited', bold: false, align: 'center', bg: '#ffffff', color: '#64748b' }],
      [{ text: 'Support', bold: false, align: 'left', bg: '#f8fafc', color: '#1e293b' }, { text: 'Email', bold: false, align: 'center', bg: '#f8fafc', color: '#64748b' }, { text: 'Priority', bold: false, align: 'center', bg: '#f8fafc', color: '#64748b' }, { text: 'Dedicated', bold: false, align: 'center', bg: '#f8fafc', color: '#64748b' }],
    ],
  },
];
