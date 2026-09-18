/**
 * Отправка заявок из виджета.
 *
 * До рефакторинга обе формы (`ProjectCalculatorModal`, `EngineerConsultModal`)
 * были заглушками: `setSubmitted(true)` без единого сетевого запроса. Пользователь
 * видел «ЗАПРОС ПРИНЯТ ИНЖЕНЕРОМ» / «СООБЩЕНИЕ ОТПРАВЛЕНО», а лид терялся молча.
 *
 * Здесь: сборка payload, валидация контакта, анти-спам (honeypot + минимальное
 * время заполнения) и честная отправка POST с проверкой статуса 2xx.
 * Успех показывается ТОЛЬКО после 2xx. Если endpoint не сконфигурирован —
 * возвращается `unconfigured`, и UI честно говорит «отправка недоступна»,
 * а не рисует галочку.
 *
 * Куда именно уходят заявки — решение заказчика (см. docs/logic-refactor.md):
 * адрес задаётся либо на этапе сборки (VITE_LEADS_ENDPOINT), либо в рантайме
 * (`window.ABG3D_LEADS_ENDPOINT`) — второй вариант удобен для встраивания.
 */

export type LeadKind = 'calculator' | 'consult';

export interface LeadPayload {
  kind: LeadKind;
  contact: string;
  message?: string;
  topic?: string;
  areaM2?: number;
  floors?: number;
  panelsApprox?: number;
  source: 'abg3d-widget';
  page: string;
  submittedAt: string;
  /** Сколько мс прошло от открытия формы до отправки — сигнал для анти-спама. */
  elapsedMs: number;
  /** Honeypot: у живого пользователя всегда пусто (поле скрыто). */
  honeypot?: string;
}

export interface ContactValidation {
  ok: boolean;
  normalized: string;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Zа-яА-Я]{2,}$/;
const TELEGRAM_RE = /^@[A-Za-z0-9_]{4,32}$/;
const MAX_CONTACT_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 2000;

export function normalizeContact(raw: string): string {
  return (raw ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_CONTACT_LENGTH);
}

export function normalizeMessage(raw: string): string {
  return (raw ?? '').replace(/\r\n/g, '\n').trim().slice(0, MAX_MESSAGE_LENGTH);
}

/** Телефон считаем валидным, если цифр не меньше 10 (РФ + 8/7 или международный). */
export function validateContact(raw: string): ContactValidation {
  const normalized = normalizeContact(raw);
  if (!normalized) {
    return { ok: false, normalized, error: 'Укажите телефон или Telegram' };
  }
  if (TELEGRAM_RE.test(normalized) || EMAIL_RE.test(normalized)) {
    return { ok: true, normalized };
  }
  const digits = normalized.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 15 && /^[+()\-\s\d]+$/.test(normalized)) {
    return { ok: true, normalized };
  }
  return {
    ok: false,
    normalized,
    error: 'Проверьте контакт: телефон в формате +7 999 123-45-67 или @username',
  };
}

/** Минимальное время заполнения формы живым человеком. */
export const MIN_FILL_MS = 900;

export interface BotSignals {
  honeypot?: string;
  elapsedMs: number;
}

/**
 * Анти-спам эвристика. Срабатывает только если заполнено скрытое поле
 * или форма отправлена быстрее, чем за MIN_FILL_MS после открытия.
 * Ложное срабатывание на живом пользователе практически исключено
 * (honeypot скрыт, меньше 0.9 с на ввод телефона+клик невозможно).
 */
export function isLikelyBot(signals: BotSignals): boolean {
  if ((signals.honeypot ?? '').trim().length > 0) return true;
  return signals.elapsedMs < MIN_FILL_MS;
}

export interface LeadInput {
  kind: LeadKind;
  contact: string;
  message?: string;
  topic?: string;
  areaM2?: number;
  floors?: number;
  panelsApprox?: number;
  honeypot?: string;
}

export function buildLeadPayload(
  input: LeadInput,
  meta: { now: number; elapsedMs: number; page: string },
): LeadPayload {
  const payload: LeadPayload = {
    kind: input.kind,
    contact: normalizeContact(input.contact),
    source: 'abg3d-widget',
    page: meta.page,
    submittedAt: new Date(meta.now).toISOString(),
    elapsedMs: Math.max(0, Math.round(meta.elapsedMs)),
  };

  const message = normalizeMessage(input.message ?? '');
  if (message) payload.message = message;
  if (input.topic) payload.topic = input.topic;
  if (typeof input.areaM2 === 'number' && Number.isFinite(input.areaM2)) payload.areaM2 = input.areaM2;
  if (typeof input.floors === 'number' && Number.isFinite(input.floors)) payload.floors = input.floors;
  if (typeof input.panelsApprox === 'number' && Number.isFinite(input.panelsApprox)) {
    payload.panelsApprox = input.panelsApprox;
  }

  const honeypot = (input.honeypot ?? '').trim();
  if (honeypot) payload.honeypot = honeypot;

  return payload;
}

export const RUNTIME_ENDPOINT_KEY = 'ABG3D_LEADS_ENDPOINT';

/**
 * Ключ в query-строке самого виджета: `?leads=<адрес приёма заявок>`.
 *
 * Зачем: при встраивании через `<iframe>` окно родительской страницы внутри iframe
 * не видно (same-origin policy), поэтому `window.ABG3D_LEADS_ENDPOINT` до виджета
 * не доедет — адрес приёма передаётся в URL фрейма.
 */
export const ENDPOINT_QUERY_KEY = 'leads';

const MAX_ENDPOINT_LENGTH = 300;

