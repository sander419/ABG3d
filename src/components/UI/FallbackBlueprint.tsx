import React from 'react';
import { PANEL_CONFIG } from '../../data/panelConfig';
import { X, Info } from 'lucide-react';

interface FallbackBlueprintProps {
  onClose: () => void;
  onSelectLayer: (id: string) => void;
}

export const FallbackBlueprint: React.FC<FallbackBlueprintProps> = ({
  onClose,
  onSelectLayer,
}) => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-8 bg-[#F5F2EA]/95 backdrop-blur-xl rounded-sm border border-[#F4DD45]/30 border-t-2 border-t-[#F4DD45] shadow-[0_20px_60px_rgba(0,0,0,0.2)] text-[#181814] select-none overflow-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-black/5 pb-3 sm:pb-4 gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-[#181814] text-white rounded-sm text-[9px] sm:text-[10px] font-mono uppercase tracking-widest w-fit">
            2D Архитектурный разрез
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-[#71717A]">
            Схема состава • Толщина: 390 мм
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 sm:p-1.5 rounded-sm hover:bg-[#F4DD45]/15 text-[#77746C] hover:text-[#181814] active:scale-[0.96] transition-[transform,background-color,color]"
          title="Закрыть"
          aria-label="Закрыть 2D-схему"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Architectural SVG Blueprint */}
      <div className="my-auto py-6 flex flex-col items-center justify-center">
        <svg
          viewBox="0 0 800 420"
          aria-label="Схематический разрез трёхслойной панели: 70, 200 и 120 миллиметров"
          className="w-full max-w-3xl h-auto border border-black/10 bg-[#FAF9F5] rounded-sm p-4 shadow-sm"
        >
          <defs>
            {/* Fine architectural stipple for concrete */}
            <pattern id="concrete-dots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="4" r="0.8" fill="#A1A1AA" />
              <circle cx="11" cy="10" r="0.6" fill="#71717A" />
              <circle cx="8" cy="14" r="0.7" fill="#D4D4D8" />
            </pattern>

            {/* Pattern for PIR foam */}
            <pattern id="pir-grid" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect width="16" height="16" fill="#C8C1B0" fillOpacity="0.3" />
              <path d="M0 0L16 16M16 0L0 16" stroke="#9A9483" strokeWidth="0.4" strokeOpacity="0.4" />
            </pattern>
          </defs>

          {/* LAYER 1: Facade concrete (70 mm) */}
          <g
            className="cursor-pointer transition-opacity hover:opacity-85"
            onClick={() => onSelectLayer('facade')}
          >
            <rect
              x="100"
              y="70"
              width="110"
              height="240"
              fill="#E8E7E3"
              stroke="#18181B"
              strokeWidth="1.2"
            />
            <rect x="100" y="70" width="110" height="240" fill="url(#concrete-dots)" />
            <text x="155" y="185" fill="#18181B" fontSize="11" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">
              ФАСАД
            </text>
            <text x="155" y="205" fill="#71717A" fontSize="9" fontFamily="monospace" textAnchor="middle">
              70 мм • по проекту
            </text>
          </g>

          {/* LAYER 2: insulation (200 mm illustrative configuration) */}
          <g
            className="cursor-pointer transition-opacity hover:opacity-85"
            onClick={() => onSelectLayer('insulation')}
          >
            <rect
              x="210"
              y="70"
              width="310"
              height="240"
              fill="url(#pir-grid)"
              stroke="#18181B"
              strokeWidth="1.2"
            />
            <text x="365" y="185" fill="#18181B" fontSize="12" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">
              ТЕПЛОИЗОЛЯЦИЯ
            </text>
            <text x="365" y="205" fill="#52525B" fontSize="10" fontFamily="monospace" textAnchor="middle">
              200 мм • по проекту
            </text>
          </g>

          {/* LAYER 3: Loadbearing concrete (120 mm) */}
          <g
            className="cursor-pointer transition-opacity hover:opacity-85"
            onClick={() => onSelectLayer('structural')}
          >
            <rect
              x="520"
              y="70"
              width="180"
              height="240"
              fill="#DFDED9"
              stroke="#18181B"
              strokeWidth="1.2"
            />
            <rect x="520" y="70" width="180" height="240" fill="url(#concrete-dots)" />
            <text x="610" y="185" fill="#18181B" fontSize="11" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">
              НЕСУЩИЙ ЖЕЛЕЗОБЕТОН
            </text>
            <text x="610" y="205" fill="#71717A" fontSize="9" fontFamily="monospace" textAnchor="middle">
              120 мм • по проекту
            </text>
          </g>

          {/* Peikko PDM Ties */}
          <g className="cursor-pointer" onClick={() => onSelectLayer('anchors')}>
            <line x1="180" y1="120" x2="550" y2="160" stroke="#18181B" strokeWidth="2.5" strokeDasharray="6,2" />
            <line x1="180" y1="160" x2="550" y2="120" stroke="#18181B" strokeWidth="2.5" strokeDasharray="6,2" />
            <rect x="295" y="130" width="140" height="20" rx="10" fill="white" stroke="#18181B" strokeWidth="0.8" />
            <text x="365" y="144" fill="#18181B" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="600">
              СВЯЗИ PEIKKO PDM
            </text>
          </g>

          {/* Dimension Lines */}
          <g stroke="#71717A" strokeWidth="0.8">
            <line x1="100" y1="340" x2="700" y2="340" />
            <line x1="100" y1="320" x2="100" y2="345" />
            <line x1="210" y1="320" x2="210" y2="345" />
            <line x1="520" y1="320" x2="520" y2="345" />
            <line x1="700" y1="320" x2="700" y2="345" />

            <text x="155" y="358" fill="#18181B" fontSize="10" fontFamily="monospace" textAnchor="middle">
              70 мм
            </text>
            <text x="365" y="358" fill="#18181B" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              200 мм
            </text>
            <text x="610" y="358" fill="#18181B" fontSize="10" fontFamily="monospace" textAnchor="middle">
              120 мм
            </text>

            <line x1="100" y1="380" x2="700" y2="380" stroke="#18181B" strokeWidth="1" />
            <text x="400" y="398" fill="#18181B" fontSize="11" fontFamily="mono" textAnchor="middle" fontWeight="bold">
              ИТОГО: 390 ММ
            </text>
          </g>
        </svg>
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-[#71717A] border-t border-black/5 pt-3">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#18181B]" />
          <span>Нажмите на любой слой для просмотра технических характеристик</span>
        </div>
      </div>
    </div>
  );
};
