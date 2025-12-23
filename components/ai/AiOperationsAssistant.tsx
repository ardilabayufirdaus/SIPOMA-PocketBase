import React, { useState } from 'react';
import {
  Sparkles,
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Activity,
  Microscope,
  Lightbulb,
  Cpu,
} from 'lucide-react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { ParameterSetting } from '../../types';

// Interface for Analysis Data (matching CopAnalysisPage)
interface AnalysisDataRow {
  parameter: ParameterSetting;
  dailyValues: { value: number | null; raw: number | undefined }[];
  monthlyAverage: number | null;
  monthlyAverageRaw: number | null;
}

interface AiOperationsAssistantProps {
  analysisData: AnalysisDataRow[];
  isLoading: boolean;
  selectedUnit?: string;
  moistureData?: { date: string; value: number }[];
}

// Knowledge Base for Cement Mill Parameter Influences
interface KnowledgeBaseItem {
  influencers: string[];
  analysis: string;
}

const ParameterKnowledge: Record<string, KnowledgeBaseItem> = {
  // Quality Parameters
  Blaine: {
    influencers: ['Separator Speed', 'Mill Draft', 'Grinding Aid', 'Clinker Hardness'],
    analysis:
      'Blaine (kehalusan) berbanding lurus dengan Separator Speed. Jika Blaine rendah, cek efisiensi separator atau tambah dosis Grinding Aid.',
  },
  Residue: {
    influencers: ['Separator Speed', 'Mill Ventilation', 'Dam Ring Height'],
    analysis:
      'Residue tinggi menandakan separasi kurang optimal. Pertimbangkan menaikkan Separator Speed atau mengurangi ventilasi udara.',
  },
  SO3: {
    influencers: ['Gypsum Feed Rate', 'Clinker SO3', 'Temperatur Mill'],
    analysis:
      'Kadar SO3 mengontrol setting time. Jika fluktuatif, periksa kestabilan feeding Gypsum dan temperatur mill (dehidrasi gipsum).',
  },

  // Operational Parameters
  Feed: {
    influencers: ['Mill Sound Level', 'Bucket Elevator Amps', 'Separator Return'],
    analysis:
      'Feed rate harus disesuaikan dengan Mill Load. Jika Sound Level tinggi (mill kosong), feed bisa dinaikkan untuk optimasi produksi.',
  },
  'Mill Motor': {
    influencers: ['Ball Charge', 'Material Hardness', 'Liner Condition'],
    analysis:
      'Ampere motor mencerminkan beban giling. Penurunan drastis bisa indikasi "coating" pada liner atau grinding media aus.',
  },
  Separator: {
    influencers: ['System Fan Speed', 'Reject Rate', 'Product Quality Target'],
    analysis:
      'Separator adalah kontrol utama kualitas. Speed tinggi meningkatkan Blaine tapi bisa menurunkan intlet pressure jika fan tidak diadjust.',
  },
  Vibration: {
    influencers: ['Mill Filling Level', 'Bolts Loosening', 'Gear Alignment'],
    analysis:
      'Vibrasi tinggi biasanya karena mill terlalu kosong (impact ball ke liner) atau masalah mekanikal pada drive train.',
  },
  Temperature: {
    influencers: ['Water Injection', 'Clinker Temp', 'Mill Ventilation'],
    analysis:
      'Temperatur semen > 110°C bisa menyebabkan false set (gypsum dehydration). Cek sistem water spray atau tambah ventilasi.',
  },
};

const getKnowledge = (paramName: string): KnowledgeBaseItem => {
  // Case insensitive partial match
  const key = Object.keys(ParameterKnowledge).find((k) =>
    paramName.toLowerCase().includes(k.toLowerCase())
  );
  return key
    ? ParameterKnowledge[key]
    : {
        influencers: ['Operasi Hulu', 'Kondisi Mesin', 'Human Factors'],
        analysis:
          'Parameter ini dipengaruhi oleh stabilitas operasi equipment terkait dan konsistensi material input.',
      };
};

