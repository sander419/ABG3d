import React, { useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import { registerAnnotation } from './screenAnnotationLayout';

interface ThermalTagProps {
  /** Стабильный id: по нему раскладка узнаёт таблетку между проходами. */
  id: string;
  /** Порядок разрешения конфликтов (слева направо). */
  order: number;
  position: [number, number, number];
  children: React.ReactNode;
}

/**
 * Таблетка температурного тега режима «ТЕПЛО».
 *
 * Позиция анкера остаётся 3D-проекцией (камера дышит, разборка едет — тег едет за
 * слоем), но экранное смещение таблетки считает общий проход раскладки: он разводит
 * теги между собой и уводит их от плашек интерфейса. Смещение применяется на
 * внутренний div, поэтому измеряемая обёртка остаётся «желаемой» позицией и
 * обратной связи «смещение → новое измерение» не возникает.
 */
export const ThermalTag: React.FC<ThermalTagProps> = ({ id, order, position, children }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      registerAnnotation({
        id,
        order,
        measure: () => {
          const wrap = wrapRef.current;
          if (!wrap) return null;
          const r = wrap.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) return null;
          return { left: r.left, top: r.top, w: r.width, h: r.height };
        },
        apply: ({ dx, dy, hidden }) => {
          const wrap = wrapRef.current;
          const pill = pillRef.current;
          if (!wrap || !pill) return;
          // drei масштабирует Html-обёртку (distanceFactor): переводим экранные
          // пиксели раскладки в CSS-единицы потомка.
          const root = wrap.parentElement as HTMLElement | null;
          const raw = root && root.offsetWidth > 0 ? root.getBoundingClientRect().width / root.offsetWidth : 1;
          const scale = Math.abs(raw) > 0.01 ? raw : 1;

          const visibility = hidden ? 'hidden' : '';
          if (pill.style.visibility !== visibility) pill.style.visibility = visibility;

          const transform =
            Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5
              ? ''
              : `translate(${(dx / scale).toFixed(1)}px, ${(dy / scale).toFixed(1)}px)`;
          if (pill.style.transform !== transform) pill.style.transform = transform;
        },
      }),
    [id, order]
  );

  return (
    <group position={position}>
      <Html center distanceFactor={4.8} zIndexRange={[15, 0]} className="pointer-events-none select-none">
        <div ref={wrapRef} data-annotation-tag={id}>
          <div
            ref={pillRef}
            data-annotation-pill={id}
            className="flex items-center gap-1.5 sm:gap-2 font-mono text-[11px] sm:text-xs text-[#18181B] bg-white/95 backdrop-blur-md px-2 sm:px-3 py-1.5 rounded-full border border-black/10 shadow-[0_4px_16px_rgba(0,0,0,0.06)] whitespace-nowrap transition-transform duration-150 ease-out will-change-transform"
          >
            {children}
          </div>
        </div>
      </Html>
    </group>
  );
};
