import React, { useState, useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { LayerState } from '../../data/panelConfig';

interface SwissCalloutProps {
  position: [number, number, number];
  layer: LayerState;
  direction?: 'left' | 'right';
  isActive: boolean;
  onSelect: () => void;
}

// Геометрия выноски: [0, 0] — центр 6px хотспота.
const LEAD_DX = 38; // диагональный вынос
const LEAD_DY = -28; // подъём плашки над хотспотом
const LEAD_GAP = 8; // горизонтальный отрезок перед плашкой
const EDGE_PAD = 10; // минимальный зазор до края центральной сцены, px
const LAYOUT_TICK_MS = 120; // ~8 пересчётов раскладки в секунду
// Панель инструмента «Сечение» занимает почти всю сцену на узких экранах —
// там плашки прячутся (у панели свои подписи слоёв), а хотспоты остаются.
const DOCK_STAGE_MIN_WIDTH = 1280;

type Rect = { left: number; top: number; right: number; bottom: number };
type Side = 'left' | 'right';

type CalloutWant = {
  id: string;
  order: number;
  prefer: Side;
  wantTop: number;
  w: number;
  h: number;
  leftRight: number; // левый край плашки, если она справа от хотспота
  leftLeft: number; // левый край плашки, если она слева
  fitsRight: boolean;
  fitsLeft: boolean;
  scale: number;
  stage: Rect;
};

type CalloutPlacement = {
  side: Side;
  left: number;
  top: number;
  hidden: boolean;
};

const wants = new Map<string, CalloutWant>();
const applyFns = new Map<string, (p: CalloutPlacement) => void>();
let schedulerStarted = false;
let seq = 0;

const overlapArea = (a: Rect, b: Rect) => {
  const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return ox > 0 && oy > 0 ? ox * oy : 0;
};

const measureObstacles = (): Rect | null => {
  const parts: Rect[] = [];
  for (const id of ['cross-section-panel-dock', 'stage-controls-dock']) {
    const el = document.getElementById(id);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 20 && r.height > 20) {
      parts.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    }
  }
  if (!parts.length) return null;
  return {
    left: Math.min(...parts.map((p) => p.left)),
    top: Math.min(...parts.map((p) => p.top)),
    right: Math.max(...parts.map((p) => p.right)),
    bottom: Math.max(...parts.map((p) => p.bottom)),
  };
};

const sectionDockRect = (): Rect | null => {
  const el = document.getElementById('cross-section-panel-dock');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 20 && r.height > 20
    ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
    : null;
};

/**
 * Единый проход раскладки. Считается один раз для всех плашек и применяется ко
 * всем сразу: если бы каждый колаут считал раскладку сам, его входные данные
 * («желаемые» боксы соседей) приходили бы из разных кадров и раскладки
 * расходились бы.
 */
const resolveLayout = () => {
  const items = [...wants.values()].sort((a, b) => a.order - b.order);
  if (!items.length) return;
  const stage = items[0].stage;
  const dock = measureObstacles();
  const hidden = !!sectionDockRect() && stage.right - stage.left < DOCK_STAGE_MIN_WIDTH;
  const obstacles: Rect[] = dock ? [dock] : [];
  const placed: Rect[] = [];
  const results: [string, CalloutPlacement][] = [];

  for (const item of items) {
    const preferRight =
      item.prefer === 'right'
        ? item.fitsRight || !item.fitsLeft
        : !item.fitsLeft && item.fitsRight;
    const side: Side = preferRight ? 'right' : 'left';

    const minLeft = stage.left + EDGE_PAD;
    const maxLeft = Math.max(minLeft, stage.right - EDGE_PAD - item.w);
    const minTop = stage.top + EDGE_PAD;
    const maxTop = Math.max(minTop, stage.bottom - EDGE_PAD - item.h);
    const left = Math.min(Math.max(side === 'right' ? item.leftRight : item.leftLeft, minLeft), maxLeft);
    let top = Math.min(Math.max(item.wantTop, minTop), maxTop);

    // Разведение: уступаем по вертикали панели среза и уже поставленным плашкам
    for (let guard = 0; guard < 6; guard += 1) {
      const mine: Rect = { left, top, right: left + item.w, bottom: top + item.h };
      const hit = [...obstacles, ...placed].find((o) => overlapArea(mine, o) > 60);
      if (!hit) break;
      let next = hit.bottom + 8; // сначала вниз
      if (next + item.h > stage.bottom - EDGE_PAD) {
        next = hit.top - 8 - item.h; // не влезло — уходим наверх
      }
      next = Math.min(Math.max(next, minTop), maxTop);
      if (Math.abs(next - top) < 1) break;
      top = next;
    }

    placed.push({ left, top, right: left + item.w, bottom: top + item.h });
    results.push([item.id, { side, left, top, hidden }]);
  }

  for (const [id, placement] of results) {
    applyFns.get(id)?.(placement);
  }
};