interface AnalysisResult {
  score: number;
  criticalIssues: {
    parameter: string;
    value: number;
    issue: string;
  }[];
  insights: {
    type: 'success' | 'warning' | 'info';
    message: string;
    paramName?: string;
    relatedParams?: string[];
    analysisExplanation?: string;
  }[];
  recommendations: {
    parameter: string;
    action: string;
    targetValue: string;
    impact: string;
    priority: 'High' | 'Medium' | 'Low';
    impactScore: number;
    category?: string;
    cpk?: number;
    statIssue?: string;
  }[];
}

// --- STATISTICAL HELPER FUNCTIONS (Minitab-style) ---

// 1. Calculate Standard Deviation (Sample)
const calculateStdDev = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
};

// 2. Calculate Process Capability (Cpk)
const calculateCpk = (mean: number, stdDev: number, min: number, max: number): number => {
  if (stdDev === 0) return 999; // Perfectly stable
  const cpu = (max - mean) / (3 * stdDev);
  const cpl = (mean - min) / (3 * stdDev);
  return Math.min(cpu, cpl);
};

// 3. Nelson Rules (Simplified)
// Rule 3: 6 points in a row steadily increasing or decreasing (Trend)
// Rule 4: 9 points in a row on same side of center line (Shift)
const checkNelsonRules = (
  values: number[],
  mean: number
): { rule: string; description: string } | null => {
  if (values.length < 6) return null;

  // Check Trend (Rule 3) - Looking at last 6 points
  const last6 = values.slice(-6);
  let increasing = true;
  let decreasing = true;
  for (let i = 0; i < last6.length - 1; i++) {
    if (last6[i] >= last6[i + 1]) increasing = false;
    if (last6[i] <= last6[i + 1]) decreasing = false;
  }

  if (increasing)
    return { rule: 'Trend Naik', description: 'Terdeteksi trend kenaikan konsisten (6 poin).' };
  if (decreasing)
    return { rule: 'Trend Turun', description: 'Terdeteksi trend penurunan konsisten (6 poin).' };

  // Check Shift (Rule 4) - Looking at last 9 points
  if (values.length >= 9) {
    const last9 = values.slice(-9);
    const positiveShift = last9.every((v) => v > mean);
    const negativeShift = last9.every((v) => v < mean);

    if (positiveShift)
      return {
        rule: 'Shift Atas',
        description: 'Process shift terdeteksi di atas rata-rata (9 poin).',
      };
    if (negativeShift)
      return {
        rule: 'Shift Bawah',
        description: 'Process shift terdeteksi di bawah rata-rata (9 poin).',
      };
  }

  return null;
};

// Human-like phrasing variations
const getPhrase = (
  type: 'increase' | 'decrease' | 'stable' | 'good' | 'bad' | 'moisture_high'
): string => {
  const phrases = {
    increase: [
      'Perlu dinaikkan sedikit untuk mencapai target.',
      'Coba tingkatkan set point secara bertahap.',
      'Disarankan untuk menaikkan nilai ini agar optimal.',
      'Kerek naik nilainya untuk hasil lebih baik.',
    ],
    decrease: [
      'Nilai terlalu tinggi, perlu diturunkan.',
      'Kurangi set point untuk efisiensi.',
      'Sebaiknya turunkan agar tidak over-spec.',
      'Pangkas sedikit nilainya untuk menghemat energi.',
    ],
    stable: [
      'Pertahankan kestabilan saat ini.',
      'Jaga di range ini, sudah cukup stabil.',
      'Fokus pada konsistensi nilai ini.',
      'Jangan ubah banyak, sudah sesuai standar.',
    ],
    good: [
      'Performa sangat prima hari ini.',
      'Operasi berjalan mulus sesuai ekspektasi.',
      'Kondisi optimal, pertahankan ritme ini.',
      'Parameter kunci semua dalam zona hijau.',
    ],
    bad: [
      'Ada beberapa isu kritis yang perlu atensi.',
      'Performa drop, butuh tindakan korektif segera.',
      'Terdeteksi penyimpangan signifikan dari standar.',
      'Operasi sedang tidak sehat, cek parameter merah.',
    ],
    moisture_high: [
      'Kadar air tinggi, hati-hati feeding.',
      'Material basah terdeteksi, waspadai clogging.',
      'Moisture tinggi bisa ganggu Blaine, monitor terus.',
      'Hati-hati, moisture content sedang tinggi.',
    ],
  };
  const list = phrases[type];
  return list[Math.floor(Math.random() * list.length)];
};

