import React from 'react';
import { Html } from '@react-three/drei';

interface Hotspot3DProps {
  position: [number, number, number];
  title: string;
  badge?: string;
  isActive: boolean;
  onClick: () => void;
}

export const Hotspot3D: React.FC<Hotspot3DProps> = ({
  position,
  title,
  badge,
  isActive,
  onClick,
}) => {
  return (
    <Html
      position={position}
      center
      distanceFactor={4.8}
      className="pointer-events-none select-none z-10"
    >
      <div
        className="pointer-events-auto flex items-center gap-2 group cursor-pointer transition-all duration-300"
        onClick={onClick}
      >
        {/* Architectural indicator point */}
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 border ${
            isActive
              ? 'bg-[#18181B] border-[#18181B] scale-110 shadow-sm'
              : 'bg-white/90 border-[#D4D4D8] group-hover:border-[#18181B] group-hover:scale-105 shadow-sm'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              isActive ? 'bg-white' : 'bg-[#18181B]'
            }`}
          />
        </div>

        {/* Minimalist Micro-Pill */}
        <div
          className={`px-2.5 py-1 rounded-full border text-[11px] font-sans tracking-wide transition-all duration-300 whitespace-nowrap shadow-sm backdrop-blur-md flex items-center gap-1.5 ${
            isActive
              ? 'bg-[#18181B] text-white border-[#18181B]'
              : 'bg-white/80 text-[#27272A] border-black/5 group-hover:bg-white group-hover:border-[#D4D4D8]'
          }`}
        >
          <span className="font-medium">{title}</span>
          {badge && (
            <span
              className={`text-[9px] uppercase tracking-widest ${
                isActive ? 'text-[#A1A1AA]' : 'text-[#71717A]'
              }`}
            >
              {badge}
            </span>
          )}
        </div>
      </div>
    </Html>
  );
};
