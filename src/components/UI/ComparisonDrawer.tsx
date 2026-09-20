import React from 'react';
import { X, Check, AlertCircle, ArrowUpRight } from 'lucide-react';
import { ModalShell } from './ModalShell';

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
  const comparisonData = [
    {
      criterion: 'Несущая способность бетона',
      abg: 'Два железобетонных слоя и закладные системы проектируются как единый заводской элемент. Класс бетона определяется расчётом, не ниже B25 для стеновых панелей ABG.',
      traditional: 'Конструктивное решение зависит от марки блоков, схемы армирования и проектных армопоясов.',
      winner: 'abg',
    },
    {
      criterion: 'Тепловой контур и швы',
      abg: 'В базовой конфигурации — 200 мм эффективного утеплителя; материал утеплителя выбирается для конкретного проекта. Связи и швы рассчитываются отдельно.',
      traditional: 'Теплотехника рассчитывается по конструкции стены, раствору, швам и климатическому району.',
      winner: 'abg',
    },
    {
      criterion: 'Влагонакопление и циклы',
      abg: 'Положение точки росы и защита от влаги проверяются теплотехническим расчётом проекта.',
      traditional: 'Требования к паропроницаемости и отделке зависят от выбранной конструкции стены.',
      winner: 'abg',
    },
    {
      criterion: 'Усадка и отделка',
      abg: 'Заводская геометрия и готовая наружная поверхность уменьшают объём мокрых процессов на площадке.',
      traditional: 'Сроки отделки и риск трещин зависят от технологии, качества монтажа и проектных решений.',
      winner: 'abg',
    },
    {
      criterion: 'Сроки монтажа теплового контура',
      abg: 'Сборка стенового комплекта выполняется краном по ППР. Фактические сроки зависят от проекта, логистики, фундамента и погоды.',
      traditional: 'Сроки зависят от бригады, технологий, готовности материалов и погодных условий.',
      winner: 'abg',
    },
  ];

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="comparison-modal-title"
      panelClassName="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0"
    >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#201F1C] px-6 py-5 text-[#F3F0E9] sm:px-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#A9A59B]">
                Сравнение технологий
              </span>
              <span className="h-1 w-1 rounded-full bg-[#B89A70]" />
              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#B89A70]">
                Свойства бетона
              </span>
            </div>
            <h3 id="comparison-modal-title" className="text-sm sm:text-base font-sans font-semibold text-[#F5F2EA] tracking-tight mt-0.5">
              Панели ABG и газобетонная кладка
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Закрыть сравнение"
            className="p-2 rounded-sm text-[#A9A59B] hover:text-[#F5F2EA] hover:bg-white/10 active:scale-[0.96] transition-[transform,background-color,color] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Table Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-4 bg-[#F5F2EA]">
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-2 border-b border-black/10 font-mono text-[9px] uppercase tracking-[0.2em] text-[#71717A]">
            <div className="col-span-4">Критерий оценки</div>
            <div className="col-span-4 text-[#18181B] font-semibold">ABG трёхслойная панель (200 мм* + Peikko)</div>
            <div className="col-span-4">Классический газобетон D400–D500</div>
          </div>

          <div className="divide-y divide-black/[0.04]">
            {comparisonData.map((row, idx) => (
              <div
                key={idx}
                className="items-start px-2 py-3.5 transition-colors hover:bg-black/[0.025] sm:grid sm:grid-cols-12 sm:gap-4"
              >
                {/* Mobile criterion label */}
                <div className="col-span-4 mb-2 sm:mb-0">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#18181B]">
                    {row.criterion}
                  </span>
                </div>

                {/* ABG Advantage */}
                <div className="col-span-4 mb-2 sm:mb-0 pr-2">
                  <p className="sm:hidden mb-2 font-mono text-[10px] uppercase text-[#625F58]">Панели ABG</p>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#947552]/15 text-[#725535]">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <p className="text-xs text-[#18181B] leading-relaxed font-medium">
                      {row.abg}
                    </p>
                  </div>
                </div>

                {/* Traditional Block */}
                <div className="col-span-4 pl-0 sm:pl-2">
                  <p className="sm:hidden mb-2 font-mono text-[10px] uppercase text-[#625F58]">Газобетонная кладка</p>
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
            <span>Обзор принципов строительства. Сроки, нагрузки и теплотехника требуют расчёта конкретного проекта.</span>
            <span>Рабочие решения — по проекту ABG</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 py-4 border-t border-black/10 bg-[#ECE9DF] flex flex-col sm:flex-row gap-3 sm:items-center justify-between shrink-0">
          <div className="font-mono text-[10px] text-[#52525B]">
            Готовы обсудить конструктивные решения вашего дома?
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenCalculator();
            }}
            className="flex cursor-pointer items-center gap-1.5 bg-[#1D1C19] px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white transition-[transform,background-color] hover:bg-[#34312C] active:scale-[0.98]"
          >
            <span>Рассчитать проект</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
    </ModalShell>
  );
};
