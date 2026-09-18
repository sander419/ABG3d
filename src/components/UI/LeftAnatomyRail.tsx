import React from 'react';
import { WidgetViewMode } from '../../data/panelConfig';
import { Layers, Link2, ShieldCheck, Activity } from 'lucide-react';

interface LeftAnatomyRailProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  currentMode: WidgetViewMode;
}

export const LeftAnatomyRail: React.FC<LeftAnatomyRailProps> = ({
  selectedId,
  onSelect,
}) => {
  const layers = [
    {
      id: 'facade',
      index: '01',
      title: 'ФАСАД (ПРИМЕР: 70 ММ*)',
      spec: 'Заводская геометрия • Бетон B35',
      thickness: '70 мм*',
      detail: 'Прецизионные фаски 3 мм, морозостойкость F300, водонепроницаемость W8',
    },
    {
      id: 'insulation',
      index: '02',
      title: 'PIR УТЕПЛИТЕЛЬ (ПРИМЕР: 200 ММ*)',
      spec: 'Монолитный контур • λ = 0.022 Вт/(м·К)',
      thickness: '200 мм*',
      detail: 'Замкнутые поры, нулевое влагонакопление (<1%) и отсутствие усадки',
    },
    {
      id: 'structural',
      index: '03',
      title: 'НЕСУЩИЙ БЕТОН (ПРИМЕР: 120–150 ММ*)',
      spec: 'Несущая способность бетона • B30',
      thickness: '120–150 мм*',
      detail: 'Конструкционный монолитный остов здания с тепловой инерцией',
    },
  ];

  const peikkoHardware = [
    {
      id: 'anchors',
      code: 'PDM TIES',
      title: 'Связи Peikko PDM',
      desc: 'Диагональные связи сквозь PIR. 100% терморазрыв без мостиков холода.',
    },
    {
      id: 'anchors',
      code: 'PVL LOOPS',
      title: 'Тросовые петли PVL',
      desc: 'Закладные петли на торцах для быстрого герметичного монтажа стыков.',
    },
  ];

  return (
    <aside className="w-full h-full flex flex-col justify-between py-6 px-6 sm:px-8 select-none overflow-y-auto no-scrollbar">
      {/* Brand & Studio Sub-Header */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#18181B] font-semibold">
              ABG // PREFABDOM
            </span>
            <span className="w-1 h-1 rounded-full bg-[#18181B]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#71717A]">
              PRECAST
            </span>
          </div>
          <h2 className="text-xs font-sans font-medium text-[#71717A] tracking-wider uppercase mt-1">
            Анатомия и конструктив Peikko
          </h2>
        </div>

        {/* SECTION 1: ПИРОГ ПАНЕЛИ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#A1A1AA] flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-[#71717A]" />
              ПИРОГ СТЕНЫ • 390 ММ
            </span>
            <span className="font-mono text-[9px] text-[#A1A1AA]">СНАРУЖИ → ВНУТРЬ</span>
          </div>

          <div className="space-y-2">
            {layers.map((layer) => {
              const isSelected = selectedId === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={() => onSelect(isSelected ? null : layer.id)}
                  className={`group relative p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-black/[0.04]'
                      : 'hover:bg-black/[0.02]'
                  }`}
                >
                  {/* 1px hairline indicator on left */}
                  <div
                    className={`absolute left-0 top-3 bottom-3 w-[2px] transition-all duration-300 rounded-full ${
                      isSelected
                        ? 'bg-[#18181B]'
                        : 'bg-transparent group-hover:bg-[#D4D4D8]'
                    }`}
                  />

                  <div className="flex items-baseline justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[9px] text-[#71717A] tracking-wider shrink-0">
                        {layer.index}
                      </span>
                      <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] font-semibold text-[#18181B] min-w-0 break-words">
                        {layer.title}
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] text-[#18181B] font-medium tracking-tight shrink-0 whitespace-nowrap">
                      {layer.thickness}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#52525B] leading-tight mt-1">
                    {layer.spec}
                  </p>

                  <div className="text-[9px] font-mono text-[#A1A1AA] uppercase tracking-wider mt-1">
                    Иллюстративный пример: {layer.thickness}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: СОЕДИНИТЕЛИ PEIKKO */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#A1A1AA] flex items-center gap-1.5">
              <Link2 className="w-3 h-3 text-[#71717A]" />
              СОЕДИНИТЕЛИ PEIKKO
            </span>
            <span className="font-mono text-[9px] text-[#10B981] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              0% МОСТИКОВ
            </span>
          </div>

          <div className="space-y-2">
            {peikkoHardware.map((item, idx) => {
              const isSelected = selectedId === 'anchors';
              return (
                <div
                  key={idx}
                  onClick={() => onSelect(isSelected ? null : 'anchors')}
                  className={`group relative p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-black/[0.04]'
                      : 'hover:bg-black/[0.02]'
                  }`}
                >
                  <div
                    className={`absolute left-0 top-3 bottom-3 w-[2px] transition-all duration-300 rounded-full ${
                      isSelected
                        ? 'bg-[#18181B]'
                        : 'bg-transparent group-hover:bg-[#D4D4D8]'
                    }`}
                  />

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded bg-black/[0.04] text-[#18181B] font-semibold">
                      {item.code}
                    </span>
                    <span className="font-mono text-[9px] text-[#71717A] uppercase tracking-wider">
                      ВСТРОЕНЫ В ЖБИ
                    </span>
                  </div>

                  <h4 className="font-mono text-[11px] font-semibold text-[#18181B] mt-1.5 tracking-tight">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#52525B] leading-relaxed mt-0.5">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Engineering disclaimer note */}
      <div className="pt-4 border-t border-black/[0.04] text-[9px] font-mono text-[#A1A1AA] leading-relaxed">
        * Все размеры толщин и спецификации являются иллюстративными примерами заводской конструкции ЖБИ.
      </div>
    </aside>
  );
};
