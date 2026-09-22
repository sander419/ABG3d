import React from 'react';
import { X } from 'lucide-react';
import { PANEL_CONFIG } from '../../data/panelConfig';

interface LayerDetailCardProps {
  selectedId: string | null;
  onClose: () => void;
}

export const LayerDetailCard: React.FC<LayerDetailCardProps> = ({ selectedId, onClose }) => {
  if (!selectedId) return null;
  const layer = PANEL_CONFIG.layers.find((item) => item.id === selectedId);
  if (!layer) return null;

  return (
    <section id="layer-detail-dock" aria-live="polite" className="pointer-events-auto absolute bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-30 hidden w-[min(280px,calc(100vw-2rem))] -translate-x-1/2 border border-black/10 bg-[#F3F0E9]/95 px-4 py-3 text-[#1D1C19] shadow-[0_16px_44px_rgba(34,30,24,0.16)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200 md:block min-[1180px]:hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[#8B6F4F]">Слой {layer.index} / {layer.thickness}</p>
          <h3 className="mt-1 text-[16px] font-normal leading-tight tracking-[-0.03em]">{layer.title}</h3>
        </div>
        <button onClick={onClose} aria-label="Закрыть сведения о слое" className="grid h-7 w-7 shrink-0 place-items-center text-[#777168] transition-colors hover:bg-black/5 hover:text-black"><X className="h-3.5 w-3.5" /></button>
      </div>
      <p className="mt-2 line-clamp-1 text-[11px] leading-relaxed text-[#6F695F]">{layer.subtitle}</p>
      <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[#8C857A]">{layer.spec}</p>
    </section>
  );
};
