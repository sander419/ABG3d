/**
 * Раскладка экранных аннотаций сцены (температурные теги режима «ТЕПЛО»).
 *
 * Проблема: таблетки тегов позиционировались только проекцией 3D-точки. Расстояние
 * между анкерами (≈±1.25 м в модели) в пикселях зависит от дистанции камеры, а ширина
 * таблетки — от длины подписи; на 1024/1280/1366/1600 они начинают пересекаться
 * («-20 °C» заезжает на «0 °C: Внутри PIR»), а на 1366 таблетка «Снаружи» ещё и
 * накрывает плашку HUD «512px Hi-Res карты». Сканер приёмки этого не видел, потому что
 * сравнивал только пары «текстовый узел × текстовый узел».
 *
 * Решение: единый проход раскладки (как у SwissCallout) — таблетки считаются в
 * экранных пикселях, разводятся по горизонтали внутри сцены, уступают препятствиям
 * (HUD, доки контролов, режимная капсула) и переезжают на следующий ярус, если в
 * одном месте не помещаются. Функция чистая: вход — желаемые боксы, выход — смещения.
 *
 * Политика «один голос за раз»: препятствия (панель среза, HUD) приоритетнее тегов —
 * именно тег уезжает или (в крайнем случае) скрывается, а не плашка интерфейса.
 */

export type Rect = { left: number; top: number; right: number; bottom: number };

export interface AnnotationWant {
  id: string;
  /** Порядок разрешения конфликтов: меньше — приоритетнее (обычно слева направо). */
  order: number;
  /** Желаемый бокс (проекция 3D-анкера, экранные px). */
  left: number;
  top: number;
  w: number;
  h: number;
}

export interface AnnotationPlacement {
  id: string;
  left: number;
  top: number;
  hidden: boolean;
}

export interface AnnotationLayoutInput {
  wants: AnnotationWant[];
  /** Границы сцены (канваса) в экранных px. */
  bounds: Rect;
  /** Видимые плашки интерфейса, которые теги обязаны обходить. */
  obstacles: Rect[];
  /** Отступ от краёв сцены, px. */
  pad?: number;
  /** Минимальный зазор между таблетками, px. */
  gap?: number;
  /** Порог «это уже наложение», px². Меньше — строже. */
  minArea?: number;
  /** Сколько ярусов допускаем под таблеткой, прежде чем спрятать её. */
  maxRows?: number;
}

export const rectOf = (w: AnnotationWant): Rect => ({
  left: w.left,
  top: w.top,
  right: w.left + w.w,
  bottom: w.top + w.h,
});

export const overlapArea = (a: Rect, b: Rect): number => {
  const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return ox > 0 && oy > 0 ? ox * oy : 0;
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/**
 * Раскладка одного ряда/яруса. Возвращает null, если таблетка не помещается ни в
 * одной позиции этого яруса.
 */
const placeInRow = (
  want: AnnotationWant,
  top: number,
  occupied: Rect[],
  bounds: Rect,
  pad: number,
  gap: number,
  minArea: number
): { left: number; top: number } | null => {
  const minLeft = bounds.left + pad;
  const maxLeft = Math.max(minLeft, bounds.right - pad - want.w);
  const blocked = (left: number) =>
    occupied.find((o) => overlapArea({ left, top, right: left + want.w, bottom: top + want.h }, o) > minArea);

  let left = clamp(want.left, minLeft, maxLeft);
  const tried = new Set<number>([left]);

  for (let guard = 0; guard < 8; guard += 1) {
    const hit = blocked(left);
    if (!hit) return { left, top };

    // Обходим препятствие: сначала вправо (порядок чтения), затем влево.
    const rightCand = clamp(hit.right + gap, minLeft, maxLeft);
    const leftCand = clamp(hit.left - gap - want.w, minLeft, maxLeft);
    const next = rightCand > left && !tried.has(rightCand) ? rightCand : !tried.has(leftCand) ? leftCand : null;
    if (next === null) return null;
    tried.add(next);
    left = next;
  }
  return null;
};

/**
 * Единый проход: каждая таблетка получает позицию без пересечений с соседями и
 * препятствиями. Ярусы идут вниз от желаемой позиции; влезть не удалось — hidden.
 */
export const resolveAnnotations = (input: AnnotationLayoutInput): AnnotationPlacement[] => {
  const { wants, bounds, obstacles, pad = 10, gap = 8, minArea = 2, maxRows = 3 } = input;
  const ordered = [...wants].sort((a, b) => a.order - b.order || a.left - b.left);
  if (!ordered.length) return [];

  const pitch = Math.max(...ordered.map((w) => w.h)) + gap;
  const placed: Rect[] = [];
  const results: AnnotationPlacement[] = [];

  for (const want of ordered) {
    let found: { left: number; top: number } | null = null;
    for (let row = 0; row < maxRows && !found; row += 1) {
      const top = want.top + row * pitch;
      if (top + want.h > bounds.bottom - pad) break;
      found = placeInRow(want, top, [...placed, ...obstacles], bounds, pad, gap, minArea);
    }

    if (found) {
      placed.push({ left: found.left, top: found.top, right: found.left + want.w, bottom: found.top + want.h });
      results.push({ id: want.id, left: found.left, top: found.top, hidden: false });
    } else {
      results.push({ id: want.id, left: want.left, top: want.top, hidden: true });
    }
  }

  return results;
};
