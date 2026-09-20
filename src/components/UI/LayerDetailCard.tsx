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
    <section id="layer-detail-dock" aria-live="polite" className="absolute bottom-20 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 bg-[#F3F0E9]/97 p-5 text-[#1D1C19] shadow-[0_24px_70px_rgba(34,30,24,0.2)] ring-1 ring-black/10 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200 sm:bottom-24 min-[1180px]:bottom-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[#8B6F4F]">Слой {layer.index} / {layer.thickness}</p>
          <h3 className="mt-1.5 text-[20px] font-normal leading-tight tracking-[-0.035em]">{layer.title}</h3>
        </div>
        <button onClick={onClose} aria-label="Закрыть сведения о слое" className="grid h-9 w-9 shrink-0 place-items-center text-[#777168] transition-colors hover:bg-black/5 hover:text-black"><X className="h-4 w-4" /></button>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-[#6F695F]">{layer.subtitle}</p>
      <div className="mt-4 flex items-start justify-between gap-5 border-t border-black/12 pt-3">
        <span className="text-[9px] uppercase tracking-[0.12em] text-[#928A7E]">Спецификация</span>
        <span className="text-right font-mono text-[10px] text-[#34312C]">{layer.spec}</span>
      </div>
    </section>
  );
};
