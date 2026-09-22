/**
 * Мост «виджет → страница-хост»: события виджета уходят родительскому окну
 * через `postMessage`.
 *
 * Зачем: виджет встраивается на сайт ABG в `<iframe>`, а страница-хост не может
 * заглянуть внутрь iframe (same-origin policy). `postMessage` — единственный
 * штатный канал: по нему из iframe видно, что пользователь открыл режим или
 * модалку и чем закончилась отправка заявки (это то, что нужно аналитике сайта).
 *
 * Контракт события:
 *   { source: 'abg3d-widget', version: 1, type: 'abg3d:mode', payload: {...} }
 *
 * Типы событий:
 *   - `abg3d:mode`    payload `{ mode }` — режим 3D-сцены
 *     (`exploded` | `assembled` | `structure` | `thermal`); приходит и при загрузке,
 *     поэтому отдельного «ready» не требуется;
 *   - `abg3d:overlay` payload `{ overlay, open }` — состояние модалок
 *     (`calc` | `consult` | `compare` | `assembly` | null);
 *   - `abg3d:lead`    payload `{ kind, status, reason?, httpStatus? }` — итог отправки
 *     заявки. **Персональные данные в событие не попадают**: ни контакта, ни текста
 *     сообщения в payload нет.
 *
 * Целевой origin — `'*'`: в событиях нет ПДн, а домен сайта ABG на момент встраивания
 * может быть неизвестен. Приёмник обязан сам проверять `event.data.source`.
 */
export const WIDGET_EVENT_SOURCE = 'abg3d-widget';
export const WIDGET_EVENT_VERSION = 1;

export type WidgetEventType = 'abg3d:mode' | 'abg3d:overlay' | 'abg3d:lead';

export interface WidgetEvent {
  source: typeof WIDGET_EVENT_SOURCE;
  version: number;
  type: WidgetEventType;
  payload: Record<string, unknown>;
}

export function buildWidgetEvent(
  type: WidgetEventType,
  payload: Record<string, unknown> = {},
): WidgetEvent {
  return {
    source: WIDGET_EVENT_SOURCE,
    version: WIDGET_EVENT_VERSION,
    type,
    payload,
  };
}

interface PostMessageTarget {
  postMessage: (message: unknown, targetOrigin: string) => void;
}

/**
 * Куда отправлять событие: родительскому окну, если виджет в iframe,
 * иначе — самому себе (скриптовое встраивание и тесты слушают свой `window`).
 */
export function resolveEventTarget(host: unknown): PostMessageTarget | null {
  if (!host || typeof host !== 'object') return null;

  const self = host as { parent?: unknown; postMessage?: unknown };
  const target = self.parent && typeof self.parent === 'object' && self.parent !== host ? self.parent : host;
  const postMessage = (target as { postMessage?: unknown }).postMessage;
  if (typeof postMessage !== 'function') return null;

  return { postMessage: (postMessage as PostMessageTarget['postMessage']).bind(target) };
}

/**
 * Отправляет событие виджета. Никогда не бросает: если окна/`postMessage` нет
 * (SSR, тесты, экзотический встроенный webview) — просто возвращает null.
 */
export function emitWidgetEvent(
  type: WidgetEventType,
  payload: Record<string, unknown> = {},
  host: unknown = typeof window !== 'undefined' ? window : undefined,
): WidgetEvent | null {
  const event = buildWidgetEvent(type, payload);
  const target = resolveEventTarget(host);
  if (!target) return null;

  try {
    target.postMessage(event, '*');
  } catch {
    return null;
  }
  return event;
}
