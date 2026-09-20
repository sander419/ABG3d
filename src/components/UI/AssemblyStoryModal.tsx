import React from 'react';
import { Building2, Factory, Hammer, Layers3, X } from 'lucide-react';
import { ModalShell } from './ModalShell';

interface AssemblyStoryModalProps { isOpen: boolean; onClose: () => void; onOpenCalculator: () => void; }

const steps = [
  { icon: Factory, code: '01', title: 'Изготовление панели', text: 'Панель формуется на заводе по рабочей документации: бетонные слои, утеплитель, арматура и закладные элементы.' },
  { icon: Building2, code: '02', title: 'Монтаж на фундамент', text: 'Готовый элемент подаётся краном и выставляется по проектным отметкам. Монтажные петли и схема строповки определяются КЖ.' },
  { icon: Hammer, code: '03', title: 'Стык и соединение', text: 'PVL-петли в зоне стыка соединяются вертикальным стержнем; далее стык заполняется согласно проектному узлу.' },
  { icon: Layers3, code: '04', title: 'Тёплый контур', text: 'Ступенчатый шов, герметизация и утеплённый контур выполняются по проекту дома и условиям площадки.' },
];

export const AssemblyStoryModal: React.FC<AssemblyStoryModalProps> = ({ isOpen, onClose, onOpenCalculator }) => (
  <ModalShell isOpen={isOpen} onClose={onClose} panelClassName="max-w-3xl p-0" labelledBy="assembly-story-title">
    <div className="bg-[#11110F] text-[#F5F2EA] pl-6 pr-14 sm:pl-8 sm:pr-16 py-7 border-b border-[#F4DD45]/30">
      <button onClick={onClose} aria-label="Закрыть" className="absolute top-4 right-4 p-2 rounded-sm text-[#A9A59B] hover:text-white hover:bg-white/10 active:scale-[0.96] transition-[transform,background-color,color] cursor-pointer"><X className="w-5 h-5" /></button>
      <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-[#F4DD45]">AUTOBIOGRAPHY / монтажная логика</p>
      <h2 id="assembly-story-title" className="mt-2 text-2xl sm:text-3xl tracking-[-0.04em] font-medium">Как панель становится домом</h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#B8B4AA]">Наглядная последовательность для предварительного знакомства. Финальная технология монтажа задаётся проектом производства работ.</p>
    </div>
    <div className="p-6 sm:p-8 bg-[#F5F2EA] text-[#181814]">
      <div className="grid sm:grid-cols-2 gap-3">
        {steps.map(({ icon: Icon, code, title, text }) => <div key={code} className="bg-[#FAF9F5] border border-black/10 p-5 min-h-44 rounded-sm">
          <div className="flex items-center justify-between"><Icon className="w-5 h-5 text-[#9A7A22]" strokeWidth={1.5} /><span className="font-mono text-[10px] text-[#77746C]">{code}</span></div>
          <h3 className="mt-7 text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-relaxed text-[#55524B]">{text}</p>
        </div>)}
      </div>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <p className="text-[11px] leading-relaxed text-[#77746C]">Для точного узла нужны КЖ, серия панели и условия конкретного объекта.</p>
        <button onClick={onOpenCalculator} className="shrink-0 px-5 py-3 rounded-sm bg-[#F4DD45] hover:bg-[#F8E66A] text-[#181814] text-[10px] font-mono uppercase tracking-[0.16em] active:scale-[0.96] transition-[transform,background-color] cursor-pointer">Запросить расчёт</button>
      </div>
    </div>
  </ModalShell>
);
