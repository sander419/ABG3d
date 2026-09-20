import React from 'react';
import { ArrowRight, FileText, HelpCircle } from 'lucide-react';
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

const metrics = [
  ['ИЗГОТОВЛЕНИЕ', 'ЗАВОДСКОЕ'],
  ['ТЕПЛОВОЙ КОНТУР', 'ПО ПРОЕКТУ'],
  ['КОНСТРУКЦИЯ', '390 ММ*'],
];

export const RightMetricsRail: React.FC<RightMetricsRailProps> = ({
  currentMode, onOpenCalculator, onOpenConsult, onOpenComparison, onOpenAssembly, onToggle2D, is2DActive, selectedId,
}) => {
  const focus = selectedId === 'facade' ? 'Фасадный железобетон' : selectedId === 'insulation'
    ? 'Теплоизоляционный контур' : selectedId === 'structural' ? 'Несущий слой'
    : selectedId === 'anchors' ? 'Соединительные элементы'
    : currentMode === 'exploded' ? 'Слои панели' : currentMode === 'structure' ? 'Арматура и связи'
    : currentMode === 'thermal' ? 'Тепловой контур' : 'Панель в сборе';

  return (
    <aside className="w-full h-full flex flex-col justify-between py-6 px-5 overflow-y-auto no-scrollbar text-[#F5F2EA]">
      <div className="space-y-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#F4DD45]">AUTOBIOGRAPHY / PREFAB</p>
          <h2 className="mt-2 text-2xl leading-[1.08] font-medium tracking-[-0.04em] text-balance">Параметры<br />системы</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-[#AAA69C] text-pretty">Конфигурация для знакомства. Рабочие решения определяются проектом.</p>
        </div>

        <div className="overflow-hidden rounded-sm border border-white/10 bg-white/[0.025] divide-y divide-white/10">
          {metrics.map(([label, value]) => (
            <div key={label} className="py-4 px-3 flex items-end justify-between gap-3">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#969187]">{label}</span>
              <span className="font-mono text-[12px] tabular-nums font-semibold text-[#F5F2EA] text-right">{value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-sm border border-white/10 border-l-2 border-l-[#F4DD45] bg-white/[0.025] p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#969187]">В фокусе</p>
          <p className="mt-1 text-[13px] leading-snug text-[#E4E0D6]">{focus}</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[#8B877E]">
            {currentMode === 'thermal' ? 'Теплотехнический режим' : currentMode === 'structure' ? 'Конструктивный режим' : 'Интерактивная модель'}
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-6 border-t border-white/10">
        <button onClick={onOpenCalculator} className="w-full min-h-11 py-3 px-4 rounded-sm bg-[#F4DD45] hover:bg-[#F8E66A] text-[#121210] text-[11px] font-mono uppercase tracking-[0.14em] font-semibold active:scale-[0.96] transition-[transform,background-color] flex items-center justify-center gap-2 cursor-pointer">
          Рассчитать проект <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button onClick={onOpenConsult} className="w-full min-h-11 py-3 px-4 rounded-sm border border-white/20 hover:border-[#F4DD45] text-[#F5F2EA] text-[11px] font-mono uppercase tracking-[0.12em] active:scale-[0.96] transition-[transform,border-color,color] flex items-center justify-center gap-2 cursor-pointer">
          Спросить инженера <HelpCircle className="w-3.5 h-3.5 text-[#F4DD45]" />
        </button>
        {onOpenComparison && <button onClick={onOpenComparison} className="w-full min-h-10 py-2 text-[10px] font-mono uppercase tracking-[0.12em] text-[#B8B4AA] hover:text-[#F4DD45] active:scale-[0.96] transition-[transform,color] cursor-pointer">Сравнить технологии</button>}
        {onOpenAssembly && <button onClick={onOpenAssembly} className="w-full min-h-10 py-2 text-[10px] font-mono uppercase tracking-[0.12em] text-[#B8B4AA] hover:text-[#F4DD45] active:scale-[0.96] transition-[transform,color] cursor-pointer">Как монтируется дом</button>}
        <button onClick={onToggle2D} className="w-full min-h-10 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-[#969187] hover:text-white active:scale-[0.96] transition-[transform,color] flex items-center justify-center gap-1.5 cursor-pointer">
          <FileText className="w-3 h-3" /> {is2DActive ? 'Вернуться в 3D' : 'Открыть 2D-схему'}
        </button>
      </div>
    </aside>
  );
};
