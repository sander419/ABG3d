import React from 'react';
import { WidgetViewMode } from '../../data/panelConfig';

interface RightMetricsRailProps {
  currentMode: WidgetViewMode;
  onModeChange: (mode: WidgetViewMode) => void;
  onOpenCalculator: () => void;
  onOpenConsult: () => void;
  onOpenComparison?: () => void;
  onOpenAssembly?: () => void;
  onToggle2D: () => void;
  is2DActive: boolean;
  selectedId: string | null;
}

const facts = [
  ['390 мм', 'общая толщина'],
  ['3 слоя', 'единый заводской элемент'],
  ['На заводе', 'изготовление слоёв'],
];

export const RightMetricsRail: React.FC<RightMetricsRailProps> = ({ onOpenCalculator, onOpenConsult, onOpenComparison, onOpenAssembly, onToggle2D, is2DActive }) => (
  <aside className="no-scrollbar flex h-full w-full flex-col overflow-y-auto bg-[#201F1C] px-7 py-8 text-[#F3F0E9]">
    <p className="text-[10px] uppercase tracking-[0.22em] text-[#B89A70]">Индивидуальный проект</p>
    <h2 className="mt-3 text-[28px] font-normal leading-[1.08] tracking-[-0.04em]">Архитектура начинается с конструкции</h2>
    <p className="mt-4 text-[13px] leading-relaxed text-[#B9B4AA]">Инженер ABG адаптирует панель под геометрию дома, климат и выбранную отделку.</p>

    <dl className="mt-9 border-t border-white/14">
      {facts.map(([value, label]) => (
        <div key={value} className="flex items-baseline justify-between gap-4 border-b border-white/14 py-4">
          <dt className="text-[11px] text-[#9B968D]">{label}</dt>
          <dd className="font-mono text-[12px] tabular-nums text-[#EEEAE1]">{value}</dd>
        </div>
      ))}
    </dl>

    <div className="mt-auto pt-8">
      <button onClick={onOpenCalculator} className="w-full bg-[#F3F0E9] px-5 py-3.5 text-[12px] font-medium text-[#1D1C19] transition-colors hover:bg-white">Рассчитать ваш проект</button>
      <div className="mt-4 grid grid-cols-2 gap-4 text-left text-[11px] text-[#B9B4AA]">
        <button onClick={onOpenConsult} className="border-b border-white/18 pb-2 text-left transition-colors hover:border-[#B89A70] hover:text-white">Обсудить с инженером</button>
        {onOpenAssembly && <button onClick={onOpenAssembly} className="border-b border-white/18 pb-2 text-left transition-colors hover:border-[#B89A70] hover:text-white">Как собирается панель</button>}
      </div>
      {onOpenComparison && <button onClick={onOpenComparison} className="mt-5 w-full border-y border-[#B89A70]/30 py-3 text-left text-[#D8C1A2] transition-colors hover:bg-white/5"><span className="block text-[9px] uppercase tracking-[0.14em]">Две логики строительства</span><span className="mt-1 flex items-center justify-between text-[14px]">ABG и газобетон <span aria-hidden="true">↗</span></span></button>}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-[#A9A398]">
        <button onClick={onToggle2D} className="hover:text-[#D8C1A2]">{is2DActive ? 'Вернуться в 3D' : 'Открыть 2D-схему'}</button>
      </div>
      <p className="mt-4 text-[10px] leading-relaxed text-[#A9A398]">Толщины слоёв показаны для иллюстративной конфигурации.</p>
    </div>
  </aside>
);
