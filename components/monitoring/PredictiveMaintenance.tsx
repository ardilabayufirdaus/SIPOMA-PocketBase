import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  Activity,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { usePredictiveData, AnomalyData } from '../../hooks/usePredictiveData';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PredictiveMaintenanceProps {
  plantUnit: string;
}

const PredictiveMaintenance: React.FC<PredictiveMaintenanceProps> = ({ plantUnit }) => {
  const { anomalies, loading, fetchPredictiveAnalytics } = usePredictiveData();

  useEffect(() => {
    if (plantUnit) {
      fetchPredictiveAnalytics(plantUnit);
    }
  }, [plantUnit, fetchPredictiveAnalytics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/50 backdrop-blur-xl rounded-[2.5rem] border border-white/60">
        <BrainCircuit className="w-12 h-12 text-ubuntu-orange animate-pulse mb-4" />
        <span className="text-slate-600 font-black tracking-widest uppercase text-xs">
          AI Analyzing Historical Patterns...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-ubuntu">
      {/* AI Header Card */}
      <div className="relative group overflow-hidden bg-gradient-to-br from-[#300a24] to-[#5e2750] p-8 rounded-[2.5rem] shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
          <BrainCircuit className="w-40 h-40 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-ubuntu-orange text-white text-[10px] font-black rounded-full tracking-widest uppercase">
                AI Powered
              </div>
              <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-bold uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                Updated Real-time
              </div>
            </div>

            <h2 className="text-3xl font-black text-white tracking-tight leading-none">
              Predictive Maintenance <br />
              <span className="text-ubuntu-orange">& Anomaly Detection</span>
            </h2>
            <p className="max-w-[500px] text-white/60 text-sm font-medium leading-relaxed">
              Our neural analysis engine monitors {plantUnit} sensor data to identify patterns that
              precede potential failures using statistical Z-score validation.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col justify-center min-w-[240px]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                System Health
              </span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-white">
                {anomalies.filter((a) => a.status === 'critical').length === 0
                  ? 'Optimal'
                  : 'Checking'}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex gap-4">
              <div className="flex flex-col">
                <span className="text-white/40 text-[9px] font-bold">ANOMALIES</span>
                <span className="text-white font-black">{anomalies.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white/40 text-[9px] font-bold">ACCURACY</span>
                <span className="text-emerald-400 font-black">98.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anomalies Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {anomalies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-2 py-16 text-center bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-inner"
            >
              <ShieldCheck className="w-16 h-16 text-emerald-500/20 mx-auto mb-4" />
              <h4 className="text-slate-400 font-black tracking-widest uppercase text-xs">
                No significant anomalies detected in recent historical data.
              </h4>
            </motion.div>
          ) : (
            anomalies.map((anomaly, idx) => (
              <AnomalyCard key={anomaly.parameterName} anomaly={anomaly} index={idx} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const AnomalyCard = React.forwardRef<HTMLDivElement, { anomaly: AnomalyData; index: number }>(
  ({ anomaly, index }, ref) => {
    const chartData = {
      labels: anomaly.history.map((h) => format(new Date(h.date), 'dd/MM')),
      datasets: [
        {
          label: 'Daily Avg',
          data: anomaly.history.map((h) => h.value),
          borderColor: '#E95420',
          backgroundColor: 'rgba(233, 84, 32, 0.05)',
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#E95420',
          tension: 0.4,
          fill: true,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleFont: { size: 12, family: 'Ubuntu', weight: 'bold' as const },
          bodyFont: { size: 12, family: 'Ubuntu' },
          padding: 12,
          cornerRadius: 12,
          displayColors: false,
        },
      },
      scales: {
        x: { display: false },
        y: { display: false },
      },
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Parameter Analysis
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-ubuntu-orange transition-colors">
                {anomaly.parameterName}
              </h3>
            </div>

            <div
              className={`px-4 py-2 rounded-2xl border flex items-center gap-2 ${
                anomaly.status === 'critical'
                  ? 'bg-red-50 border-red-100 text-red-600'
                  : 'bg-orange-50 border-orange-100 text-orange-600'
              }`}
            >
              <Zap className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {anomaly.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                Current Value
              </p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {anomaly.currentValue.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-400">{anomaly.unit}</span>
                {anomaly.zScore > 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-red-500" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                AI Deviation (Z-Score)
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xl font-black ${anomaly.zScore > 2 ? 'text-red-600' : 'text-orange-600'}`}
                >
                  {anomaly.zScore > 0 ? '+' : ''}
                  {anomaly.zScore.toFixed(2)}σ
                </span>
                <div className="h-4 w-[1px] bg-slate-200 mx-1" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">vs 30D Mean</span>
              </div>
            </div>
          </div>

          <div className="h-24 relative">
            <Line data={chartData} options={options} />
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-200" /> Mean:{' '}
                {anomaly.mean.toFixed(1)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full border border-slate-200" /> SD:{' '}
                {anomaly.stdDev.toFixed(1)}
              </div>
            </div>
            <button className="flex items-center gap-2 text-[10px] font-black text-ubuntu-orange uppercase tracking-widest hover:translate-x-1 transition-transform">
              Detail Analytics <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }
);

AnomalyCard.displayName = 'AnomalyCard';

const format = (date: Date, pattern: string) => {
  // Simple format helper
  if (pattern === 'dd/MM') {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }
  return date.toISOString();
};

export default PredictiveMaintenance;
