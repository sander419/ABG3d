import React from 'react';
import { PANEL_CONFIG } from '../../data/panelConfig';
import { ShieldCheck, Clock, Thermometer, Layers } from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  const { comparison } = PANEL_CONFIG;

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-12 py-12 sm:py-20 border-t border-black/5 select-none">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-3 sm:gap-4">
        <div>
          <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#71717A]">
            Инженерное превосходство
          </span>
          <h2 className="text-xl sm:text-3xl font-sans font-semibold text-[#18181B] tracking-tight mt-1">
            Заводской монолит против кладки из блоков
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#71717A] max-w-md leading-relaxed">
          Сравнение физико-механических характеристик и эксплуатационной надежности для загородных резиденций.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {comparison.map((item, idx) => (
          <div
            key={idx}
            className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/70 backdrop-blur-md border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-black/5">
                <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider sm:tracking-widest text-[#71717A]">
                  {item.parameter}
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-medium text-[#18181B] bg-black/5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                  {item.metric}
                </span>
              </div>

              {/* ABG Prefab */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#18181B] shrink-0" />
                  <h4 className="text-xs sm:text-sm font-sans font-semibold text-[#18181B]">
                    {item.prefab.title}
                  </h4>
                </div>
                <p className="text-xs text-[#52525B] leading-relaxed pl-4">
                  {item.prefab.detail}
                </p>
                <div className="mt-1.5 sm:mt-2 pl-4">
                  <span className="text-[9px] sm:text-[10px] font-mono text-[#059669] font-medium uppercase tracking-wider">
                    {item.prefab.highlight}
                  </span>
                </div>
              </div>

              {/* Traditional Masonry */}
              <div className="pt-3 sm:pt-4 border-t border-black/5">
                <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D4D4D8] shrink-0" />
                  <h4 className="text-xs sm:text-sm font-sans font-medium text-[#71717A]">
                    {item.traditional.title}
                  </h4>
                </div>
                <p className="text-xs text-[#71717A] leading-relaxed pl-4">
                  {item.traditional.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editorial Quote / Conclusion */}
      <div className="mt-8 sm:mt-12 p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/60 border border-black/5 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 text-center sm:text-left">
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-[#18181B]">
            50+ лет службы без скрытых дефектов
          </h4>
          <p className="text-[11px] sm:text-xs text-[#71717A] mt-0.5 max-w-xl">
            Контроль пропарки бетона, машинная стыковка замков PIR и заводские испытания каждого элемента.
          </p>
        </div>
        <a
          href="https://abg-prefabdom.ru"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-sans font-medium shadow-sm transition-colors text-center whitespace-nowrap touch-manipulation"
        >
          Заказать расчет проекта
        </a>
      </div>
    </section>
  );
};
