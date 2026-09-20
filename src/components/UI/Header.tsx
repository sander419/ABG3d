import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="z-30 flex h-[68px] w-full select-none items-center justify-between border-b border-black/10 bg-[#F3F0E9]/95 px-4 backdrop-blur-xl sm:px-7">
      <a
        href="https://abgtz.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Автобиография — официальный сайт"
        className="inline-flex min-h-10 items-center bg-[#1D1C19] px-3 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <img
          src="/brand/autobiography-logo.png"
          alt="Автобиография — технологии нового уровня"
          className="h-auto w-[132px] sm:w-[166px]"
          width="1645"
          height="283"
        />
      </a>

      <div className="flex items-center gap-3 text-[11px] text-[#756F66] sm:gap-6">
        <div className="hidden md:flex items-center gap-4">
          <div>
            <span className="text-[#928A7E]">Контур </span>
            <span className="text-[#34312C]">по проекту</span>
          </div>
          <div className="h-3 w-px bg-black/15" />
          <div>
            <span className="text-[#928A7E]">Состав </span>
            <span className="text-[#34312C]">390 мм*</span>
          </div>
        </div>

        <a
          href="https://abgtz.com/bystrovozvodimye-prefab-doma-iz-betonnyh-trehsloynyh-paneley-po-tehnologii-peikkor.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-1.5 border-b border-black/20 px-1 text-[10px] uppercase tracking-[0.12em] text-[#34312C] transition-colors hover:border-[#947552] hover:text-black"
        >
          <span className="hidden sm:inline">Технология Peikko®</span>
          <span className="sm:hidden">ABGTZ.COM</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-[#947552]" aria-hidden="true" />
        </a>
      </div>
    </header>
  );
};

