import React from 'react';
import { WidgetViewMode } from '../../data/panelConfig';
import { Eye, Flame } from 'lucide-react';

interface CenterModeCapsuleProps {
  currentMode: WidgetViewMode;
  onModeChange: (mode: WidgetViewMode) => void;
  scrubValue: number;
  onScrubChange: (val: number) => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
}

export const CenterModeCapsule: React.FC<CenterModeCapsuleProps> = ({
  currentMode,
  onModeChange,
  scrubValue,
  onScrubChange,
  showDimensions,
  onToggleDimensions,
}) => {
  const modes: { id: WidgetViewMode; label: string; micro: string }[] = [
    { id: 'exploded', label: 'РАЗОБРАН', micro: 'Слои' },
    { id: 'assembled', label: 'СБОРКА', micro: '390 мм' },
    { id: 'structure', label: 'АРМАТУРА', micro: 'Peikko' },
    { id: 'thermal', label: 'ТЕПЛО', micro: 'Схема' },
  ];

  return (
    <div className="relative flex flex-col items-center gap-2 select-none pointer-events-none">
      {/* Mode Buttons - Minimalist Borderless Floating Text Capsule */}
      <div role="group" aria-label="Режим отображения панели" className="pointer-events-auto flex items-center gap-1 p-1 rounded-md bg-[#11110F]/94 backdrop-blur-2xl border border-white/15 shadow-[0_14px_42px_rgba(0,0,0,0.42)] transition-[background-color,border-color,box-shadow] duration-200">
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          const isThermal = m.id === 'thermal';

          return (
            <div
              key={m.id}
              className="relative flex items-center"
            >
              <button
                id={`mode-${m.id}-btn`}
                onClick={() => onModeChange(m.id)}
                aria-pressed={isActive}
                className={`min-h-10 px-2.5 sm:px-3 rounded-sm font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.12em] active:scale-[0.96] transition-[transform,background-color,color,box-shadow] duration-150 flex items-center gap-1.5 cursor-pointer touch-manipulation whitespace-nowrap ${
                  isActive
                    ? 'bg-[#F4DD45] text-[#11110F] font-semibold shadow-xs'
                    : 'text-[#B8B4AA] hover:text-white hover:bg-white/10'
                }`}
              >
                {isThermal && (
                  <Flame
                  className={`w-3.5 h-3.5 transition-colors ${
                      isActive ? 'text-[#11110F]' : 'text-[#F4DD45]'
                    }`}
                  />
                )}
                <span>{m.label}</span>
                <span
                  className={`text-[9px] tracking-wider hidden md:inline ${
                    isActive ? 'text-[#534719]' : 'text-[#77746C]'
                  }`}
                >
                  {m.micro}
                </span>
              </button>

            </div>
          );
        })}

        {/* Micro divider */}
        <div className="w-[1px] h-4 bg-white/15 mx-1 hidden sm:block" />

        {/* Dimension Lines Toggle */}
        <button
          onClick={onToggleDimensions}
          aria-pressed={showDimensions}
          className={`min-h-10 px-2.5 rounded-sm font-mono text-[10px] uppercase tracking-wider active:scale-[0.96] transition-[transform,color,background-color] hidden sm:flex items-center gap-1 cursor-pointer ${
            showDimensions
              ? 'text-[#F4DD45] font-semibold'
              : 'text-[#77746C] hover:text-white'
          }`}
          title="Вкл/выкл выносные размерные линии"
        >
          <Eye className="w-3 h-3" />
          <span>РАЗМЕРЫ</span>
        </button>
      </div>

      {currentMode === 'thermal' && (
        <div className="max-w-[calc(100vw-2rem)] rounded-sm bg-[#11110F]/95 border border-white/10 px-3 py-2 text-center text-[11px] leading-relaxed text-[#B8B4AA]">
          <span className="text-[#9BC3EB]">Снаружи</span> → теплоизоляция → <span className="text-[#E4BA78]">интерьер</span>
          <p className="text-[10px] text-[#969187]">Цветовая иллюстрация, не теплотехнический расчёт</p>
        </div>
      )}
      {/* Interactive Micro Scrubber when in Exploded or Structure Mode */}
      {(currentMode === 'exploded' || currentMode === 'structure') && (
        <div className="pointer-events-auto flex items-center gap-3 px-3 py-2 rounded-md bg-[#11110F]/94 backdrop-blur-xl border border-white/10 text-xs font-mono text-[#B8B4AA] transition-[opacity,transform] duration-200 animate-in fade-in">
          <label htmlFor="panel-explode-range" className="text-[10px] uppercase tracking-wider text-[#969187]">
            РАЗБОРКА
          </label>
          <input
            id="panel-explode-range"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={scrubValue}
            onChange={(e) => onScrubChange(parseFloat(e.target.value))}
            className="w-20 sm:w-36 accent-[#F4DD45] cursor-pointer h-1 bg-white/15 rounded-lg appearance-none touch-manipulation"
          />
            <span className="text-[10px] tabular-nums uppercase font-semibold text-[#F5F2EA] min-w-[32px] text-right">
            {Math.round(scrubValue * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};
