import React from 'react';
import { Layers, Link2 } from 'lucide-react';
import { WidgetViewMode } from '../../data/panelConfig';

interface LeftAnatomyRailProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  currentMode: WidgetViewMode;
}

const layers = [
  { id: 'facade', number: '01', title: 'ФАСАДНЫЙ СЛОЙ', value: '70 ММ*', text: 'Архитектурный железобетон' },
  { id: 'insulation', number: '02', title: 'ТЕПЛОВОЙ КОНТУР', value: '200 ММ*', text: 'Теплоизоляционный слой по проекту' },
  { id: 'structural', number: '03', title: 'НЕСУЩИЙ СЛОЙ', value: '120 ММ*', text: 'Железобетонная конструкция панели' },
];

export const LeftAnatomyRail: React.FC<LeftAnatomyRailProps> = ({ selectedId, onSelect, currentMode }) => (
  <aside className="w-full h-full flex flex-col justify-between py-6 px-5 overflow-y-auto no-scrollbar text-[#F5F2EA]">
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#F4DD45]">Конструкция</p>
      <h2 className="mt-2 text-2xl leading-[1.08] font-medium tracking-[-0.04em] text-balance">Анатомия<br />панели</h2>
      <p className="mt-3 text-[13px] leading-relaxed text-[#AAA69C] text-pretty">Выберите слой — модель покажет его положение и назначение.</p>

      <div className="mt-8 overflow-hidden rounded-sm border border-white/10 bg-white/[0.025] divide-y divide-white/10">
        {layers.map((layer) => {
          const active = selectedId === layer.id;
          return <button key={layer.id} onClick={() => onSelect(active ? null : layer.id)} className={`w-full text-left py-4 px-3 transition-[background-color,color,transform] active:scale-[0.99] cursor-pointer ${active ? 'bg-[#F4DD45]/10 shadow-[inset_2px_0_0_#F4DD45]' : 'hover:bg-white/[0.04]'}`}>
            <div className="flex items-center justify-between gap-3">
              <span className={`font-mono text-[10px] tracking-[0.12em] ${active ? 'text-[#F4DD45]' : 'text-[#969187]'}`}>{layer.number} / {layer.title}</span>
              <span className="font-mono text-[11px] tabular-nums text-[#F5F2EA]">{layer.value}</span>
            </div>
            <p className="mt-1.5 pr-3 text-[12px] leading-relaxed text-[#B8B4AA]">{layer.text}</p>
          </button>;
        })}
      </div>

      <div className="mt-7 rounded-sm border border-white/10 border-l-2 border-l-[#F4DD45] bg-white/[0.025] p-3">
        <div className="flex gap-2 items-center"><Link2 className="w-4 h-4 text-[#F4DD45]" aria-hidden="true" /><span className="font-mono text-[10px] tracking-[0.14em] text-[#F4DD45]">PEIKKO / УЗЛЫ</span></div>
        <button onClick={() => onSelect(selectedId === 'anchors' ? null : 'anchors')} className="mt-2 text-left text-[12px] leading-snug text-[#E4E0D6] hover:text-white active:scale-[0.99] transition-[color,transform] cursor-pointer">Соединительные элементы и монтажные петли</button>
        <p className="mt-2 text-[12px] leading-relaxed text-[#969187]">Показываются в режиме «Арматура»; состав уточняется рабочим проектом.</p>
      </div>
    </div>

    <div className="pt-5 border-t border-white/10 text-[10px] leading-relaxed font-mono text-[#969187]">
      <Layers className="inline w-3 h-3 mr-1 text-[#F4DD45]" />
      * Иллюстративная конфигурация. Толщины, класс бетона и узлы согласуются для каждого объекта.
      <span className="block mt-2 text-[#969187]">{currentMode === 'thermal' ? 'Режим: теплотехника' : 'Режим: анатомия панели'}</span>
    </div>
  </aside>
);
