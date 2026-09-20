import React from 'react';
import { WidgetViewMode } from '../../data/panelConfig';

interface LeftAnatomyRailProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  currentMode: WidgetViewMode;
}

const layers = [
  { id: 'facade', number: '01', title: 'Фасадный слой', value: '70 мм*', text: 'Архитектурный железобетон' },
  { id: 'insulation', number: '02', title: 'Тепловой контур', value: '200 мм*', text: 'Теплоизоляция по расчёту' },
  { id: 'structural', number: '03', title: 'Несущий слой', value: '120 мм*', text: 'Железобетонная конструкция' },
];

export const LeftAnatomyRail: React.FC<LeftAnatomyRailProps> = ({ selectedId, onSelect, currentMode }) => (
  <aside className="no-scrollbar flex h-full w-full flex-col overflow-y-auto bg-[#F3F0E9] px-7 py-8 text-[#1D1C19]">
    <p className="text-[10px] uppercase tracking-[0.22em] text-[#846846]">Конструкция ABG</p>
    <h2 className="mt-3 text-[30px] font-normal leading-[1.03] tracking-[-0.045em]">Состав<br />панели</h2>
    <p className="mt-4 max-w-[210px] text-[13px] leading-relaxed text-[#746E64]">Три функциональных слоя работают как единая заводская конструкция.</p>

    <div className="mt-9 border-t border-black/12">
      {layers.map((layer) => {
        const active = selectedId === layer.id;
        return (
          <button
            key={layer.id}
            onClick={() => onSelect(active ? null : layer.id)}
            className={`relative w-full border-b border-black/12 py-4 text-left transition-colors ${active ? 'bg-[#E9E2D6]' : 'hover:bg-black/[0.025]'}`}
          >
            {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-[#947552]" />}
            <div className="flex items-baseline justify-between gap-3 px-2">
              <span className="text-[13px] font-medium">{layer.title}</span>
              <span className="font-mono text-[10px] tabular-nums text-[#665F55]">{layer.value}</span>
            </div>
            <div className="mt-1.5 flex gap-3 px-2 text-[11px] leading-relaxed text-[#817A70]">
              <span className="font-mono text-[#A28562]">{layer.number}</span>
              <span>{layer.text}</span>
            </div>
          </button>
        );
      })}
    </div>

    <button
      onClick={() => onSelect(selectedId === 'anchors' ? null : 'anchors')}
      className={`mt-7 border-l pl-4 text-left transition-colors ${selectedId === 'anchors' ? 'border-[#947552] text-[#1D1C19]' : 'border-black/15 text-[#746E64] hover:border-[#947552]'}`}
    >
      <span className="block text-[10px] uppercase tracking-[0.18em] text-[#846846]">Peikko / узлы</span>
      <span className="mt-2 block text-[12px] leading-relaxed">Соединительные элементы, закладные детали и монтажные петли</span>
    </button>

    <div className="mt-auto pt-8 text-[10px] leading-relaxed text-[#8C857A]">
      <p>* Иллюстративная конфигурация. Геометрия и узлы уточняются рабочим проектом.</p>
      <p className="mt-2 text-[#A28562]">{currentMode === 'thermal' ? 'Тепловая схема' : 'Интерактивная модель'}</p>
    </div>
  </aside>
);
