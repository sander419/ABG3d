import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { X, ArrowUpRight } from 'lucide-react';

export interface HotspotAnnotation {
  id: string;
  tag: string;
  title: string;
  spec: string;
  note: string;
  details: string[];
}

interface InvisibleHotspotProps {
  position: [number, number, number];
  data: HotspotAnnotation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export const InvisibleHotspot: React.FC<InvisibleHotspotProps> = ({
  position,
  data,
  isSelected,
  onSelect,
  onClose,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Html
      position={position}
      center
      distanceFactor={4.6}
      zIndexRange={[80, 0]}
      className="pointer-events-none select-none"
    >
      <div className="relative group pointer-events-auto">
        {/* Pulsing Micron-Ring Trigger Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isSelected) {
              onClose();
            } else {
              onSelect(data.id);
            }
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative w-8 h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer touch-manipulation focus:outline-hidden"
          title={`${data.title} — нажмите для инженерной аннотации`}
        >
          {/* Subtle Ambient Breathing Ring */}
          <span
            className={`absolute inset-0 rounded-full border transition-all duration-700 pointer-events-none ${
              isSelected
                ? 'border-[#18181B] scale-125 opacity-100 ring-2 ring-[#18181B]/20'
                : hovered
                ? 'border-[#18181B] scale-110 opacity-90'
                : 'border-black/30 scale-90 opacity-60 animate-ping'
            }`}
          />

          {/* Secondary Fixed Hairline Ring */}
          <span
            className={`absolute inset-1 rounded-full border transition-all duration-300 ${
              isSelected
                ? 'border-[#18181B] bg-white/90 shadow-sm'
                : hovered
                ? 'border-[#18181B] bg-white/80'
                : 'border-black/40 bg-white/50 backdrop-blur-xs'
            }`}
          />

          {/* Center Micro-Dot */}
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              isSelected ? 'bg-[#18181B] scale-125' : hovered ? 'bg-[#18181B]' : 'bg-[#52525B]'
            }`}
          />
        </button>

        {/* Minimalist Swiss Engineering Pop-up (Invisible UI Pop-up) */}
        {isSelected && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-6 -top-12 z-50 w-72 sm:w-80 p-4 rounded-xl bg-white/95 backdrop-blur-xl border border-black/10 shadow-[0_16px_40px_rgba(0,0,0,0.08)] animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header: Tag + Close */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/[0.06]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#18181B]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.24em] font-semibold text-[#18181B]">
                  {data.tag}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1 rounded-full text-[#71717A] hover:text-[#18181B] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Title & Spec */}
            <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#18181B]">
              {data.title}
            </h4>
            <div className="font-mono text-[10px] text-[#52525B] mt-0.5 font-medium">
              {data.spec}
            </div>

            {/* Authoritative Engineering Note */}
            <p className="text-[11px] text-[#3F3F46] leading-relaxed mt-2">
              {data.note}
            </p>

            {/* Bulleted Specifications */}
            <div className="mt-3 pt-2.5 border-t border-black/[0.04] space-y-1">
              {data.details.map((detail, idx) => (
                <div key={idx} className="flex items-start gap-2 font-mono text-[9px] text-[#71717A]">
                  <span className="text-[#18181B] font-bold">•</span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>

            {/* Footnote */}
            <div className="mt-2.5 pt-2 border-t border-black/[0.04] flex items-center justify-between text-[8px] font-mono text-[#A1A1AA] uppercase tracking-wider">
              <span>Стандарт Peikko & ABG</span>
              <span>Пример расчета*</span>
            </div>
          </div>
        )}
      </div>
    </Html>
  );
};