const ensureScheduler = () => {
  if (schedulerStarted || typeof window === 'undefined') return;
  schedulerStarted = true;
  let last = 0;
  const loop = (t: number) => {
    requestAnimationFrame(loop);
    if (t - last < LAYOUT_TICK_MS) return;
    last = t;
    resolveLayout();
  };
  requestAnimationFrame(loop);
};

export const SwissCallout: React.FC<SwissCalloutProps> = ({
  position,
  layer,
  direction = 'right',
  isActive,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  const [side, setSide] = useState<Side>(direction);
  const wrapRef = useRef<HTMLDivElement>(null);
  const placardRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const wantRef = useRef<CalloutWant | null>(null);
  const sideRef = useRef<Side>(direction);
  const idRef = useRef('');
  const orderRef = useRef(0);
  if (!idRef.current) {
    seq += 1;
    idRef.current = `callout-${seq}`;
    orderRef.current = seq;
  }
  sideRef.current = side;

  const isRight = side === 'right';

  // Vector line geometry (origin [0, 0] at 6px hotspot center)
  // Diagonal segment at ~45deg followed by a short horizontal lead-in to placard
  const dx = isRight ? LEAD_DX : -LEAD_DX;
  const dy = LEAD_DY;
  const leadX = isRight ? dx + LEAD_GAP : dx - LEAD_GAP;

  const isHighlighted = hovered || isActive;

  useEffect(() => {
    ensureScheduler();

    const measure = () => {
      const wrap = wrapRef.current;
      const placard = placardRef.current;
      const htmlRoot = wrap?.parentElement as HTMLElement | null;
      if (!wrap || !placard || !htmlRoot) return;

      const stageEl =
        (wrap.closest('main') as HTMLElement | null) ||
        (document.querySelector('main') as HTMLElement | null);
      if (!stageEl) return;
      const stageRect = stageEl.getBoundingClientRect();
      if (stageRect.width < 40 || stageRect.height < 40) return;
      const stage: Rect = {
        left: stageRect.left,
        top: stageRect.top,
        right: stageRect.right,
        bottom: stageRect.bottom,
      };

      // Html-обёртка может быть отмасштабирована — переводим пиксели в CSS-единицы
      const scale = htmlRoot.offsetWidth > 0
        ? htmlRoot.getBoundingClientRect().width / htmlRoot.offsetWidth
        : 1;
      const s = Math.abs(scale) > 0.01 ? scale : 1;

      const spot = wrap.getBoundingClientRect(); // левый верхний угол = проекция хотспота
      const box = placard.getBoundingClientRect();
      const rightLeadX = LEAD_DX + LEAD_GAP;

      wants.set(idRef.current, {
        id: idRef.current,
        order: orderRef.current,
        prefer: direction,
        wantTop: spot.top + (dy - 18) * s,
        w: box.width,
        h: box.height,
        leftRight: spot.left + (rightLeadX + 4) * s,
        leftLeft: spot.left + (-rightLeadX - 4) * s - box.width,
        fitsRight: spot.left + (rightLeadX + 4) * s + box.width <= stage.right - EDGE_PAD,
        fitsLeft: spot.left + (-rightLeadX - 4) * s - box.width >= stage.left + EDGE_PAD,
        scale: s,
        stage,
      });
    };

    const apply = (placement: CalloutPlacement) => {
      const wrap = wrapRef.current;
      const placard = placardRef.current;
      const want = wantRef.current;
      if (!wrap || !placard || !want) return;

      // Флип на другую сторону от хотспота — это ре-рендер геометрии линии
      if (placement.side !== sideRef.current) {
        setSide(placement.side);
        return;
      }

      const s = want.scale;
      const anchorLeft = placement.side === 'right' ? want.leftRight : want.leftLeft;
      const tx = (placement.left - anchorLeft) / s;
      const ty = (placement.top - want.wantTop) / s;
      const transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
      const hidden = placement.hidden;

      if (placard.style.visibility !== (hidden ? 'hidden' : '')) {
        placard.style.visibility = hidden ? 'hidden' : '';
      }
      if (lineRef.current) {
        lineRef.current.style.visibility = hidden ? 'hidden' : '';
      }
      if (placard.style.transform === transform) return;
      placard.style.transform = transform;

      const lead = placement.side === 'right' ? LEAD_DX + LEAD_GAP : -LEAD_DX - LEAD_GAP;
      const endX = (placement.side === 'right' ? lead + 4 : lead - 4) + tx;
      const endY = dy + ty;
      const sign = placement.side === 'right' ? 1 : -1;
      pathRef.current?.setAttribute(
        'd',
        `M 0 0 L ${LEAD_DX * sign} ${dy} L ${endX.toFixed(1)} ${endY.toFixed(1)}`
      );
      dotRef.current?.setAttribute('cx', endX.toFixed(1));
      dotRef.current?.setAttribute('cy', endY.toFixed(1));
    };

    const want = wants.get(idRef.current);
    wantRef.current = want ?? null;
    applyFns.set(idRef.current, apply);

    let last = 0;
    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < LAYOUT_TICK_MS) return;
      last = t;
      measure();
      wantRef.current = wants.get(idRef.current) ?? null;
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      wants.delete(idRef.current);
      applyFns.delete(idRef.current);
    };
  }, [direction, dy]);

  return (
    <Html
      position={position}
      center={false}
      zIndexRange={[60, 0]}
      className="pointer-events-none select-none"
    >
      <div
        ref={wrapRef}
        className="relative group pointer-events-auto cursor-pointer touch-manipulation"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        title={`Нажмите, чтобы изучить: ${layer.title}`}
      >
        {/* Invisible 44px touch target for easy finger tapping on mobile */}
        <div className="absolute -top-[19px] -left-[19px] w-[44px] h-[44px] cursor-pointer" />

        {/* 1. PULSE-ANIMATED HOTSPOT (6px) AT KEY ANCHOR POINT */}
        <div className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px]">
          {/* Continuous architectural radar pulse ring */}
          <span
            className={`absolute inset-0 rounded-full border pointer-events-none transition-colors duration-300 ${
              isHighlighted
                ? 'border-[#18181B] hotspot-pulse-ring-active'
                : 'border-[#71717A] hotspot-pulse-ring'
            }`}
          />

          {/* Core 6px circular anchor with 1px border and center micro-dot */}
          <div
            className={`relative w-[6px] h-[6px] rounded-full border bg-[#F7F7F8] transition-all duration-300 flex items-center justify-center ${
              isHighlighted
                ? 'scale-125 border-[#18181B] shadow-[0_0_8px_rgba(0,0,0,0.15)]'
                : 'scale-100 border-[#71717A]'
            }`}
          >
            <span
              className={`w-[2px] h-[2px] rounded-full transition-colors duration-200 ${
                isHighlighted ? 'bg-[#18181B]' : 'bg-[#71717A]'
              }`}
            />
          </div>
        </div>

        {/* 2. VECTOR LEADER LINE (Minimal 1px Stroke SVG) */}
        <svg
          ref={lineRef}
          className="absolute top-0 left-0 overflow-visible pointer-events-none"
          width="1"
          height="1"
          style={{ shapeRendering: 'geometricPrecision' }}
        >
          {/* Main angled leader line */}
          <path
            ref={pathRef}
            d={`M 0 0 L ${dx} ${dy} L ${leadX} ${dy}`}
            fill="none"
            stroke={isHighlighted ? '#18181B' : '#71717A'}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors duration-300"
          />

          {/* Terminal junction micro-tick onto the placard border */}
          <circle
            ref={dotRef}
            cx={leadX}
            cy={dy}
            r="1.25"
            fill={isHighlighted ? '#18181B' : '#71717A'}
            className="transition-colors duration-300"
          />
        </svg>

        {/* 3. MINIMAL 1PX-STROKE TEXT PLACARD (Swiss Architectural Typography) */}
        <div
          ref={placardRef}
          className={`absolute pointer-events-auto transition-colors duration-300 max-w-[min(62vw,220px)] sm:max-w-[280px] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-[2px] border backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.04)] ${
            isHighlighted
              ? 'border-[#18181B] bg-white/95 translate-y-[-1px]'
              : 'border-black/10 hover:border-black/25 bg-[#F7F7F8]/90'
          }`}
          style={{
            left: isRight ? `${leadX + 4}px` : 'auto',
            right: !isRight ? `${-leadX + 4}px` : 'auto',
            top: `${dy - 18}px`,
          }}
        >
          {/* Top Line: Index & Dimension */}
          <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.18em] leading-none mb-1">
            <span className={isHighlighted ? 'text-[#18181B] font-semibold' : 'text-[#71717A]'}>
              {layer.index} // {layer.id.toUpperCase()}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#D4D4D8]" />
            <span className="font-semibold text-[#18181B] tracking-normal">
              {layer.thickness}
            </span>
          </div>

          {/* Middle Line: Clean Architectural Title */}
          <div className="text-[10px] sm:text-[11px] font-sans font-medium text-[#18181B] tracking-tight leading-tight whitespace-normal">
            {layer.title}
          </div>

          {/* Bottom Line: Engineering Specification */}
          <div className="font-mono text-[8px] sm:text-[9px] text-[#71717A] tracking-wider mt-1 leading-tight whitespace-normal">
            {layer.spec}
          </div>
        </div>
      </div>
    </Html>
  );
};
