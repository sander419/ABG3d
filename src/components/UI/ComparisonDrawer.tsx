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
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 bg-[#11110F] text-[#F5F2EA] border-b border-[#F4DD45]/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#A9A59B]">
                Сравнение технологий
              </span>
              <span className="w-1 h-1 rounded-full bg-[#F4DD45]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#F4DD45] font-semibold">
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
                className="py-3.5 sm:grid sm:grid-cols-12 sm:gap-4 items-start hover:bg-[#F4DD45]/[0.05] transition-colors rounded-sm px-2"
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
                    <span className="w-4 h-4 rounded-full bg-[#F4DD45]/20 text-[#7D6900] flex items-center justify-center shrink-0 mt-0.5">
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
            className="py-2.5 px-5 rounded-sm bg-[#F4DD45] hover:bg-[#F8E66A] text-[#181814] text-[11px] font-mono uppercase tracking-[0.18em] font-semibold active:scale-[0.96] transition-[transform,background-color] flex items-center gap-1.5 cursor-pointer"
          >
            <span>Рассчитать проект</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
    </ModalShell>
  );
};
