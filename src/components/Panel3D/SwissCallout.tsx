import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { LayerState } from '../../data/panelConfig';

interface SwissCalloutProps {
  position: [number, number, number];
  layer: LayerState;
  direction?: 'left' | 'right';
  isActive: boolean;
  onSelect: () => void;
}

export const SwissCallout: React.FC<SwissCalloutProps> = ({
  position,
  layer,
  direction = 'right',
  isActive,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  const isRight = direction === 'right';

  // Vector line geometry (origin [0, 0] at 6px hotspot center)
  // Diagonal segment at ~45deg followed by a short horizontal lead-in to placard
  const dx = isRight ? 38 : -38;
  const dy = -28;
  const leadX = isRight ? dx + 8 : dx - 8;

  const isHighlighted = hovered || isActive;

  return (
    <Html
      position={position}
      center={false}
      distanceFactor={4.4}
      zIndexRange={[60, 0]}
      className="pointer-events-none select-none"
    >
      <div
        className="relative group pointer-events-auto cursor-pointer touch-manipulation"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        title={`Нажмите, чтобы изучить: ${layer.title}`}
      >
        {/* Invisible 44px touch target for easy finger tapping on mobile */}
        <div className="absolute -top-[19px] -left-[19px] w-[44px] h-[44px] cursor-pointer" />

        {/* 1. PULSE-ANIMATED HOTSPOT (6px) AT KEY ANCHOR POINT */}
        <div className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px]">
          {/* Continuous architectural radar pulse ring */}
          <span
            className={`absolute inset-0 rounded-full border pointer-events-none transition-colors duration-300 ${
              isHighlighted
                ? 'border-[#18181B] hotspot-pulse-ring-active'
                : 'border-[#71717A] hotspot-pulse-ring'
            }`}
          />

          {/* Core 6px circular anchor with 1px border and center micro-dot */}
          <div
            className={`relative w-[6px] h-[6px] rounded-full border bg-[#F7F7F8] transition-all duration-300 flex items-center justify-center ${
              isHighlighted
                ? 'scale-125 border-[#18181B] shadow-[0_0_8px_rgba(0,0,0,0.15)]'
                : 'scale-100 border-[#71717A]'
            }`}
          >
            <span
              className={`w-[2px] h-[2px] rounded-full transition-colors duration-200 ${
                isHighlighted ? 'bg-[#18181B]' : 'bg-[#71717A]'
              }`}
            />
          </div>
        </div>

        {/* 2. VECTOR LEADER LINE (Minimal 1px Stroke SVG) */}
        <svg
          className="absolute top-0 left-0 overflow-visible pointer-events-none"
          width="1"
          height="1"
          style={{ shapeRendering: 'geometricPrecision' }}
        >
          {/* Main angled leader line */}
          <path
            d={`M 0 0 L ${dx} ${dy} L ${leadX} ${dy}`}
            fill="none"
            stroke={isHighlighted ? '#18181B' : '#71717A'}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors duration-300"
          />

          {/* Terminal junction micro-tick onto the placard border */}
          <circle
            cx={leadX}
            cy={dy}
            r="1.25"
            fill={isHighlighted ? '#18181B' : '#71717A'}
            className="transition-colors duration-300"
          />
        </svg>

        {/* 3. MINIMAL 1PX-STROKE TEXT PLACARD (Swiss Architectural Typography) */}
        <div
          className={`absolute pointer-events-auto transition-all duration-300 max-w-[160px] sm:max-w-none px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-[2px] border backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.04)] ${
            isHighlighted
              ? 'border-[#18181B] bg-white/95 translate-y-[-1px]'
              : 'border-black/10 hover:border-black/25 bg-[#F7F7F8]/90'
          }`}
          style={{
            left: isRight ? `${leadX + 4}px` : 'auto',
            right: !isRight ? `${-leadX + 4}px` : 'auto',
            top: `${dy - 18}px`,
          }}
        >
          {/* Top Line: Index & Dimension */}
          <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.18em] leading-none mb-1">
            <span className={isHighlighted ? 'text-[#18181B] font-semibold' : 'text-[#71717A]'}>
              {layer.index} // {layer.id.toUpperCase()}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#D4D4D8]" />
            <span className="font-semibold text-[#18181B] tracking-normal">
              {layer.thickness}
            </span>
          </div>

          {/* Middle Line: Clean Architectural Title */}
          <div className="text-[10px] sm:text-[11px] font-sans font-medium text-[#18181B] tracking-tight leading-tight whitespace-normal sm:whitespace-nowrap">
            {layer.title}
          </div>

          {/* Bottom Line: Engineering Specification */}
          <div className="font-mono text-[8px] sm:text-[9px] text-[#71717A] tracking-wider mt-1 leading-none truncate max-w-[150px] sm:max-w-none">
            {layer.spec}
          </div>
        </div>
      </div>
    </Html>
  );
};
