import React from 'react';
import { Html } from '@react-three/drei';

interface DimensionLines3DProps {
  visible: boolean;
  explodedOffset: number; // 0 to 1
}

export const DimensionLines3D: React.FC<DimensionLines3DProps> = ({
  visible,
  explodedOffset,
}) => {
  if (!visible) return null;

  // Layer Z centers:
  // Facade: 0.135 + offset * 0.75
  // PIR: 0.0
  // Loadbearing: -0.160 - offset * 0.75
  const zFacade = 0.135 + explodedOffset * 0.75;
  const zPIR = 0.0;
  const zLoad = -0.160 - explodedOffset * 0.75;

  const yPos = -1.22;
  const xPos = 1.08;

  return (
    <group position={[xPos, yPos, 0]}>
      {/* Hairline ticks on ground plane */}
      {/* Facade: 70 mm */}
      <Html
        position={[0.15, 0.05, zFacade]}
        center
        distanceFactor={4.5}
        className="pointer-events-none select-none"
      >
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#71717A] tracking-wider whitespace-nowrap">
          <span className="w-2.5 h-[1px] bg-[#A1A1AA]" />
          <span className="font-medium text-[#18181B]">70 мм</span>
          <span className="text-[9px] uppercase tracking-widest text-[#A1A1AA]">Фасад</span>
        </div>
      </Html>

      {/* Thermal insulation: 2 × 100 mm in ABG's public construction description. */}
      <Html
        position={[0.15, 0.05, zPIR]}
        center
        distanceFactor={4.5}
        className="pointer-events-none select-none"
      >
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#71717A] tracking-wider whitespace-nowrap">
          <span className="w-2.5 h-[1px] bg-[#A1A1AA]" />
          <span className="font-semibold text-[#18181B]">2 × 100 мм</span>
          <span className="text-[9px] uppercase tracking-widest text-[#9A9483]">Теплоизоляция</span>
        </div>
      </Html>

      {/* Loadbearing: 120 mm */}
      <Html
        position={[0.15, 0.05, zLoad]}
        center
        distanceFactor={4.5}
        className="pointer-events-none select-none"
      >
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#71717A] tracking-wider whitespace-nowrap">
          <span className="w-2.5 h-[1px] bg-[#A1A1AA]" />
          <span className="font-medium text-[#18181B]">120 мм</span>
          <span className="text-[9px] uppercase tracking-widest text-[#A1A1AA]">Монолит</span>
        </div>
      </Html>

      {/* Total 390 mm Callout when assembled */}
      {explodedOffset < 0.12 && (
        <Html
          position={[0.3, -0.15, 0]}
          center
          distanceFactor={4.5}
          className="pointer-events-none select-none"
        >
          <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-black/5 shadow-sm flex items-center gap-1.5 font-mono text-xs whitespace-nowrap">
            <span className="text-[10px] uppercase text-[#71717A] tracking-widest">Толщина:</span>
            <span className="font-semibold text-[#18181B]">390 мм</span>
          </div>
        </Html>
      )}
    </group>
  );
};
