import React from 'react';

interface PanelSceneSkeletonProps { inline?: boolean; }

export const PanelSceneSkeleton: React.FC<PanelSceneSkeletonProps> = ({ inline = false }) => (
  <div role="status" aria-live="polite" aria-busy="true"
    className={`${inline ? 'relative' : 'absolute inset-0 z-10'} w-full h-full overflow-hidden bg-[#11110F] text-[#F5F2EA] flex flex-col items-center justify-center select-none`}>
    <div aria-hidden="true" className="relative w-52 h-60 mb-8 motion-safe:animate-pulse">
      {['border-white/10 bg-white/[0.02]', 'border-[#F4DD45]/25 bg-[#F4DD45]/[0.025]', 'border-white/25 bg-white/[0.04]'].map((style, index) => (
        <div key={style} className={`absolute top-5 left-8 w-32 h-44 rounded-sm border ${style}`}
          style={{ transform: `skewY(-12deg) translate(${(index - 1) * 20}px, ${(index - 1) * 8}px)` }} />
      ))}
    </div>
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F4DD45]">Автобиография / 3D</p>
    <p className="mt-3 text-sm text-[#AAA69C]">Подготавливаем модель панели</p>
  </div>
);
