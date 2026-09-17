import React from 'react';

interface PanelSceneSkeletonProps {
  inline?: boolean;
}

/**
 * Low-opacity architectural skeleton loader for PanelScene.
 * Displays a subtle wireframe schematic and cached asset initialization status
 * during React Suspense resolution.
 */
export const PanelSceneSkeleton: React.FC<PanelSceneSkeletonProps> = ({ inline = false }) => {
  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#FBFBFB] select-none flex flex-col items-center justify-center ${
        inline ? '' : 'absolute inset-0 z-10'
      }`}
    >
      {/* 1. Subtle architectural grid coordinate backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(24, 24, 27, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(24, 24, 27, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Crosshair accents at corners */}
      <div className="absolute top-6 left-6 font-mono text-[10px] text-[#A1A1AA] pointer-events-none">
        + 00.00° / LAT-X
      </div>
      <div className="absolute top-6 right-6 font-mono text-[10px] text-[#A1A1AA] pointer-events-none">
        + 90.00° / ELEV-Z
      </div>
      <div className="absolute bottom-6 left-6 font-mono text-[10px] text-[#A1A1AA] pointer-events-none">
        SCALE 1:1 // 2400×2000×390 mm
      </div>

      {/* 2. Low-opacity 3D Sandwich Slab Wireframe Outline */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 max-w-sm w-full animate-pulse opacity-45">
        {/* Isometric Panel Layer Silhouette */}
        <div className="relative w-64 h-56 flex items-center justify-center mb-6">
          {/* Layer 3: Structural Concrete (Back) */}
          <div
            className="absolute w-44 h-48 rounded-md border border-[#71717A]/40 bg-[#E4E4E7]/30 shadow-xs"
            style={{ transform: 'rotate(-12deg) skew(-10deg) translate(-14px, -14px)' }}
          >
            <div className="absolute bottom-2 left-2 font-mono text-[8px] text-[#71717A]">
              120 mm B25
            </div>
          </div>

          {/* Layer 2: PIR Core (Middle) */}
          <div
            className="absolute w-44 h-48 rounded-md border border-[#D97706]/40 bg-[#FEF3C7]/30 shadow-xs"
            style={{ transform: 'rotate(-12deg) skew(-10deg) translate(0px, 0px)' }}
          >
            <div className="absolute bottom-2 left-2 font-mono text-[8px] text-[#B45309]">
              200 mm PIR λ0.022
            </div>
            {/* Cellular pore pattern representation */}
            <div
              className="absolute inset-2 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(#D97706 0.75px, transparent 0.75px)',
                backgroundSize: '8px 8px',
              }}
            />
          </div>

          {/* Layer 1: Facade Concrete (Front) */}
          <div
            className="absolute w-44 h-48 rounded-md border border-[#52525B]/50 bg-white/60 shadow-sm"
            style={{ transform: 'rotate(-12deg) skew(-10deg) translate(14px, 14px)' }}
          >
            <div className="absolute bottom-2 left-2 font-mono text-[8px] text-[#52525B]">
              70 mm B35 W8
            </div>
          </div>

          {/* Peikko Truss Guideline */}
          <div
            className="absolute w-36 h-0.5 border-t border-dashed border-[#DC2626]/50"
            style={{ transform: 'rotate(45deg)' }}
          />
        </div>

        {/* Technical Status Readout */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/[0.04] border border-black/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#18181B] animate-ping shrink-0" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#3F3F46]">
              PREFABDOM // 3D KERNEL
            </span>
          </div>

          <div className="font-mono text-[11px] text-[#71717A] tracking-tight">
            Синхронизация процедурных карт и шейдера PIR...
          </div>

          {/* Slim progress bar track */}
          <div className="w-48 h-0.5 bg-black/[0.06] rounded-full overflow-hidden mt-1">
            <div className="w-full h-full bg-[#18181B] -translate-x-full animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
};
