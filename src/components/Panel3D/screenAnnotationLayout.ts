/**
 * Реестр экранных аннотаций сцены и один общий проход раскладки.
 *
 * Так же, как у SwissCallout, раскладка считается ОДНИМ проходом на своём
 * requestAnimationFrame (~8 раз в секунду), а не в useFrame: раскладка не должна
 * зависеть от того, крутится ли цикл рендера WebGL (в фоновой вкладке он встаёт),
 * и один проход исключает расхождение раскладок между отдельными таблетками.
 */
import { AnnotationPlacement, Rect, resolveAnnotations } from '../../lib/annotationLayout';

export interface AnnotationMeasurement {
  left: number;
  top: number;
  w: number;
  h: number;
}

export interface AnnotationRegistration {
  id: string;
  order: number;
  measure: () => AnnotationMeasurement | null;
  apply: (placement: { dx: number; dy: number; hidden: boolean }) => void;
}

/** Корень сцены: по нему считаются границы для раскладки. */
export const STAGE_ELEMENT_ID = 'scene-stage';

/**
 * Плашки интерфейса, которые аннотации обязаны обходить. Политика «один голос за
 * раз»: интерфейс приоритетнее подписей на канвасе, поэтому уезжает (или прячется)
 * именно аннотация.
 */
export const ANNOTATION_OBSTACLE_IDS = [
  'progressive-texture-hud',
  'gesture-hint-pill',
  'center-mode-capsule',
  'comparison-trigger-pill',
  'mobile-action-bar',
  'cross-section-panel-dock',
  'stage-controls-dock',
  'layer-detail-dock',
];

const LAYOUT_TICK_MS = 120;
const MIN_OBSTACLE_SIDE = 8;

const registry = new Map<string, AnnotationRegistration>();
let schedulerStarted = false;

const toRect = (r: DOMRect): Rect => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });

const measureObstacles = (): Rect[] =>
  ANNOTATION_OBSTACLE_IDS.flatMap((id) => {
    const el = document.getElementById(id);
    if (!el) return [];
    const r = el.getBoundingClientRect();
    if (r.width < MIN_OBSTACLE_SIDE || r.height < MIN_OBSTACLE_SIDE) return [];
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.05) return [];
    return [toRect(r)];
  });

const runLayout = () => {
  if (typeof document === 'undefined' || !registry.size) return;
  const stage = document.getElementById(STAGE_ELEMENT_ID);
  if (!stage) return;
  const bounds = toRect(stage.getBoundingClientRect());
  if (bounds.right - bounds.left < 40 || bounds.bottom - bounds.top < 40) return;

  const obstacles = measureObstacles();
  const measured = [...registry.values()]
    .map((reg) => ({ reg, want: reg.measure() }))
    .filter((item): item is { reg: AnnotationRegistration; want: AnnotationMeasurement } => !!item.want);
  if (!measured.length) return;

  const placements = new Map<string, AnnotationPlacement>(
    resolveAnnotations({
      wants: measured.map(({ reg, want }) => ({ id: reg.id, order: reg.order, ...want })),
      bounds,
      obstacles,
    }).map((p) => [p.id, p])
  );

  for (const { reg, want } of measured) {
    const placement = placements.get(reg.id);
    if (!placement) continue;
    reg.apply({ dx: placement.left - want.left, dy: placement.top - want.top, hidden: placement.hidden });
  }
};

const ensureScheduler = () => {
  if (schedulerStarted || typeof window === 'undefined') return;
  schedulerStarted = true;
  let last = 0;
  const loop = (t: number) => {
    if (!registry.size) {
      schedulerStarted = false; // все аннотации размонтированы — цикл больше не нужен
      return;
    }
    requestAnimationFrame(loop);
    if (t - last < LAYOUT_TICK_MS) return;
    last = t;
    runLayout();
  };
  requestAnimationFrame(loop);
};

/** Регистрирует аннотацию; возвращает функцию отписки. */
export const registerAnnotation = (reg: AnnotationRegistration): (() => void) => {
  registry.set(reg.id, reg);
  ensureScheduler();
  return () => {
    registry.delete(reg.id);
  };
};

/** Только для тестов/отладки: форсировать один проход раскладки. */
export const runAnnotationLayout = runLayout;
