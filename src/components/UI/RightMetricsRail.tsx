import React from 'react';
import { WidgetViewMode } from '../../data/panelConfig';
import { ArrowRight, Compass, Sparkles, HelpCircle, FileText } from 'lucide-react';

interface RightMetricsRailProps {
  currentMode: WidgetViewMode;
  onModeChange: (mode: WidgetViewMode) => void;
  onOpenCalculator: () => void;
  onOpenConsult: () => void;
  onOpenComparison?: () => void;
  onToggle2D: () => void;
  is2DActive: boolean;
  selectedId: string | null;
}

export const RightMetricsRail: React.FC<RightMetricsRailProps> = ({
  currentMode,
  onModeChange,
  onOpenCalculator,
  onOpenConsult,
  onOpenComparison,
  onToggle2D,
  is2DActive,
  selectedId,
}) => {
  const metrics = [
    {
      label: 'МОНТАЖ',
      value: '2–5 ДНЕЙ',
      note: 'Иллюстративный пример',
      dotColor: 'bg-[#10B981]',
    },
    {
      label: 'ЭНЕРГИЯ',
      value: 'КЛАСС А+ / А++',
      note: 'Иллюстративный пример',
      dotColor: 'bg-[#3B82F6]',
    },
    {
      label: 'РЕСУРС',
      value: '100+ ЛЕТ',
      note: 'Иллюстративный пример',
      dotColor: 'bg-[#8B5CF6]',
    },
    {
      label: 'R₀ КОНТУРА',
      value: '9.2 (М²·°C)/ВТ',
      note: 'Иллюстративный пример',
      dotColor: 'bg-[#F59E0B]',
    },
  ];

  return (
    <aside className="w-full h-full flex flex-col justify-between py-6 px-6 sm:px-8 select-none overflow-y-auto no-scrollbar">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#18181B] font-semibold">
              МЕТРИКИ & CTA
            </span>
            <span className="w-1 h-1 rounded-full bg-[#18181B]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#71717A]">
              ПАРАМЕТРЫ
            </span>
          </div>
          <h2 className="text-xs font-sans font-medium text-[#71717A] tracking-wider uppercase mt-1">
            Преимущества для заказчика
          </h2>
        </div>

        {/* SECTION 1: ПОКУПАТЕЛЮ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#A1A1AA]">
              ПОКАЗАТЕЛИ КАЧЕСТВА
            </span>
            <span className="font-mono text-[9px] text-[#A1A1AA]">СТАНДАРТ ABG</span>
          </div>

          <div className="space-y-2">
            {metrics.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl hover:bg-black/[0.02] transition-colors flex flex-col justify-center"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${m.dotColor} animate-pulse`} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#52525B]">
                      {m.label}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold tracking-tight text-[#18181B]">
                    {m.value}
                  </span>
                </div>
                <div className="font-mono text-[9px] text-[#A1A1AA] uppercase tracking-wider mt-1 pl-3.5">
                  {m.note}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: ИНСПЕКЦИЯ СЛОЯ / СТАТУС */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#A1A1AA]">
              РЕЖИМ ОБЗОРА
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#18181B] font-mono">
              {currentMode === 'exploded'
                ? 'РАЗОБРАН'
                : currentMode === 'assembled'
                ? 'СБОРКА'
                : currentMode === 'structure'
                ? 'АРМАТУРА'
                : 'ТЕПЛО'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.03]">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#71717A] block">
              ФОКУС КАМЕРЫ:
            </span>
            <span className="text-[11px] font-medium text-[#18181B] mt-0.5 block">
              {selectedId === 'facade'
                ? 'Фасадная плита B35 (70 мм)'
                : selectedId === 'insulation'
                ? 'Бесшовный контур PIR (200 мм)'
                : selectedId === 'structural'
                ? 'Несущий монолит B30 (120 мм)'
                : selectedId === 'anchors'
                ? 'Терморазрыв Peikko PDM + петли PVL'
                : 'Вся конструкция (390 мм)'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: ДЕЙСТВИЕ (CTA) */}
      <div className="space-y-3 pt-4 border-t border-black/[0.04]">
        {/* Кнопка 1: РАССЧИТАТЬ ПРОЕКТ */}
        <button
          onClick={onOpenCalculator}
          className="w-full py-3 px-4 rounded-xl bg-[#18181B] hover:bg-black text-white text-[11px] font-mono uppercase tracking-[0.2em] font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] touch-manipulation"
        >
          <span>РАССЧИТАТЬ ПРОЕКТ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* Кнопка 2: СПРОСИТЬ ИНЖЕНЕРА */}
        <button
          onClick={onOpenConsult}
          className="w-full py-3 px-4 rounded-xl border border-[#E4E4E7] hover:border-[#18181B] text-[#18181B] text-[11px] font-mono uppercase tracking-[0.2em] font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer bg-transparent active:scale-[0.99] touch-manipulation"
        >
          <span>СПРОСИТЬ ИНЖЕНЕРА</span>
          <HelpCircle className="w-3.5 h-3.5 text-[#71717A]" />
        </button>

        {/* Кнопка 3: СРАВНЕНИЕ С ГАЗОБЕТОНОМ */}
        {onOpenComparison && (
          <button
            onClick={onOpenComparison}
            className="w-full py-2.5 px-3 rounded-xl bg-black/[0.03] hover:bg-black/[0.06] text-[#52525B] hover:text-[#18181B] text-[10px] font-mono uppercase tracking-[0.16em] transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-black/[0.03]"
          >
            <span>ABG VS ГАЗОБЕТОН (ТАБЛИЦА)</span>
          </button>
        )}

        {/* Fallback 2D switch */}
        <button
          onClick={onToggle2D}
          className="w-full py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-[#71717A] hover:text-[#18181B] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <FileText className="w-3 h-3" />
          <span>{is2DActive ? 'ВЕРНУТЬСЯ В 3D' : '2D ЧЕРТЕЖ ПАНЕЛИ'}</span>
        </button>
      </div>
    </aside>
  );
};
