/**
 * Единственный источник правды по режимам обзора.
 *
 * До рефакторинга `App.handleModeChange` выставлял `scrubValue` для режимов
 * `structure` и `thermal`, но в `PanelScene` значение уходило только для
 * `exploded` (`scrubProgress={viewMode === 'exploded' ? scrubValue : undefined}`),
 * а `PanelModel` для `structure`/`thermal` брал собственные константы. Итог:
 * ползунок «РАЗБОРКА» в режиме «АРМАТУРА» был мёртвым — цифры процентов
 * менялись, сцена не реагировала.
 *
 * Теперь связь «режим → разборка» описана здесь одной таблицей, а UI берёт
 * её же (и тесты проверяют, что режимы с ползунком действительно получают
 * значение разборки).
 */
import { WidgetViewMode } from '../data/panelConfig';

/** Стартовая/целевая разборка (k) для каждого режима. */
export const MODE_DEFAULTS: Record<WidgetViewMode, number> = {
  assembled: 0,
  exploded: 1,
  structure: 0.55,
  // Значение для «ТЕПЛО» держим синхронным с PanelModel (там тоже 0.45):
  // ползунок в этом режиме пока не показывается, но константа должна совпадать.
  thermal: 0.45,
};

/** В каких режимах пользователю доступен ползунок «РАЗБОРКА». */
export const MODE_SCRUBBABLE: Record<WidgetViewMode, boolean> = {
  assembled: false,
  exploded: true,
  structure: true,
  thermal: false,
};

// Single source of truth for the on-screen mode text. CenterModeCapsule and
// RightMetricsRail both render this — they used to each hardcode their own copy,
// which had already drifted (an all-caps 'СБОРКА'/'РАЗОБРАН' style nobody saw next
// to the live 'Собрана'/'Слои' the capsule actually shows).
export const MODE_LABELS: Record<WidgetViewMode, string> = {
  assembled: 'Собрана',
  exploded: 'Слои',
  structure: 'Арматура',
  thermal: 'Тепловая схема',
};

export interface ModeChangePatch {
  scrubValue: number;
  clearSelection: boolean;
}

/** Что должно произойти в состоянии приложения при переключении режима. */
export function modeChangePatch(mode: WidgetViewMode): ModeChangePatch {
  return {
    scrubValue: MODE_DEFAULTS[mode],
    // «Арматура» — самостоятельный инженерный обзор. Carry-over карточки слоя
    // перекрывали сетки и связи в центре сцены, поэтому режим стартует чистым.
    clearSelection: mode === 'assembled' || mode === 'thermal' || mode === 'structure',
  };
}

/**
 * Значение пропа `scrubProgress` для сцены: undefined для режимов, где
 * разборкой управляет сам режим (сборка/тепло), число — для разборных.
 */
export function scrubPropFor(mode: WidgetViewMode, scrubValue: number): number | undefined {
  if (!MODE_SCRUBBABLE[mode]) return undefined;
  return Number.isFinite(scrubValue) ? Math.min(1, Math.max(0, scrubValue)) : MODE_DEFAULTS[mode];
}
