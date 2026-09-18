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
  thermal: 0.15,
};

/** В каких режимах пользователю доступен ползунок «РАЗБОРКА». */
export const MODE_SCRUBBABLE: Record<WidgetViewMode, boolean> = {
  assembled: false,
  exploded: true,
  structure: true,
  thermal: false,
};

export const MODE_LABELS: Record<WidgetViewMode, string> = {
  assembled: 'СБОРКА',
  exploded: 'РАЗОБРАН',
  structure: 'АРМАТУРА',
  thermal: 'ТЕПЛО',
};

export interface ModeChangePatch {
  scrubValue: number;
  clearSelection: boolean;
}

/** Что должно произойти в состоянии приложения при переключении режима. */
export function modeChangePatch(mode: WidgetViewMode): ModeChangePatch {
  return {
    scrubValue: MODE_DEFAULTS[mode],
    clearSelection: mode === 'assembled' || mode === 'thermal',
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
