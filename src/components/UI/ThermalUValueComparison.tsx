import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Flame, ShieldCheck, Zap, Info, X, ChevronRight } from 'lucide-react';
import { PANEL_CONFIG, formatTemperatureC } from '../../data/panelConfig';

export type ThermalMetricType = 'uValue' | 'rValue' | 'heatLoss';

/** Перепад температур иллюстративного расчёта — из PANEL_CONFIG.climate (P2-8). */
const DELTA_T = PANEL_CONFIG.climate.deltaTC;

interface ThermalDataPoint {
  id: string;
  name: string;
  shortName: string;
  category: 'prefab' | 'aerated' | 'standard' | 'brick';
  thickness: string;
  uValue: number; // Вт/(м²·К) - меньше = лучше
  rValue: number; // (м²·°C)/Вт - больше = лучше
  heatLoss: number; // кВт на 100 м² при выбранном ΔT
  lambda: string; // Вт/(м·К)
  equivThickness: string; // Толщина для R0 = PANEL_CONFIG.meta.r0Value
  color: string;
  note: string;
}

/**
 * Данные графика. Экспортируется для теста-сторожа, который проверяет, что
 * теплопотери согласованы с каноническим ΔT (U · 100 м² · ΔT).
 */
export const THERMAL_COMPARISON_DATA: ThermalDataPoint[] = [
  {
    id: 'prefab-panel',
    name: '3D Prefab панель (PIR 200 мм)',
    shortName: '3D Prefab 390',
    category: 'prefab',
    thickness: '390 мм',
    uValue: 0.11,
    rValue: PANEL_CONFIG.meta.r0Value,
    heatLoss: 0.46, // 0.11 · 100 м² · 42 K
    lambda: '0.022',
    equivThickness: '390 мм',
    color: '#10B981', // Emerald 500
    note: 'Монолитный PIR-барьер без мостиков холода (Класс A++)',
  },
  {
    id: 'aerated-concrete',
    name: 'Газобетон D400 (стандарт)',
    shortName: 'Газобетон D400',
    category: 'aerated',
    thickness: '400 мм',
    uValue: 0.36,
    rValue: 2.8,
    heatLoss: 1.51, // 0.36 · 100 м² · 42 K
    lambda: '0.120',
    equivThickness: '1 150 мм',
    color: '#F59E0B', // Amber 500
    note: 'Кладка на клей со швами, риск продувания и влагонакопления',
  },
  {
    id: 'norm-snip',
    name: 'Норматив СП 50.13330 (Мск/СПб)',
    shortName: 'Норматив СП 50',
    category: 'standard',
    thickness: '—',
    uValue: 0.31,
    rValue: 3.2,
    heatLoss: 1.30, // 0.31 · 100 м² · 42 K
    lambda: '—',
    equivThickness: '980 мм',
    color: '#71717A', // Zinc 500
    note: 'Минимально допустимый порог энергоэффективности РФ',
  },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ThermalDataPoint }>;
  metric: ThermalMetricType;
}

const CustomThermalTooltip: React.FC<CustomTooltipProps> = ({ active, payload, metric }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-[#18181B]/95 text-white p-3 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md font-sans text-xs min-w-[230px] z-50 pointer-events-none">
      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-white/10">
        <span className="font-semibold text-white tracking-wide">{data.name}</span>
        <span
          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider"
          style={{ backgroundColor: `${data.color}25`, color: data.color }}
        >
          {data.thickness}
        </span>
      </div>

      <div className="space-y-1 font-mono text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Теплопередача (U):</span>
          <span className="font-bold text-white">
            {data.uValue} <span className="text-zinc-400 text-[9px]">Вт/(м²·К)</span>
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Сопротивление (R₀):</span>
          <span className="font-bold text-white">
            {data.rValue} <span className="text-zinc-400 text-[9px]">(м²·°C)/Вт</span>
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Потери при {formatTemperatureC(PANEL_CONFIG.climate.outdoorC)} (100 м²):</span>
          <span className="font-bold" style={{ color: data.color }}>
            {data.heatLoss} <span className="text-zinc-400 text-[9px]">кВт</span>
          </span>
        </div>
      </div>

      <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] text-zinc-300 leading-tight">
        {data.note}
      </div>

      {data.category !== 'prefab' && (
        <div className="mt-1.5 text-[9.5px] font-mono text-amber-300/90 bg-amber-500/10 px-2 py-1 rounded">
          Требуется толщина {data.equivThickness} для равенства с панелью 390 мм
        </div>
      )}
    </div>
  );
};

