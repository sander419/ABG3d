import { describe, expect, test } from 'bun:test';
import { Rect, overlapArea, rectOf, resolveAnnotations } from '../src/lib/annotationLayout';

/**
 * Реальные замеры (headless-браузер, 18.09.2026) — желаемые боксы температурных
 * таблеток и границы сцены. Тест фиксирует поведение раскладки на тех самых
 * вьюпортах, где сканер приёмки находил наложения.
 */
type Spec = { id: string; order: number; left: number; top: number; w: number; h: number };

const bounds = (left: number, top: number, w: number, h: number): Rect => ({
  left,
  top,
  right: left + w,
  bottom: top + h,
});

const hud1366: Rect[] = [
  { left: 366, top: 176, right: 530, bottom: 206 }, // HUD «512px Hi-Res карты»
  { left: 366, top: 214, right: 553, bottom: 243 }, // подсказка жестов
];

const tags1366: Spec[] = [
  { id: 'outer', order: 1, left: 514, top: 188, w: 126, h: 28 },
  { id: 'pir', order: 2, left: 611, top: 196, w: 160, h: 32 },
  { id: 'inner', order: 3, left: 760, top: 207, w: 178, h: 37 },
];

const tags1024: Spec[] = [
  { id: 'outer', order: 1, left: 377, top: 214, w: 118, h: 26 },
  { id: 'pir', order: 2, left: 449, top: 222, w: 141, h: 28 },
  { id: 'inner', order: 3, left: 551, top: 230, w: 147, h: 31 },
];

const tags390: Spec[] = [
  { id: 'outer', order: 1, left: 72, top: 235, w: 58, h: 26 },
  { id: 'pir', order: 2, left: 166, top: 243, w: 52, h: 28 },
  { id: 'inner', order: 3, left: 273, top: 253, w: 69, h: 31 },
];

const boxesOf = (wants: Spec[], placed: ReturnType<typeof resolveAnnotations>) =>
  placed.map((p) => {
    const want = wants.find((w) => w.id === p.id)!;
    return { left: p.left, top: p.top, right: p.left + want.w, bottom: p.top + want.h };
  });

const overlapPairs = (rects: Rect[]) => {
  const pairs: number[] = [];
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      const area = overlapArea(rects[i], rects[j]);
      if (area > 0) pairs.push(Math.round(area));
    }
  }
  return pairs;
};

describe('resolveAnnotations', () => {
  test('1366×768: таблетки разъезжаются и уступают HUD (было 594+220+278 px² наложения)', () => {
    const stage = bounds(350, 48, 686, 720);
    const placed = resolveAnnotations({ wants: tags1366, bounds: stage, obstacles: hud1366 });
    const rects = boxesOf(tags1366, placed);

    expect(overlapPairs(rects)).toEqual([]);
    expect(rects.flatMap((r) => hud1366.map((o) => overlapArea(r, o))).filter((a) => a > 0)).toEqual([]);
    expect(placed.every((p) => !p.hidden)).toBe(true);
    // ничего не уехало за границы сцены
    expect(rects.every((r) => r.left >= stage.left + 10 - 0.001 && r.right <= stage.right - 10 + 0.001)).toBe(true);
  });

  test('1024×768: три таблетки шире сцены (406 px при 404) — верхняя уезжает на второй ярус', () => {
    const stage = bounds(320, 48, 404, 720);
    const placed = resolveAnnotations({ wants: tags1024, bounds: stage, obstacles: [] });
    const rects = boxesOf(tags1024, placed);

    expect(overlapPairs(rects)).toEqual([]);
    expect(placed.every((p) => !p.hidden)).toBe(true);
    const tops = placed.map((p) => p.top);
    expect(new Set(tops).size).toBeGreaterThan(1); // ярусов больше одного
  });

  test('390×844: раскладка не трогает чистые позиции (нулевые смещения)', () => {
    const stage = bounds(0, 48, 390, 796);
    const placed = resolveAnnotations({ wants: tags390, bounds: stage, obstacles: [] });

    placed.forEach((p) => {
      const want = tags390.find((w) => w.id === p.id)!;
      expect(p.left).toBe(want.left);
      expect(p.top).toBe(want.top);
      expect(p.hidden).toBe(false);
    });
  });

  test('препятствие важнее тега: если места нет — тег скрывается, а не наезжает', () => {
    const stage = bounds(0, 0, 200, 60);
    const obstacle = [{ left: 0, top: 0, right: 200, bottom: 60 }];
    const placed = resolveAnnotations({
      wants: [{ id: 'outer', order: 1, left: 10, top: 10, w: 100, h: 24 }],
      bounds: stage,
      obstacles: obstacle,
    });
    expect(placed[0].hidden).toBe(true);
  });

  test('rectOf/overlapArea считают пересечения корректно', () => {
    expect(overlapArea({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 5, top: 5, right: 20, bottom: 20 })).toBe(25);
    expect(overlapArea({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 10, top: 0, right: 20, bottom: 10 })).toBe(0);
    expect(rectOf({ id: 'x', order: 0, left: 3, top: 4, w: 5, h: 6 })).toEqual({ left: 3, top: 4, right: 8, bottom: 10 });
  });
});
