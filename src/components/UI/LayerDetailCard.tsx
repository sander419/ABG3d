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
    <div id="layer-detail-dock" className="absolute bottom-[7.5rem] lg:bottom-24 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-black/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.06)] animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#71717A]">
              СЛОЙ {layer.index} // {layer.thickness}
            </span>
          </div>
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#18181B] mt-0.5">
            {layer.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-[#71717A] hover:text-[#18181B] hover:bg-black/5 transition-colors cursor-pointer"
          title="Закрыть"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[11px] text-[#52525B] leading-relaxed mb-2">
        {layer.subtitle}
      </p>

      <div className="border-t border-black/[0.04] pt-2 flex items-center justify-between">
        <span className="text-[9px] font-mono uppercase tracking-wider text-[#A1A1AA]">
          Спецификация:
        </span>
        <span className="text-[10px] font-mono text-[#18181B]">
          {layer.spec}
        </span>
      </div>
    </div>
  );
};
