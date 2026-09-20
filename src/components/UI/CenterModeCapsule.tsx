import React from 'react';
import { Eye, Flame } from 'lucide-react';
import { WidgetViewMode } from '../../data/panelConfig';

interface CenterModeCapsuleProps {
  currentMode: WidgetViewMode;
  onModeChange: (mode: WidgetViewMode) => void;
  scrubValue: number;
  onScrubChange: (value: number) => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
}

const modes: { id: WidgetViewMode; label: string }[] = [
  { id: 'exploded', label: 'Слои' },
  { id: 'assembled', label: 'Собрана' },
  { id: 'structure', label: 'Арматура' },
  { id: 'thermal', label: 'Тепловая схема' },
];

export const CenterModeCapsule: React.FC<CenterModeCapsuleProps> = ({
  currentMode,
  onModeChange,
  scrubValue,
  onScrubChange,
  showDimensions,
  onToggleDimensions,
}) => (
  <div className="pointer-events-none flex max-w-[calc(100vw-1.5rem)] flex-col items-center gap-2.5 select-none">
    <div role="group" aria-label="Режим отображения панели" className="pointer-events-auto flex items-center bg-[#F4F1EA]/95 p-1 shadow-[0_18px_48px_rgba(31,28,22,0.14)] ring-1 ring-black/10 backdrop-blur-xl">
      {modes.map((mode) => {
        const active = currentMode === mode.id;
        return (
          <button
            key={mode.id}
            id={`mode-${mode.id}-btn`}
            onClick={() => onModeChange(mode.id)}
            aria-pressed={active}
            className={`flex min-h-10 items-center gap-1.5 px-3 text-[11px] tracking-[-0.01em] transition-colors sm:px-4 ${active ? 'bg-[#1D1C19] text-white' : 'text-[#6E685E] hover:bg-black/[0.045] hover:text-[#1D1C19]'}`}
          >
            {mode.id === 'thermal' && <Flame className={`h-3.5 w-3.5 ${active ? 'text-[#B89A70]' : 'text-[#8B7354]'}`} />}
            <span>{mode.label}</span>
          </button>
        );
      })}
      <span className="mx-1 hidden h-4 w-px bg-black/10 sm:block" />
      <button
        onClick={onToggleDimensions}
        aria-pressed={showDimensions}
        title="Показать размеры панели"
        className={`hidden min-h-10 items-center gap-1.5 px-3 text-[11px] transition-colors sm:flex ${showDimensions ? 'text-[#846846]' : 'text-[#777168] hover:text-[#1D1C19]'}`}
      >
        <Eye className="h-3.5 w-3.5" />
        Размеры
      </button>
    </div>

    {currentMode === 'thermal' && (
      <div className="max-w-lg bg-[#F4F1EA]/95 px-4 py-2 text-center text-[11px] leading-relaxed text-[#6E685E] shadow-sm ring-1 ring-black/10">
        Наружный слой → теплоизоляция → интерьер. Цвет показывает принцип, а не заменяет теплотехнический расчёт.
      </div>
    )}

    {(currentMode === 'exploded' || currentMode === 'structure') && (
      <label htmlFor="panel-explode-range" className="pointer-events-auto flex items-center gap-3 bg-[#F4F1EA]/95 px-4 py-2.5 text-[11px] text-[#777168] shadow-sm ring-1 ring-black/10 backdrop-blur-xl">
        <span>Степень раскрытия</span>
        <input
          id="panel-explode-range"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={scrubValue}
          onChange={(event) => onScrubChange(Number(event.target.value))}
          className="h-0.5 w-24 cursor-pointer appearance-none bg-black/15 accent-[#8B7354] sm:w-40"
        />
        <span className="min-w-8 text-right font-mono text-[10px] tabular-nums text-[#34312C]">{Math.round(scrubValue * 100)}%</span>
      </label>
    )}
  </div>
);