/**
 * Пропускает только http(s)-адрес. Отсекает `javascript:`, `data:`, пробелы и кавычки —
 * адрес из URL подставляется в `fetch`, и мусор в query-строке не должен превращаться в запрос.
 */
export function sanitizeEndpoint(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_ENDPOINT_LENGTH) return null;
  if (/[\s"'<>\\]/.test(trimmed)) return null;

  const lower = trimmed.toLowerCase();
  const allowed =
    lower.startsWith('https://') ||
    lower.startsWith('http://localhost') ||
    lower.startsWith('http://127.0.0.1');
  return allowed ? trimmed : null;
}

/** Читает адрес приёма из query-строки (`?leads=`, синоним `?endpoint=`). */
export function readEndpointFromQuery(search: string): string | null {
  try {
    const qs = new URLSearchParams(search ?? '');
    return sanitizeEndpoint(qs.get(ENDPOINT_QUERY_KEY) ?? qs.get('endpoint'));
  } catch {
    return null;
  }
}

/**
 * Порядок разрешения адреса приёма заявок:
 *   1) явная настройка (`options.endpoint`, `window.ABG3D_LEADS_ENDPOINT`) — тесты и
 *      скриптовое встраивание;
 *   2) `?leads=<адрес>` в URL виджета — рабочий способ для iframe-встраивания;
 *   3) `VITE_LEADS_ENDPOINT` на этапе сборки;
 *   4) ничего → форма честно говорит «канал заявок не настроен».
 */
export function resolveLeadEndpoint(scope?: unknown): string | null {
  const fromScope = readEndpointFrom(scope);
  if (fromScope) return fromScope;

  const fromWindow = readEndpointFrom(typeof window !== 'undefined' ? window : undefined);
  if (fromWindow) return fromWindow;

  const fromQuery =
    typeof window !== 'undefined' && window.location
      ? readEndpointFromQuery(window.location.search)
      : null;
  if (fromQuery) return fromQuery;

  const fromEnv = readEnvEndpoint();
  if (fromEnv) return fromEnv;

  return null;
}

function readEndpointFrom(scope: unknown): string | null {
  if (!scope || typeof scope !== 'object') return null;
  const value = (scope as Record<string, unknown>)[RUNTIME_ENDPOINT_KEY];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readEnvEndpoint(): string | null {
  try {
    const env = (import.meta as unknown as { env?: Record<string, unknown> }).env;
    const value = env?.VITE_LEADS_ENDPOINT;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

export type SubmitFailureReason = 'no-endpoint' | 'network' | 'timeout' | 'http';

export type SubmitResult =
  | { status: 'success'; httpStatus: number; skippedAsBot?: boolean; responseId?: string }
  | { status: 'unconfigured'; reason: 'no-endpoint'; message: string }
  | { status: 'error'; reason: Exclude<SubmitFailureReason, 'no-endpoint'>; httpStatus?: number; message: string };

export interface SubmitOptions {
  /** Явный адрес; если не передан — берётся из resolveLeadEndpoint(). */
  endpoint?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** Область поиска рантайм-настройки (по умолчанию window). */
  scope?: unknown;
}

export const DEFAULT_TIMEOUT_MS = 12000;

const MESSAGES: Record<SubmitFailureReason, string> = {
  'no-endpoint': 'Отправка сейчас недоступна: канал заявок не настроен.',
  network: 'Не удалось связаться с сервером заявок. Проверьте связь и повторите отправку.',
  timeout: 'Сервер не ответил вовремя. Повторите отправку — данные сохранены.',
  http: 'Сервер отклонил заявку. Повторите отправку или свяжитесь с заводом напрямую.',
};

/**
 * Отправляет заявку. Успех — только при HTTP 2xx.
 * Никаких «успехов по таймауту»: при ошибке возвращается честный отказ,
 * а введённые данные остаются в форме.
 */
export async function submitLead(payload: LeadPayload, options: SubmitOptions = {}): Promise<SubmitResult> {
  if (isLikelyBot({ honeypot: payload.honeypot, elapsedMs: payload.elapsedMs })) {
    // Спам-боту не сообщаем, что его распознали: сети не касаемся вообще.
    return { status: 'success', httpStatus: 0, skippedAsBot: true };
  }

  const endpoint = options.endpoint !== undefined ? options.endpoint : resolveLeadEndpoint(options.scope);
  if (!endpoint) {
    return { status: 'unconfigured', reason: 'no-endpoint', message: MESSAGES['no-endpoint'] };
  }

  const scope = options.scope as { fetch?: typeof fetch } | undefined;
  const fetchImpl = options.fetchImpl ?? scope?.fetch ?? (typeof fetch !== 'undefined' ? fetch : undefined);
  if (typeof fetchImpl !== 'function') {
    return { status: 'error', reason: 'network', message: MESSAGES.network };
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined,
      mode: 'cors',
      credentials: 'omit',
    });

    if (response && response.ok) {
      let responseId: string | undefined;
      try {
        const contentType = response.headers?.get?.('content-type') ?? '';
        if (contentType.includes('application/json')) {
          const body = await response.json();
          if (body && typeof body === 'object' && typeof (body as { id?: unknown }).id === 'string') {
            responseId = (body as { id: string }).id;
          }
        }
      } catch {
        // Тело ответа не обязательно — статуса достаточно.
      }
      return { status: 'success', httpStatus: response.status, responseId };
    }

    return {
      status: 'error',
      reason: 'http',
      httpStatus: response?.status,
      message: `${MESSAGES.http} (HTTP ${response?.status ?? '—'})`,
    };
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    const reason: 'timeout' | 'network' = name === 'AbortError' || name === 'TimeoutError' ? 'timeout' : 'network';
    return { status: 'error', reason, message: MESSAGES[reason] };
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
}