export const AiOperationsAssistant: React.FC<AiOperationsAssistantProps> = ({
  analysisData,
  isLoading,
  selectedUnit,
  moistureData = [],
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setAnalysisStep('Calculated Standard Deviation (Sigma)...');

    // Sequence of analysis steps for UX (processing real data)
    setTimeout(() => {
      setAnalysisStep('Evaluating Process Capability (Cpk)...');
      setTimeout(() => {
        setAnalysisStep('Checking Nelson Rules (Trends/Shifts)...');
        setTimeout(() => {
          const insightData = performAnalysis(analysisData, moistureData);
          setResult(insightData);
          setIsAnalyzing(false);
          setAnalysisStep('');
        }, 800);
      }, 800);
    }, 800);
  };

  const calculateImpactScore = (
    paramName: string,
    deviation: number,
    isCritical: boolean
  ): number => {
    // Weighted scoring based on parameter importance
    let weight = 1.0;
    if (paramName.includes('Blaine')) weight = 1.6;
    else if (paramName.includes('Feed')) weight = 1.5;
    else if (paramName.includes('Residue')) weight = 1.4;
    else if (paramName.includes('R45')) weight = 1.4;
    else if (paramName.includes('SO3')) weight = 1.3;

    // Criticality multiplier
    const criticalMultiplier = isCritical ? 2.0 : 1.0;

    // Score = Weight * DeviationFactor * Criticality
    // Normalize deviation to a factor (e.g. 10% deviation = 1.1)
    return weight * (1 + deviation) * criticalMultiplier;
  };

  const performAnalysis = (
    data: AnalysisDataRow[],
    moistureHistory: { date: string; value: number }[]
  ): AnalysisResult => {
    const criticalIssues: any[] = [];
    const insights: any[] = [];
    const recommendations: any[] = [];
    let totalScore = 0;
    let validParams = 0;

    // 1. Context Analysis (Real Data)
    const recentMoisture = moistureHistory.slice(-3); // Last 3 days
    const avgMoisture =
      recentMoisture.length > 0
        ? recentMoisture.reduce((sum, item) => sum + item.value, 0) / recentMoisture.length
        : 0;
    const isHighMoisture = avgMoisture > 12.0;

    if (isHighMoisture) {
      insights.push({
        type: 'warning',
        message: getPhrase('moisture_high'),
        analysisExplanation: `Data Real-time: Moisture rata-rata 3 hari terakhir ${avgMoisture.toFixed(1)}%. Risiko clogging tinggi.`,
        relatedParams: ['Feed (ton)', 'Drying Chamber Temp'],
      });
    }

    // 2. Parameter Analysis (Real Data & Statistical)
    data.forEach((row) => {
      if (row.monthlyAverage !== null && row.monthlyAverageRaw !== null && row.parameter) {
        totalScore += Math.min(row.monthlyAverage, 100);
        validParams++;

        const paramName = row.parameter.parameter;
        const currentVal = row.monthlyAverageRaw;
        const minVal = row.parameter.min_value || 0;
        const maxVal = row.parameter.max_value || 100;
        const knowledge = getKnowledge(paramName);

        let impactScore = 0;
        let priority: 'High' | 'Medium' | 'Low' = 'Low';
        let deviation = 0;
        let cpkValue = 0;
        let statIssueDescription = '';

        // --- STATISTICAL ANALYSIS ---
        // Get valid daily raw values for calculation
        const dailyRawValues = row.dailyValues
          .filter((d) => d.raw !== undefined && d.raw !== null)
          .map((d) => d.raw as number);

        if (dailyRawValues.length > 2) {
          const stdDev = calculateStdDev(dailyRawValues);
          cpkValue = calculateCpk(currentVal, stdDev, minVal, maxVal);
          const nelsonCheck = checkNelsonRules(dailyRawValues, currentVal);

          // Cpk Interpretation
          // Cpk < 1.0: Process not capable
          if (cpkValue < 1.0) {
            statIssueDescription = `Process Capability Rendah (Cpk ${cpkValue.toFixed(2)}). Variasi terlalu tinggi.`;
            impactScore += 0.5;
          } else if (cpkValue >= 1.33) {
            statIssueDescription = `Process Capable (Six Sigma Quality - Cpk ${cpkValue.toFixed(2)}).`;
          }

          // Nelson Rules Interpretation
          if (nelsonCheck) {
            insights.push({
              type: 'info',
              message: `${nelsonCheck.rule} on ${paramName}`,
              analysisExplanation: `${nelsonCheck.description} Ini mengindikasikan perubahan sistemik/noise.`,
              relatedParams: knowledge.influencers,
            });
            priority = 'Medium';
            impactScore += 0.3;
          }
        }

        // A. Critical Low Performance Logic
        if (row.monthlyAverage < 70) {
          deviation = (100 - row.monthlyAverage) / 100; // % distance from target
          impactScore += calculateImpactScore(paramName, deviation, true);
          priority = 'High';

          criticalIssues.push({
            parameter: paramName,
            value: row.monthlyAverage,
            issue: `Score: ${row.monthlyAverage.toFixed(1)}% | Cpk: ${cpkValue.toFixed(2)}`,
          });

          // Historical Target Logic
          const goodDays = row.dailyValues
            .filter((d) => d.value !== null && d.value >= 85 && d.raw !== undefined)
            .map((d) => d.raw as number);

          let targetAction = '';
          let targetNum = '';

          if (goodDays.length > 0) {
            const avgGoodVal = goodDays.reduce((a, b) => a + b, 0) / goodDays.length;
            if (currentVal < avgGoodVal) {
              targetAction = `${getPhrase('increase')} ${paramName}`;
              targetNum = `Target History: ${avgGoodVal.toFixed(1)}`;
            } else {
              targetAction = `${getPhrase('decrease')} ${paramName}`;
              targetNum = `Target History: ${avgGoodVal.toFixed(1)}`;
            }
          } else {
            if (currentVal < minVal) {
              targetAction = `Naikkan ${paramName} ke min limit.`;
              targetNum = `Std Min: ${minVal}`;
            } else {
              targetAction = `Turunkan ${paramName} ke max limit.`;
              targetNum = `Std Max: ${maxVal}`;
            }
          }

          let specificImpact = knowledge.analysis;
          if (paramName.includes('Feed') && isHighMoisture) {
            specificImpact = 'High Moisture detected: Adjust feed carefully.';
          }
          if (cpkValue < 1.0) {
            specificImpact += ' (High Variance Warning)';
          }

          recommendations.push({
            parameter: paramName,
            action: targetAction,
            targetValue: targetNum,
            impact: specificImpact,
            priority,
            impactScore,
            category: 'Critical Action',
            cpk: cpkValue,
            statIssue: statIssueDescription,
          });
        }
        // B. Optimization / False Positive Logic
        else {
          // Check Range Compliance even if score is good
          const isOutOfRangeLow = currentVal < minVal;
          const isOutOfRangeHigh = currentVal > maxVal;

          if (isOutOfRangeLow || isOutOfRangeHigh) {
            const limit = isOutOfRangeHigh ? maxVal : minVal;
            const rangeDiff = Math.abs(currentVal - limit);
            deviation = rangeDiff / (limit || 1);

            if (deviation > 0.01) {
              impactScore += calculateImpactScore(paramName, deviation, false);
              priority = impactScore > 1.5 ? 'High' : 'Medium';

              const actionText = isOutOfRangeHigh
                ? `${paramName} (${currentVal.toFixed(1)}) > Max (${maxVal})`
                : `${paramName} (${currentVal.toFixed(1)}) < Min (${minVal})`;

              recommendations.push({
                parameter: paramName,
                action: `${actionText} meski QC Score 100%.`,
                targetValue: `Review Setting Min/Max`,
                impact: `Range Actual vs Std Mismatch. Cpk: ${cpkValue.toFixed(2)}`,
                priority,
                impactScore,
                category: 'Setting Audit',
                cpk: cpkValue,
                statIssue: statIssueDescription,
              });
            }
          }
          // Moderate Optimization advice
          else if (row.monthlyAverage < 85) {
            impactScore += calculateImpactScore(paramName, 0.1, false);
            recommendations.push({
              parameter: paramName,
              action: `${getPhrase('stable')} Optimalkan ${paramName}.`,
              targetValue: `Maintain Stability`,
              impact: 'Preventif fluktuasi minor.',
              priority: 'Low',
              impactScore,
              category: 'Optimization',
              cpk: cpkValue,
              statIssue: statIssueDescription,
            });
          }
        }
      }
    });

    // Sort by weighted Impact Score
    recommendations.sort((a, b) => b.impactScore - a.impactScore);

    const overallScore = validParams > 0 ? Math.round(totalScore / validParams) : 0;

    // Generate High-Level Insights
    if (overallScore >= 90) {
      insights.unshift({
        type: 'success',
        message: 'Process Capability Excellent.',
        analysisExplanation:
          'Parameter utama berada dalam kendali statistik (Statistical Control). Low variabilitas.',
      });
    } else {
      insights.unshift({
        type: 'warning',
        message: 'Process Variation Detected.',
        analysisExplanation: 'Beberapa parameter menunjukkan instabilitas statistik (Low Cpk).',
      });
    }

    return {
      score: overallScore,
      criticalIssues,
      insights,
      recommendations,
    };
  };

  if (isLoading) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-indigo-50 to-slate-50 border-indigo-100 overflow-hidden relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-600" />
            AI Operations Assistant{' '}
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
              Available with Minitab-Engine
            </span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Statistical Process Control (SPC) & Predictive Recommendations
          </p>
        </div>
        {!result ? (
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 animate-spin" />
                Calculating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Jalankan Analisa Statistik
              </span>
            )}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
            Refresh Analisa
          </Button>
        )}
      </div>

      {isAnalyzing && (
        <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <p className="text-indigo-800 font-medium animate-pulse">{analysisStep}</p>
        </div>
      )}

      {!isAnalyzing && result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          {/* Health Score & Main Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="md:col-span-1 bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
              <div
                className={`absolute inset-0 opacity-10 ${result.score >= 85 ? 'bg-emerald-500' : result.score >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
              ></div>
              <span className="text-sm text-slate-500 font-medium mb-2">Process Health Index</span>
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    fill="transparent"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    fill="transparent"
                    stroke={
                      result.score >= 85 ? '#10b981' : result.score >= 70 ? '#f59e0b' : '#ef4444'
                    }
                    strokeWidth="8"
                    strokeDasharray={`${result.score * 3.77} 377`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-4xl font-bold text-slate-800">{result.score}</span>
                  <span className="text-xs text-slate-500">SQC Score</span>
                </div>
              </div>
            </div>

            {/* Key Insights List */}
            <div className="md:col-span-2 space-y-3">
              {result.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg flex items-start gap-3 border ${
                    insight.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : insight.type === 'info'
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  {insight.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : insight.type === 'info' ? (
                    <TrendingUp className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">{insight.message}</p>
                    {insight.analysisExplanation && (
                      <p className="text-xs mt-1 opacity-90 leading-relaxed">
                        {insight.analysisExplanation}
                      </p>
                    )}
                    {insight.relatedParams && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {insight.relatedParams.map((p: string) => (
                          <span
                            key={p}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white/50 border border-black/5 font-medium"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Statistical Recommendations
            </h3>
            <div className="space-y-3">
              {result.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${rec.priority === 'High' ? 'bg-red-500' : rec.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}
                  ></div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800">{rec.parameter}</span>
                        {rec.priority === 'High' && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            Major Issue
                          </span>
                        )}
                        {rec.cpk !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${rec.cpk < 1.0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}
                          >
                            Cpk {rec.cpk.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 font-medium">{rec.action}</p>

                      <div className="mt-2 flex flex-col gap-1">
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          Impact: {rec.impact}
                        </p>
                        {rec.statIssue && (
                          <p className="text-xs text-indigo-600 flex items-center gap-1 font-medium">
                            <Activity className="w-3 h-3" />
                            {rec.statIssue}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                      <div className="text-right">
                        <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                          Target
                        </p>
                        <p className="font-mono font-bold text-indigo-600">{rec.targetValue}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {result.recommendations.length === 0 && (
                <div className="text-center py-8 text-slate-500 italic text-sm">
                  Proses sangat stabil. Cpk &gt; 1.33 di semua parameter.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
