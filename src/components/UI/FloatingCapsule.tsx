import React from 'react';
import { WidgetViewMode } from '../../data/panelConfig';
import { Layers, Sliders, Thermometer, Shield } from 'lucide-react';

interface FloatingCapsuleProps {
  currentMode: WidgetViewMode;
  onModeChange: (mode: WidgetViewMode) => void;
  scrubValue: number;
  onScrubChange: (val: number) => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
  storyMode: boolean;
  onToggleStoryMode: () => void;
}

export const FloatingCapsule: React.FC<FloatingCapsuleProps> = ({
  currentMode,
  onModeChange,
  scrubValue,
  onScrubChange,
  showDimensions,
  onToggleDimensions,
  storyMode,
  onToggleStoryMode,
}) => {
  const tabs: { id: WidgetViewMode; label: string; micro: string }[] = [
    { id: 'assembled', label: 'Конструктив', micro: '390 мм' },
    { id: 'exploded', label: 'Слои', micro: 'Разборка' },
    { id: 'structure', label: 'Каркас', micro: 'Узлы' },
    { id: 'thermal', label: 'Энергия', micro: 'Тепло' },
  ];

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 select-none w-full max-w-[calc(100vw-1rem)] px-2">
      {/* Interactive smooth scrubber when in 'exploded' or 'structure' mode */}
      {!storyMode && (currentMode === 'exploded' || currentMode === 'structure') && (
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/90 backdrop-blur-xl border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-xs font-mono text-[#71717A] animate-in fade-in duration-300">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-wider">Собрано</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={scrubValue}
            onChange={(e) => onScrubChange(parseFloat(e.target.value))}
            className="w-24 xs:w-32 sm:w-44 accent-[#18181B] cursor-pointer h-1.5 bg-[#E4E4E7] rounded-lg appearance-none touch-manipulation"
          />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#18181B] font-semibold min-w-[28px]">
            {Math.round(scrubValue * 100)}%
          </span>
        </div>
      )}

      {/* Main Floating Capsule Controller */}
      <div className="flex items-center gap-1 p-1 sm:p-1.5 rounded-full bg-white/90 backdrop-blur-2xl border border-black/5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] max-w-full overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = currentMode === tab.id && !storyMode;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (storyMode) onToggleStoryMode();
                onModeChange(tab.id);
              }}
              className={`px-2.5 xs:px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-sans tracking-tight sm:tracking-wide transition-all duration-300 flex items-center gap-1 sm:gap-1.5 whitespace-nowrap touch-manipulation ${
                isActive
                  ? 'bg-[#18181B] text-white shadow-sm font-medium'
                  : 'text-[#52525B] hover:text-[#18181B] hover:bg-black/[0.03]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[8px] sm:text-[9px] font-mono tracking-widest uppercase hidden xs:inline ${
                  isActive ? 'text-[#A1A1AA]' : 'text-[#A1A1AA]'
                }`}
              >
                {tab.micro}
              </span>
            </button>
          );
        })}

        {/* Divider */}
        <div className="w-[1px] h-4 bg-[#E4E4E7] mx-1 hidden sm:block" />

        {/* Scroll Storytelling Toggle */}
        <button
          onClick={onToggleStoryMode}
          className={`px-3 py-2 rounded-full text-xs font-mono transition-all duration-200 hidden sm:flex items-center gap-1.5 ${
            storyMode
              ? 'bg-[#18181B] text-white font-medium'
              : 'text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.03]'
          }`}
          title="Режим бесшовного скролл-сторителлинга"
        >
          <span className="text-[10px] tracking-wider uppercase">
            {storyMode ? 'Скролл-режим ON' : 'Скролл-стори'}
          </span>
        </button>

        {/* Dimensions toggle */}
        <button
          onClick={onToggleDimensions}
          className={`px-3 py-2 rounded-full text-xs font-mono transition-colors hidden md:flex items-center gap-1.5 ${
            showDimensions
              ? 'text-[#18181B] font-medium'
              : 'text-[#A1A1AA] hover:text-[#71717A]'
          }`}
          title="Показать / скрыть выносные линии размеров"
        >
          <span className="text-[10px] tracking-wider uppercase">Размеры</span>
        </button>
      </div>
    </div>
  );
};
