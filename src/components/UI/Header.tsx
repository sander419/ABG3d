import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full h-16 px-4 sm:px-6 flex items-center justify-between z-30 select-none border-b border-white/10 bg-[#0A0A09]/92 backdrop-blur-xl">
      <a
        href="https://abgtz.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Автобиография — официальный сайт"
        className="min-h-10 inline-flex items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4DD45]"
      >
        <img
          src="/brand/autobiography-logo.png"
          alt="Автобиография — технологии нового уровня"
          className="h-auto w-[142px] sm:w-[176px]"
          width="1645"
          height="283"
        />
      </a>

      <div className="flex items-center gap-3 sm:gap-5 font-mono text-[11px] text-[#A9A59B] tabular-nums">
        <div className="hidden md:flex items-center gap-4">
          <div>
            <span className="text-[#77746C]">Контур: </span>
            <span className="text-[#F5F2EA] font-semibold">по проекту</span>
          </div>
          <div className="w-[1px] h-3 bg-white/15" />
          <div>
            <span className="text-[#77746C]">Состав: </span>
            <span className="text-[#F5F2EA] font-semibold">390 мм*</span>
          </div>
        </div>

        <a
          href="https://abgtz.com/bystrovozvodimye-prefab-doma-iz-betonnyh-trehsloynyh-paneley-po-tehnologii-peikkor.html"
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-10 inline-flex items-center gap-1.5 px-2 rounded-sm text-[10px] font-mono tracking-wider text-[#F5F2EA] hover:text-[#F4DD45] hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4DD45] transition-[background-color,color] uppercase"
        >
          <span className="hidden sm:inline">Технология Peikko®</span>
          <span className="sm:hidden">ABGTZ.COM</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#F4DD45]" aria-hidden="true" />
        </a>
      </div>
    </header>
  );
};

