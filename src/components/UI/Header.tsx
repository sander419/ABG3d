import React from 'react';
import { PANEL_CONFIG } from '../../data/panelConfig';
import { ArrowUpRight } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full h-12 px-6 sm:px-8 flex items-center justify-between z-30 border-b border-black/[0.04] bg-[#FBFBFB]/90 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.24em] font-semibold text-[#18181B]">
          ABG PREFABDOM
        </span>
        <span className="w-1 h-1 rounded-full bg-[#18181B] hidden xs:inline-block" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#71717A] hidden xs:inline-block">
          ARCHITECTURAL PRECAST 390
        </span>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 font-mono text-[10px] text-[#71717A]">
        <div className="hidden md:flex items-center gap-4">
          <div>
            <span className="text-[#A1A1AA]">R₀: </span>
            <span className="text-[#18181B] font-semibold">{PANEL_CONFIG.meta.r0Value}</span> {PANEL_CONFIG.meta.r0Unit}*
          </div>
          <div className="w-[1px] h-3 bg-[#E4E4E7]" />
          <div>
            <span className="text-[#A1A1AA]">Сборка: </span>
            <span className="text-[#18181B] font-semibold">{PANEL_CONFIG.meta.assemblyTime}*</span>
          </div>
        </div>

        <a
          href="https://abg-prefabdom.ru"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider text-[#18181B] hover:text-[#71717A] transition-colors uppercase"
        >
          <span>abg-prefabdom.ru</span>
          <ArrowUpRight className="w-3 h-3 text-[#71717A]" />
        </a>
      </div>
    </header>
  );
};

