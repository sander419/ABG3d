import React from 'react';

interface PanelSceneSkeletonProps { inline?: boolean; }

export const PanelSceneSkeleton: React.FC<PanelSceneSkeletonProps> = ({ inline = false }) => (
  <div role="status" aria-live="polite" aria-busy="true"
    className={`${inline ? 'relative' : 'absolute inset-0 z-10'} flex h-full w-full select-none flex-col items-center justify-center overflow-hidden bg-[#D8D3C9] text-[#1D1C19]`}>
    <div aria-hidden="true" className="relative w-52 h-60 mb-8 motion-safe:animate-pulse">
      {['border-black/10 bg-white/15', 'border-[#947552]/35 bg-[#947552]/[0.04]', 'border-black/25 bg-white/25'].map((style, index) => (
        <div key={style} className={`absolute top-5 left-8 w-32 h-44 rounded-sm border ${style}`}
          style={{ transform: `skewY(-12deg) translate(${(index - 1) * 20}px, ${(index - 1) * 8}px)` }} />
      ))}
    </div>
    <p className="text-[10px] uppercase tracking-[0.2em] text-[#846846]">Автобиография / 3D</p>
    <p className="mt-3 text-sm text-[#6F695F]">Подготавливаем модель панели</p>
  </div>
);
