/**
 * ABG3d layout scanner (evaluate the file's contents inside the page via CDP).
 *
 * Запуск (headless Edge/Chrome, реальный WebGL):
 *   1. собрать и поднять виджет:  bun run build && python -m http.server 8099 --directory dist
 *   2. открыть страницу на нужном вьюпорте:  http://127.0.0.1:8099/?v=thermal
 *      (?v= — режим: exploded|assembled|structure|thermal)
 *   3. включить эмуляцию вьюпорта и кадры (иначе requestAnimationFrame заморожен и
 *      раскладка аннотаций не применяется):
 *        Emulation.setDeviceMetricsOverride {width, height, deviceScaleFactor: 1, mobile: false}
 *        Emulation.setFocusEmulationEnabled {enabled: true}
 *   4. подождать ~3.5 с и выполнить Runtime.evaluate с содержимым этого файла;
 *      результат — JSON с totals/overlaps/clipped/outside.
 *
 * Приёмка: 390, 768, 1024, 1366, 1600 × РАЗОБРАН / СБОРКА / АРМАТУРА / ТЕПЛО —
 * totals.overlaps === 0, totals.clipped === 0, totals.outside === 0,
 * в ТЕПЛО totals.visiblePills === 3 (ни одна подпись не потеряна).
 *
 * Что проверяет:
 *  1. «подпись × любой видимый бокс»: температурные теги (таблетки целиком) против
 *     ВСЕХ видимых боксов страницы, пересекающих сцену — плашки-подсказки, HUD
 *     материалов, режимная капсула, доки контролов, нижние плашки. Прежний сканер
 *     сравнивал только пары «текстовый узел × текстовый узел», поэтому наезд
 *     «Снаружи: −20 °C» на плашку «512px Hi-Res карты» (фон полупрозрачный, текст
 *     не пересекается) не находился.
 *  2. Видимость тегов: hidden-таблетка = потеря текста, тоже дефект.
 *  3. Обрезка текста и выход узлов за пределы сцены.
 *
 * elementFromPoint для проверки перекрытия не годится: аннотации канваса отрисованы
 * с pointer-events:none, и хит-тест возвращает контейнер под ними, а не реального
 * перекрывающего соседа. Поэтому перекрытие считается геометрически.
 */
(() => {
  const MIN_AREA = 20;
  const R = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height };
  };
  const round = (r) => ({
    left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom),
    w: Math.round(r.w), h: Math.round(r.h),
  });
  const styleOf = (el) => getComputedStyle(el);
  const isVisible = (el) => {
    const s = styleOf(el);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const alphaOf = (bg) => {
    const m = (bg || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return 0;
    const p = m[1].split(',').map((v) => parseFloat(v));
    return p.length > 3 ? p[3] : 1;
  };
  const boxInfo = (el) => {
    const s = styleOf(el);
    const bg = alphaOf(s.backgroundColor);
    const border = parseFloat(s.borderTopWidth) + parseFloat(s.borderBottomWidth);
    const blur = s.backdropFilter && s.backdropFilter !== 'none';
    const shadow = s.boxShadow && s.boxShadow !== 'none';
    return { bg, isBox: bg > 0.05 || border > 0 || blur || shadow, opaque: bg > 0.6 };
  };
  const label = (el) => ({
    tag: el.tagName,
    id: el.id || '',
    cls: (typeof el.className === 'string' ? el.className : '').slice(0, 60),
    text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 44),
  });
  const overlapArea = (a, b) => {
    const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return ox > 1 && oy > 1 ? Math.round(ox * oy) : 0;
  };
  const isAncestorOf = (a, b) => !!(a && b) && (a === b || a.contains(b));
  const intersects = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

  const stage = document.getElementById('scene-stage');
  if (!stage) return { error: 'scene-stage not found' };
  const stageRect = R(stage);
  const canvas = stage.querySelector('canvas');

  // --- таблетки подписей (в т.ч. скрытые — их тоже надо видеть) --------------
  const pillEls = [];
  document.querySelectorAll('*').forEach((el) => {
    const txt = (el.textContent || '').trim();
    if (!/°C/.test(txt)) return;
    if (el.closest('.pointer-events-none') === null && stage !== el && !stage.contains(el)) return;
    if (!boxInfo(el).isBox) return;
    const hasInner = [...el.querySelectorAll('*')].some((k) => /°C/.test(k.textContent || '') && boxInfo(k).isBox);
    if (hasInner) return;
    pillEls.push(el);
  });
  const pills = pillEls.map((el) => {
    const s = styleOf(el);
    const r = el.getBoundingClientRect();
    const hidden = s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05;
    const visible = !hidden && r.width > 2 && r.height > 2;
    return { el, ...label(el), rect: r, visible, hidden, visibility: s.visibility, display: s.display };
  });

  // --- все видимые боксы страницы, пересекающие сцену ----------------------
  const boxes = [];
  document.querySelectorAll('*').forEach((el) => {
    if (!isVisible(el)) return;
    if (!boxInfo(el).isBox) return;
    if (isAncestorOf(el, stage) || el === canvas || (canvas && isAncestorOf(canvas, el))) return;
    if (pills.some((p) => isAncestorOf(el, p.el) || isAncestorOf(p.el, el))) return;
    const rect = R(el);
    if (rect.w >= window.innerWidth * 0.98 && rect.h >= window.innerHeight * 0.98) return;
    if (!intersects(rect, stageRect)) return;
    boxes.push({ el, ...label(el), rect, opaque: boxInfo(el).opaque });
  });

  const overlaps = [];
  pills.forEach((p) => {
    if (!p.visible) return;
    boxes.forEach((b) => {
      const area = overlapArea(p.rect, b.rect);
      if (area >= MIN_AREA) {
        overlaps.push({
          area, opaque: b.opaque,
          a: p.text, aRect: round(p.rect),
          b: b.text || b.cls, bId: b.id, bRect: round(b.rect),
        });
      }
    });
  });

  const clipped = [];
  const outside = [];
  stage.querySelectorAll('*').forEach((el) => {
    if (!isVisible(el)) return;
    const s = styleOf(el);
    if (s.overflow === 'hidden' && el.clientWidth > 8 && el.scrollWidth > el.clientWidth + 1) {
      clipped.push({ ...label(el), scrollW: el.scrollWidth, clientW: el.clientWidth });
    }
    const r = R(el);
    if (r.w < 4 || r.h < 4) return;
    const insideStage = r.left >= stageRect.left - 1 && r.right <= stageRect.right + 1;
    if (insideStage && (r.top < stageRect.top - 1 || r.bottom > stageRect.bottom + 1)) {
      outside.push({ ...label(el), rect: round(r) });
    }
  });

  return {
    vp: [window.innerWidth, window.innerHeight],
    mode: (new URLSearchParams(location.search).get('v') || ''),
    stage: round(stageRect),
    pills: pills.map((p) => ({ text: p.text, rect: round(p.rect), visible: p.visible, hidden: p.hidden })),
    overlays: boxes.filter((b) => b.text || b.id).map((b) => ({ text: b.text, id: b.id, rect: round(b.rect) })),
    boxCount: boxes.length,
    overlaps,
    clipped,
    outside,
    totals: {
      pills: pills.length,
      visiblePills: pills.filter((p) => p.visible).length,
      hiddenPills: pills.filter((p) => p.hidden).length,
      overlaps: overlaps.length,
      overlapArea: overlaps.reduce((s, o) => s + o.area, 0),
      clipped: clipped.length,
      outside: outside.length,
    },
  };
})()
