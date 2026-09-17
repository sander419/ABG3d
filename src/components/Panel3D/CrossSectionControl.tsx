import React from 'react';
import {
  Scissors,
  Eye,
  EyeOff,
  RotateCcw,
  ArrowLeftRight,
  X,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { ClippingAxis } from './CrossSectionPlaneHelper';

export interface CrossSectionControlProps {
  enabled: boolean;
  onToggleEnabled: () => void;
  axis: ClippingAxis;
  onChangeAxis: (axis: ClippingAxis) => void;
  offset: number;
  onChangeOffset: (offset: number) => void;
  inverted: boolean;
  onToggleInverted: () => void;
  showPlaneHelper: boolean;
  onToggleShowPlaneHelper: () => void;
  onReset: () => void;
}

export const CrossSectionControl: React.FC<CrossSectionControlProps> = ({
  enabled,
  onToggleEnabled,
  axis,
  onChangeAxis,
  offset,
  onChangeOffset,
  inverted,
  onToggleInverted,
  showPlaneHelper,
  onToggleShowPlaneHelper,
  onReset,
}) => {
  // Axis range definitions in meters
  const axisRanges: Record<
    ClippingAxis,
    { min: number; max: number; step: number; label: string; sub: string }
  > = {
    z: {
      min: -0.195,
      max: 0.195,
      step: 0.005,
      label: 'Z · Толщина (390 мм)',
      sub: 'Послойный срез: Фасад → PIR → Несущий',
    },
    x: {
      min: -1.0,
      max: 1.0,
      step: 0.02,
      label: 'X · Ширина (2.0 м)',
      sub: 'Вертикальный продольный разрез',
    },
    y: {
      min: -1.2,
      max: 1.2,
      step: 0.02,
      label: 'Y · Высота (2.4 м)',
      sub: 'Горизонтальный поперечный разрез',
    },
  };

  const activeRange = axisRanges[axis];
  const offsetMm = Math.round(offset * 1000);

  // Dynamic engineering analysis message based on cut location
  const getSliceAnalysis = () => {
    if (axis === 'z') {
      if (offset > 0.125) {
        return {
          layer: 'Фасадный бетон B35 (70 мм)',
          desc: 'Внешний защитно-декоративный слой. Водонепроницаемость W8, морозостойкость F200.',
          color: 'text-sky-700',
          bg: 'bg-sky-50 border-sky-200/60',
        };
      } else if (offset >= -0.075) {
        return {
          layer: 'Термоизоляционный PIR (200 мм)',
          desc: 'Сердечник с закрытыми порами (λ = 0.022 Вт/(м·К)). Видны гильзы и диагональные анкеры Peikko PDM.',
          color: 'text-amber-800',
          bg: 'bg-amber-50 border-amber-200/60',
        };
      } else {
        return {
          layer: 'Несущий железобетон B30 (120 мм)',
          desc: 'Внутренний силовой контур. Воспринимает нагрузку перекрытий, интегрированы петлевые коробки Peikko PVL.',
          color: 'text-zinc-800',
          bg: 'bg-zinc-100 border-zinc-200',
        };
      }
    } else if (axis === 'x') {
      return {
        layer: `Вертикальный срез на ${offsetMm > 0 ? `+${offsetMm}` : offsetMm} мм`,
        desc: 'Видно сквозное сечение сэндвич-панели 390 мм и положение анкеров относительно граней.',
        color: 'text-emerald-800',
        bg: 'bg-emerald-50 border-emerald-200/60',
      };
    } else {
      return {
        layer: `Горизонтальный срез на ${offsetMm > 0 ? `+${offsetMm}` : offsetMm} мм`,
        desc: 'Поперечный вид сверху вниз: контроль непрерывности PIR-барьера и отсутствия термомостиков.',
        color: 'text-indigo-800',
        bg: 'bg-indigo-50 border-indigo-200/60',
      };
    }
  };

  const analysis = getSliceAnalysis();

  if (!enabled) {
    return (
      <button
        id="cross-section-toggle-btn"
        onClick={onToggleEnabled}
        className="pointer-events-auto px-3 py-1.5 rounded-full font-mono text-[11px] tracking-tight flex items-center gap-1.5 border shadow-sm backdrop-blur-md transition-all duration-200 cursor-pointer bg-white/90 text-[#3F3F46] hover:text-[#18181B] hover:bg-white border-black/[0.08]"
        title="Включить инструмент сечения (Clipping Plane) для послойного среза панели"
      >
        <Scissors className="w-3.5 h-3.5 text-sky-600 shrink-0" />
        <span className="font-medium whitespace-nowrap">Сечение</span>
      </button>
    );
  }

  return (
    <div
      id="cross-section-panel-dock"
      className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-black/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.12)] rounded-2xl p-3.5 sm:p-4 w-[320px] xs:w-[350px] sm:w-[380px] max-w-[92vw] text-[#18181B] select-none transition-all duration-200"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-black/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
            <Scissors className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#71717A] font-semibold">
                Инструмент среза
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            </div>
            <h4 className="text-[12.5px] font-semibold text-[#18181B] tracking-tight leading-tight">
              Сечение панели 3D
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleShowPlaneHelper}
            className={`p-1.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
              showPlaneHelper
                ? 'bg-sky-50 text-sky-600 border border-sky-200/50'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.04]'
            }`}
            title={showPlaneHelper ? 'Скрыть плоскость среза' : 'Показать плоскость среза в 3D'}
          >
            {showPlaneHelper ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onToggleEnabled}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.04] transition-colors cursor-pointer"
            title="Закрыть инструмент сечения"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Axis Selector Buttons */}
      <div className="mt-2.5 grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F4F4F5] font-mono text-[10px]">
        {(['z', 'x', 'y'] as ClippingAxis[]).map((a) => {
          const isSelected = axis === a;
          const axisLabels: Record<ClippingAxis, string> = {
            z: 'Z · Толщина',
            x: 'X · Ширина',
            y: 'Y · Высота',
          };
          return (
            <button
              key={a}
              onClick={() => onChangeAxis(a)}
              className={`py-1.5 px-2 rounded-lg transition-all duration-150 cursor-pointer font-semibold uppercase tracking-wider text-center ${
                isSelected
                  ? 'bg-white text-[#18181B] shadow-xs'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              {axisLabels[a]}
            </button>
          );
        })}
      </div>

      {/* Slider Control Bar */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#71717A]">{activeRange.sub}</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#18181B] bg-black/[0.04] px-2 py-0.5 rounded-md">
              {offsetMm > 0 ? `+${offsetMm}` : offsetMm} мм
            </span>
            <button
              onClick={onToggleInverted}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                inverted
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-black/[0.04] text-[#71717A] hover:text-[#18181B]'
              }`}
              title="Инвертировать направление среза (⇄)"
            >
              <ArrowLeftRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Drag Slider */}
        <div className="relative pt-1 pb-1">
          <input
            type="range"
            min={activeRange.min}
            max={activeRange.max}
            step={activeRange.step}
            value={offset}
            onChange={(e) => onChangeOffset(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#E4E4E7] rounded-lg appearance-none cursor-ew-resize accent-sky-600 focus:outline-hidden"
            style={{ touchAction: 'none' }}
          />

          {/* Quick reference tick marks for Z axis (sandwich layers) */}
          {axis === 'z' && (
            <div className="flex justify-between text-[8px] font-mono text-[#A1A1AA] pt-1">
              <span>Несущий (-195)</span>
              <span className="text-amber-600/90 font-medium">PIR 200мм (0)</span>
              <span>Фасад (+195)</span>
            </div>
          )}
        </div>
      </div>

      {/* Layer Insight Placard */}
      <div className={`mt-2.5 p-2 rounded-xl border text-[10.5px] leading-relaxed ${analysis.bg}`}>
        <div className="flex items-center justify-between font-mono font-semibold text-[10px] uppercase tracking-wider mb-0.5">
          <span className={analysis.color}>{analysis.layer}</span>
          <span className="text-[9px] text-[#71717A]">
            {inverted ? 'Инвертирован ⇄' : 'Прямой рез'}
          </span>
        </div>
        <p className="text-[#3F3F46] text-[10px] leading-snug">{analysis.desc}</p>
      </div>

      {/* Quick Presets */}
      <div className="mt-2.5 pt-2 border-t border-black/[0.06] flex items-center justify-between gap-1.5 font-mono text-[9.5px]">
        <span className="text-[#71717A] uppercase tracking-wider text-[8.5px]">Пресеты:</span>
        <div className="flex items-center gap-1">
          {axis === 'z' ? (
            <>
              <button
                onClick={() => onChangeOffset(0.025)}
                className="px-2 py-1 rounded-md bg-black/[0.03] hover:bg-black/[0.07] text-[#3F3F46] hover:text-[#18181B] transition-colors cursor-pointer"
              >
                PIR Сердечник
              </button>
              <button
                onClick={() => onChangeOffset(0.125)}
                className="px-2 py-1 rounded-md bg-black/[0.03] hover:bg-black/[0.07] text-[#3F3F46] hover:text-[#18181B] transition-colors cursor-pointer"
              >
                Стык фасада
              </button>
            </>
          ) : (
            <button
              onClick={() => onChangeOffset(0.0)}
              className="px-2 py-1 rounded-md bg-black/[0.03] hover:bg-black/[0.07] text-[#3F3F46] hover:text-[#18181B] transition-colors cursor-pointer"
            >
              Центр (0 мм)
            </button>
          )}

          <button
            onClick={onReset}
            className="p-1 rounded-md text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.04] transition-colors cursor-pointer ml-1"
            title="Сбросить срез"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
