import React from 'react';
import { X, Check, AlertCircle, ArrowUpRight } from 'lucide-react';

interface ComparisonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCalculator: () => void;
}

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({
  isOpen,
  onClose,
  onOpenCalculator,
}) => {
  if (!isOpen) return null;

  const comparisonData = [
    {
      criterion: 'Несущая способность бетона',
      abg: 'Заводской конструкционный монолит B30 (>300 кгс/см²). Не требует дополнительных армопоясов.',
      traditional: 'Классы B2.0–B2.5. Хрупкий ячеистый массив, обязательна заливка монолитных поясов под плиты.',
      winner: 'abg',
    },
    {
      criterion: 'Тепловой контур и швы',
      abg: '200 мм сплошного PIR (λ = 0.022 Вт/м·К). Терморазрыв Peikko PDM исключает мостики холода.',
      traditional: 'Толщина 375–400 мм. Промерзание по вертикальным швам кладки и армопоясам перекрытий.',
      winner: 'abg',
    },
    {
      criterion: 'Влагонакопление и циклы',
      abg: 'Водопоглощение PIR < 1%. Точка 0 °C надежно изолирована в полимерной ячейке, бетон сухой.',
      traditional: 'Высокое водопоглощение (до 35% массы). При намокании теплосопротивление падает до 40%.',
      winner: 'abg',
    },
    {
      criterion: 'Усадка и отделка',
      abg: '0 мм усадки. Наружный фасад B35 готов с завода, внутренняя отделка возможна сразу.',
      traditional: 'Эксплуатационная усадка 0.5–1.0 мм/м. Риск волосяных трещин по финишной штукатурке.',
      winner: 'abg',
    },
    {
      criterion: 'Сроки монтажа теплового контура',
      abg: '2–5 дней на дом 200 м² (полная заводская готовность плит с окнами и каналами электрики)*',
      traditional: '4–8 недель ручной поштучной кладки с зависимостью от погодных условий и человеческого фактора.',
      winner: 'abg',
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 p-0 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-4xl max-h-[90vh] bg-white rounded-t-3xl sm:rounded-2xl border border-black/10 shadow-[0_24px_80px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-black/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#71717A]">
                Инженерный аудит
              </span>
              <span className="w-1 h-1 rounded-full bg-[#18181B]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#18181B] font-semibold">
                Свойства бетона
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-sans font-semibold text-[#18181B] tracking-tight mt-0.5">
              Почему это не просто бетон? ABG Prefab vs Газобетон
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#71717A] hover:text-[#18181B] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Table Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-4">
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-2 border-b border-black/10 font-mono text-[9px] uppercase tracking-[0.2em] text-[#71717A]">
            <div className="col-span-4">Критерий оценки</div>
            <div className="col-span-4 text-[#18181B] font-semibold">ABG Трёхслойная панель (PIR 200 + Peikko)</div>
            <div className="col-span-4">Классический газобетон D400–D500</div>
          </div>

          <div className="divide-y divide-black/[0.04]">
            {comparisonData.map((row, idx) => (
              <div
                key={idx}
                className="py-3.5 sm:grid sm:grid-cols-12 sm:gap-4 items-start hover:bg-black/[0.01] transition-colors rounded-lg px-2"
              >
                {/* Mobile criterion label */}
                <div className="col-span-4 mb-2 sm:mb-0">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#18181B]">
                    {row.criterion}
                  </span>
                </div>

                {/* ABG Advantage */}
                <div className="col-span-4 mb-2 sm:mb-0 pr-2">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#10B981]/15 text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <p className="text-xs text-[#18181B] leading-relaxed font-medium">
                      {row.abg}
                    </p>
                  </div>
                </div>

                {/* Traditional Block */}
                <div className="col-span-4 pl-0 sm:pl-2">
                  <div className="flex items-start gap-2 text-[#71717A]">
                    <span className="w-4 h-4 rounded-full bg-black/5 text-[#A1A1AA] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold">—</span>
                    </span>
                    <p className="text-xs text-[#52525B] leading-relaxed">
                      {row.traditional}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footnote */}
          <div className="mt-4 pt-3 border-t border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[9px] font-mono text-[#A1A1AA]">
            <span>* Сроки монтажа и тепловые характеристики являются иллюстративными примерами расчета.</span>
            <span>Заводские допуски ГОСТ 31310-2015</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 py-4 border-t border-black/[0.06] bg-[#FBFBFB] flex items-center justify-between">
          <div className="font-mono text-[10px] text-[#52525B]">
            Готовы обсудить конструктивные решения вашего дома?
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenCalculator();
            }}
            className="py-2.5 px-5 rounded-full bg-[#18181B] hover:bg-black text-white text-[11px] font-mono uppercase tracking-[0.18em] font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Рассчитать проект</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
