import React, { useState, useRef, useEffect } from 'react';
import { WidgetViewMode } from '../../data/panelConfig';
import { Eye, Flame, BarChart2 } from 'lucide-react';
import { ThermalUValueComparison } from './ThermalUValueComparison';

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
  const [showThermalComparison, setShowThermalComparison] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Таймер скрытия не должен переживать размонтирование и переключение режима:
  // иначе popover может «залипнуть» открытым в другом режиме, а setState
  // срабатывает уже после unmount.
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (currentMode !== 'thermal' && showThermalComparison) {
      setShowThermalComparison(false);
    }
  }, [currentMode, showThermalComparison]);

  const handleThermalMouseEnter = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setShowThermalComparison(true);
  };

  const handleThermalMouseLeave = () => {
    hideTimerRef.current = setTimeout(() => {
      setShowThermalComparison(false);
    }, 280);
  };

  const handleToggleThermalCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowThermalComparison((prev) => !prev);
  };

  const modes: { id: WidgetViewMode; label: string; micro: string }[] = [
    { id: 'exploded', label: 'РАЗОБРАН', micro: 'Слои' },
    { id: 'assembled', label: 'СБОРКА', micro: '390 мм' },
    { id: 'structure', label: 'АРМАТУРА', micro: 'Peikko' },
    { id: 'thermal', label: 'ТЕПЛО', micro: 'R₀ 9.2' },
  ];

  return (
    <div className="relative flex flex-col items-center gap-2 select-none pointer-events-none">
      {/* Mode Buttons - Minimalist Borderless Floating Text Capsule */}
      <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 rounded-full bg-white/85 hover:bg-white/95 backdrop-blur-xl border border-black/[0.04] shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-200">
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          const isThermal = m.id === 'thermal';

          return (
            <div
              key={m.id}
              className="relative flex items-center"
              onMouseEnter={isThermal ? handleThermalMouseEnter : undefined}
              onMouseLeave={isThermal ? handleThermalMouseLeave : undefined}
            >
              <button
                id={`mode-${m.id}-btn`}
                onClick={() => onModeChange(m.id)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 rounded-full font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] transition-all duration-200 flex items-center gap-1.5 cursor-pointer touch-manipulation whitespace-nowrap ${
                  isActive
                    ? 'bg-[#18181B] text-white font-semibold shadow-xs'
                    : 'text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.03]'
                }`}
              >
                {isThermal && (
                  <Flame
                    className={`w-3 h-3 transition-colors ${
                      isActive ? 'text-amber-400' : 'text-amber-500/80'
                    }`}
                  />
                )}
                <span>{m.label}</span>
                <span
                  className={`text-[8px] tracking-widest hidden xs:inline ${
                    isActive ? 'text-[#D4D4D8]' : 'text-[#A1A1AA]'
                  }`}
                >
                  {m.micro}
                </span>
              </button>

              {/* Discreet trigger helper on mobile / touch */}
              {isThermal && (
                <button
                  onClick={handleToggleThermalCard}
                  className={`p-1 -ml-1 rounded-full text-[9px] font-mono transition-colors cursor-pointer sm:hidden ${
                    showThermalComparison
                      ? 'text-amber-600 bg-amber-500/15'
                      : 'text-[#A1A1AA] hover:text-[#18181B]'
                  }`}
                  title="Показать график теплопроводности U-value"
                >
                  <BarChart2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Micro divider */}
        <div className="w-[1px] h-3.5 bg-[#E4E4E7] mx-1 hidden sm:block" />

        {/* Dimension Lines Toggle */}
        <button
          onClick={onToggleDimensions}
          className={`px-2.5 py-1.5 rounded-full font-mono text-[9px] sm:text-[10px] uppercase tracking-wider transition-colors hidden sm:flex items-center gap-1 cursor-pointer ${
            showDimensions
              ? 'text-[#18181B] font-semibold'
              : 'text-[#A1A1AA] hover:text-[#71717A]'
          }`}
          title="Вкл/выкл выносные размерные линии"
        >
          <Eye className="w-3 h-3" />
          <span>РАЗМЕРЫ</span>
        </button>
      </div>

      {/* Floating Thermal U-Value Comparison Popover (Recharts Data Visualization) */}
      {showThermalComparison && (
        <div
          className="pointer-events-auto mt-1 z-50 animate-in fade-in zoom-in-95 duration-200"
          onMouseEnter={handleThermalMouseEnter}
          onMouseLeave={handleThermalMouseLeave}
        >
          <ThermalUValueComparison
            onClose={() => setShowThermalComparison(false)}
          />
        </div>
      )}

      {/* Interactive Micro Scrubber when in Exploded or Structure Mode */}
      {(currentMode === 'exploded' || currentMode === 'structure') && (
        <div className="pointer-events-auto flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/75 hover:bg-white/90 backdrop-blur-md border border-black/[0.03] text-xs font-mono text-[#71717A] transition-all duration-200 animate-in fade-in duration-200">
          <span className="text-[9px] uppercase tracking-widest text-[#A1A1AA]">
            РАЗБОРКА
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={scrubValue}
            onChange={(e) => onScrubChange(parseFloat(e.target.value))}
            className="w-24 sm:w-36 accent-[#18181B] cursor-pointer h-1 bg-[#E4E4E7] rounded-lg appearance-none touch-manipulation"
          />
          <span className="text-[9px] uppercase font-semibold text-[#18181B] min-w-[28px] text-right">
            {Math.round(scrubValue * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};