interface ThermalUValueComparisonProps {
  onClose?: () => void;
  className?: string;
}

export const ThermalUValueComparison: React.FC<ThermalUValueComparisonProps> = ({
  onClose,
  className = '',
}) => {
  const [metric, setMetric] = useState<ThermalMetricType>('uValue');

  const metricConfigs = {
    uValue: {
      title: 'Коэффициент теплопередачи (U-value)',
      unit: 'Вт/(м²·К)',
      description: 'Меньше значение — меньше утечек тепла на улицу',
      dataKey: 'uValue',
      domain: [0, 0.42],
      advantageText: 'В 3.3 раза ниже утечки тепла (0.11 vs 0.36)',
      advantageColor: 'text-emerald-600',
    },
    rValue: {
      title: 'Сопротивление теплопередаче (R₀)',
      unit: '(м²·°C)/Вт',
      description: 'Больше значение — выше термический барьер и комфорт',
      dataKey: 'rValue',
      domain: [0, 10],
      advantageText: `R₀ = ${PANEL_CONFIG.meta.r0Value} — почти в 3 раза превосходит норматив СП 50`,
      advantageColor: 'text-emerald-600',
    },
    heatLoss: {
      title: `Теплопотери стены 100 м² при ΔT ${DELTA_T} °C (${formatTemperatureC(PANEL_CONFIG.climate.outdoorC)} снаружи, ${formatTemperatureC(PANEL_CONFIG.climate.indoorC)} внутри)`,
      unit: 'кВт',
      description: 'Расчетная мощность отопления, уходящая сквозь фасад',
      dataKey: 'heatLoss',
      domain: [0, 1.8],
      advantageText: 'Экономия до 1.05 кВт/ч на каждые 100 м² фасада (-69%)',
      advantageColor: 'text-emerald-600',
    },
  };

  const activeConfig = metricConfigs[metric];

  return (
    <div
      id="thermal-uvalue-comparison-card"
      className={`bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.14)] rounded-2xl p-4 sm:p-5 w-[340px] xs:w-[380px] sm:w-[440px] max-w-[94vw] text-[#18181B] pointer-events-auto transition-all duration-200 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-black/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#71717A] font-semibold">
                Теплотехнический расчет
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[9px] font-bold">
                A++
              </span>
            </div>
            <h4 className="text-[13px] sm:text-sm font-semibold text-[#18181B] tracking-tight leading-tight">
              3D Prefab панель vs Газобетон
            </h4>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.04] transition-colors cursor-pointer"
            title="Закрыть график"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Metric Selector Tabs */}
      <div className="mt-3 p-1 rounded-xl bg-[#F4F4F5] flex items-center gap-1 font-mono text-[10px]">
        <button
          onClick={() => setMetric('uValue')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all duration-150 cursor-pointer font-semibold uppercase tracking-wider text-center ${
            metric === 'uValue'
              ? 'bg-white text-[#18181B] shadow-xs'
              : 'text-[#71717A] hover:text-[#18181B]'
          }`}
        >
          U-value
        </button>
        <button
          onClick={() => setMetric('heatLoss')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all duration-150 cursor-pointer font-semibold uppercase tracking-wider text-center ${
            metric === 'heatLoss'
              ? 'bg-white text-[#18181B] shadow-xs'
              : 'text-[#71717A] hover:text-[#18181B]'
          }`}
        >
          Потери (кВт)
        </button>
        <button
          onClick={() => setMetric('rValue')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all duration-150 cursor-pointer font-semibold uppercase tracking-wider text-center ${
            metric === 'rValue'
              ? 'bg-white text-[#18181B] shadow-xs'
              : 'text-[#71717A] hover:text-[#18181B]'
          }`}
        >
          R₀ барьер
        </button>
      </div>

      {/* Sub-header description with live calculation context */}
      <div className="mt-2.5 flex items-center justify-between text-[10.5px] text-[#71717A]">
        <span>{activeConfig.description}</span>
        <span className="font-mono font-medium text-[#18181B] text-[10px]">
          Ед: {activeConfig.unit}
        </span>
      </div>

      {/* Recharts Data Visualization: Horizontal BarChart */}
      <div className="mt-2 w-full h-[155px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={THERMAL_COMPARISON_DATA}
            layout="vertical"
            margin={{ top: 8, right: 36, left: 4, bottom: 4 }}
          >
            <XAxis
              type="number"
              domain={activeConfig.domain}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9.5, fill: '#A1A1AA', fontFamily: 'monospace' }}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              tickLine={false}
              axisLine={false}
              width={105}
              tick={{ fontSize: 10.5, fill: '#27272A', fontWeight: 500 }}
            />
            <Tooltip
              content={<CustomThermalTooltip metric={metric} />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
            />
            {metric === 'uValue' && (
              <ReferenceLine
                x={0.31}
                stroke="#A1A1AA"
                strokeDasharray="3 3"
                label={{
                  value: 'СП 50: 0.31',
                  position: 'top',
                  fill: '#71717A',
                  fontSize: 8.5,
                  fontFamily: 'monospace',
                }}
              />
            )}
            <Bar
              dataKey={activeConfig.dataKey}
              radius={[0, 6, 6, 0]}
              barSize={18}
              animationDuration={600}
            >
              {THERMAL_COMPARISON_DATA.map((entry) => (
                <Cell
                  key={`cell-${entry.id}`}
                  fill={entry.color}
                  fillOpacity={entry.id === 'prefab-panel' ? 0.95 : 0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Physics & Engineering Insights Callout */}
      <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/[0.07] border border-emerald-600/15 text-[11px] leading-relaxed">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-900 font-mono text-[10px] uppercase tracking-wider mb-0.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{activeConfig.advantageText}</span>
        </div>
        <p className="text-[#3F3F46] text-[10.5px]">
          Слой PIR 200 мм (λ = 0.022 Вт/(м·К)) полностью блокирует конвективные утечки.
          Чтобы получить аналогичное сопротивление, кладка из газобетона D400 должна иметь
          толщину <strong className="text-[#18181B] font-semibold">1 150 мм</strong>.
        </p>
      </div>

      {/* Quick Comparative Matrix */}
      <div className="mt-2.5 pt-2 border-t border-black/[0.06] grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div className="p-1.5 rounded-lg bg-black/[0.02] border border-black/[0.03]">
          <span className="text-[#71717A] block">3D PREFAB ПАНЕЛЬ</span>
          <span className="font-bold text-emerald-700 text-[11.5px]">U = 0.11 Вт/(м²·К)</span>
          <span className="text-[#71717A] block text-[9px]">Толщина: 390 мм</span>
        </div>

        <div className="p-1.5 rounded-lg bg-black/[0.02] border border-black/[0.03]">
          <span className="text-[#71717A] block">ГАЗОБЕТОН D400</span>
          <span className="font-bold text-amber-700 text-[11.5px]">U = 0.36 Вт/(м²·К)</span>
          <span className="text-[#71717A] block text-[9px]">Толщина: 400 мм (+швы)</span>
        </div>
      </div>
    </div>
  );
};
