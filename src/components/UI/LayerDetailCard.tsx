import React from 'react';
import { PANEL_CONFIG } from '../../data/panelConfig';
import { X } from 'lucide-react';

interface LayerDetailCardProps {
  selectedId: string | null;
  onClose: () => void;
}

export const LayerDetailCard: React.FC<LayerDetailCardProps> = ({
  selectedId,
  onClose,
}) => {
  if (!selectedId) return null;

  const layer = PANEL_CONFIG.layers.find((l) => l.id === selectedId);
  if (!layer) return null;

  return (
    <section id="layer-detail-dock" aria-live="polite" className="absolute bottom-20 sm:bottom-24 min-[1180px]:bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md p-4 rounded-sm bg-[#131310]/94 backdrop-blur-2xl border border-white/12 border-t-[#F4DD45]/40 shadow-[0_20px_60px_rgba(0,0,0,0.42)] animate-in fade-in slide-in-from-bottom-2 duration-200 text-[#F5F2EA]">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#F4DD45]">
              СЛОЙ {layer.index} // {layer.thickness}
            </span>
          </div>
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#F5F2EA] mt-0.5">
            {layer.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Закрыть сведения о слое"
          className="min-h-9 min-w-9 rounded-sm text-[#9D998E] hover:text-white hover:bg-white/10 active:scale-[0.96] transition-[transform,background-color,color] cursor-pointer inline-flex items-center justify-center"
          title="Закрыть"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <p className="text-[13px] text-[#B8B4AA] leading-relaxed mb-3 text-pretty">
        {layer.subtitle}
      </p>

      <div className="border-t border-white/10 pt-2 flex items-center justify-between">
        <span className="text-[9px] font-mono uppercase tracking-wider text-[#77746C]">
          Спецификация:
        </span>
        <span className="text-[10px] font-mono text-[#E4E0D6] text-right pl-3">
          {layer.spec}
        </span>
      </div>
    </section>
  );
};
