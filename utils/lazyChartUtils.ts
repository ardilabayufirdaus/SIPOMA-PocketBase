// Lazy load Chart.js components to reduce initial bundle size
let ChartJS: typeof import('chart.js') | null = null;
let ReactChartJS: typeof import('react-chartjs-2') | null = null;

const getChartJS = async () => {
  if (!ChartJS || !ReactChartJS) {
    const [chartModule, reactChartModule] = await Promise.all([
      import('chart.js'),
      import('react-chartjs-2'),
    ]);

    ChartJS = chartModule;
    ReactChartJS = reactChartModule;

    // Register common components
    ChartJS.register(
      chartModule.ArcElement,
      chartModule.Tooltip,
      chartModule.Legend,
      chartModule.CategoryScale,
      chartModule.LinearScale,
      chartModule.BarElement,
      chartModule.LineElement,
      chartModule.PointElement
    );
  }
  return { ChartJS, ReactChartJS };
};

export const getLazyChartComponents = async () => {
  const { ChartJS, ReactChartJS } = await getChartJS();
  return {
    ChartJS,
    Doughnut: ReactChartJS.Doughnut,
    Bar: ReactChartJS.Bar,
    Line: ReactChartJS.Line,
    Pie: ReactChartJS.Pie,
  };
};
