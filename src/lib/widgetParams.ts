/**
 * Разбор параметров URL виджета.
 *
 * Зачем: параметр `?v=thermal2` до рефакторинга не читался нигде (`URLSearchParams`
 * в `src` не встречался), то есть был мёртвым. Теперь он живой: позволяет
 * де-линкать конкретный режим и открывать модалки прямо из ссылки
 * (нужно для приёмки и для встраивания на сайт ABG).
 *
 * Поддержанные ключи:
 *   ?v=...    | ?mode=...  — режим 3D-сцены
 *   ?open=...              — сразу открыть модалку
 *
 * Неизвестные значения игнорируются (никаких исключений) — виджет остаётся
 * работоспособным при любом мусоре в query-строке.
 */
import { WidgetViewMode } from '../data/panelConfig';

export type OverlayKey = 'calc' | 'consult' | 'compare';

const MODE_ALIASES: Record<string, WidgetViewMode> = {
  assembled: 'assembled',
  assembly: 'assembled',
  sborka: 'assembled',
  exploded: 'exploded',
  layers: 'exploded',
  razobran: 'exploded',
  structure: 'structure',
  rebar: 'structure',
  armatura: 'structure',
  thermal: 'thermal',
  teplo: 'thermal',
  heat: 'thermal',
  thermal2: 'thermal',
};

const OVERLAY_ALIASES: Record<string, OverlayKey> = {
  calc: 'calc',
  calculator: 'calc',
  raschet: 'calc',
  consult: 'consult',
  engineer: 'consult',
  inzhener: 'consult',
  compare: 'compare',
  comparison: 'compare',
  sravnenie: 'compare',
};

export interface WidgetParams {
  /** Режим сцены из URL, либо null — использовать дефолт приложения. */
  mode: WidgetViewMode | null;
  /** Модалка, которую надо открыть сразу, либо null. */
  overlay: OverlayKey | null;
  /** Только распознанные значения; нераспознанные сюда не попадают. */
  raw: Record<string, string>;
}

export function parseWidgetParams(search: string): WidgetParams {
  const qs = new URLSearchParams(search ?? '');
  const raw: Record<string, string> = {};
  for (const [key, value] of qs.entries()) {
    const normalized = value.trim().toLowerCase();
    if (!normalized) continue;
    const known =
      (key === 'v' || key === 'mode') && MODE_ALIASES[normalized] !== undefined
        ? 'mode'
        : key === 'open' && OVERLAY_ALIASES[normalized] !== undefined
          ? 'open'
          : null;
    if (known) raw[known] = normalized;
  }

  const modeToken = (qs.get('mode') ?? qs.get('v') ?? '').trim().toLowerCase();
  const overlayToken = (qs.get('open') ?? '').trim().toLowerCase();

  return {
    mode: MODE_ALIASES[modeToken] ?? null,
    overlay: OVERLAY_ALIASES[overlayToken] ?? null,
    raw,
  };
}

/** Безопасно читает query-строку браузера. В SSR/тестах возвращает пустые параметры. */
export function readWidgetParamsFromLocation(): WidgetParams {
  if (typeof window === 'undefined' || !window.location) {
    return { mode: null, overlay: null, raw: {} };
  }
  return parseWidgetParams(window.location.search);
}
