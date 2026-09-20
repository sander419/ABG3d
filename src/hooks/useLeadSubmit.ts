/**
 * Состояние формы заявки: idle → sending → success | error.
 *
 * Правила, которые здесь закреплены:
 *  - успех ставится ТОЛЬКО по результату 'success' из submitLead (то есть по 2xx);
 *  - при ошибке/недоступном канале введённые данные не сбрасываются — пользователь
 *    может нажать «повторить»;
 *  - при каждом открытии модалки форма стартует заново (в старом коде `submitted`
 *    оставался true навсегда: закрыл и открыл калькулятор — снова экран «Запрос принят»);
 *  - повторная отправка, пока идёт предыдущая, игнорируется.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LeadInput,
  LeadKind,
  SubmitResult,
  buildLeadPayload,
  resolveLeadEndpoint,
  submitLead,
  validateContact,
} from '../lib/leads';
import { emitWidgetEvent } from '../lib/widgetEvents';

export type LeadFormStatus = 'idle' | 'sending' | 'success' | 'error';

export type FormSubmitOutcome = SubmitResult | { status: 'invalid'; message: string };

export interface UseLeadSubmitResult {
  status: LeadFormStatus;
  isSubmitting: boolean;
  /** Ошибка поля контакта (показывается под инпутом). */
  fieldError: string | null;
  /** Ошибка отправки (показывается над кнопкой). */
  failureMessage: string | null;
  /** Канал заявок не сконфигурирован — форма объясняет это честно. */
  channelUnavailable: boolean;
  submit: (input: Omit<LeadInput, 'kind'>) => Promise<FormSubmitOutcome>;
  reset: () => void;
}

export interface UseLeadSubmitOptions {
  /** Явный endpoint (нужен тестам и встраиванию). */
  endpoint?: string | null;
  /** Переопределение fetch (тесты). */
  fetchImpl?: typeof fetch;
  /** Переопределение «сейчас» (тесты). */
  now?: () => number;
}

export function useLeadSubmit(
  kind: LeadKind,
  isOpen: boolean,
  options: UseLeadSubmitOptions = {},
): UseLeadSubmitResult {
  const [status, setStatus] = useState<LeadFormStatus>('idle');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [channelUnavailable, setChannelUnavailable] = useState<boolean>(false);

  const openedAtRef = useRef<number>(0);
  const generationRef = useRef(0);
  const statusRef = useRef<LeadFormStatus>('idle');
  statusRef.current = status;

  // now() должен быть стабильной ссылкой, иначе reset() пересоздаётся на каждом
  // рендере, эффект ниже срабатывает снова и затирает статус отправки в 'idle'.
  const nowRef = useRef<() => number>(options.now ?? (() => Date.now()));
  const now = nowRef.current;

  const reset = useCallback(() => {
    generationRef.current += 1;
    openedAtRef.current = now();
    statusRef.current = 'idle';
    setStatus('idle');
    setFieldError(null);
    setFailureMessage(null);
    setChannelUnavailable(false);
  }, [now]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) reset();
    if (!isOpen && wasOpenRef.current) generationRef.current += 1;
    wasOpenRef.current = isOpen;
  }, [isOpen, reset]);
  useEffect(() => () => { generationRef.current += 1; }, []);

  const submit = useCallback(
    async (input: Omit<LeadInput, 'kind'>): Promise<FormSubmitOutcome> => {
      if (statusRef.current === 'sending') {
        return { status: 'error', reason: 'network', message: 'Отправка уже идёт' };
      }

      const contact = validateContact(input.contact ?? '');
      if (!contact.ok) {
        setFieldError(contact.error ?? 'Проверьте контакт');
        return { status: 'invalid', message: contact.error ?? 'Проверьте контакт' };
      }
      setFieldError(null);
      setFailureMessage(null);
      statusRef.current = 'sending';
      setStatus('sending');

      const elapsedMs = Math.max(0, now() - (openedAtRef.current || now()));
      const page = typeof window !== 'undefined' ? window.location.href : '';

      const payload = buildLeadPayload(
        { ...input, kind, contact: contact.normalized },
        { now: now(), elapsedMs, page },
      );
      const generation = generationRef.current;

      const result = await submitLead(payload, {
        endpoint: options.endpoint,
        fetchImpl: options.fetchImpl,
      });
      // A response from a closed form must not overwrite a newly opened form.
      if (generation !== generationRef.current) return result;

      if (result.status === 'success') {
        statusRef.current = 'success';
        setStatus('success');
        // Событие для страницы-хоста: без контакта и текста заявки (только факт и статус).
        emitWidgetEvent('abg3d:lead', {
          kind,
          status: 'success',
          httpStatus: result.httpStatus,
        });
        return result;
      }

      statusRef.current = 'error';
      setStatus('error');
      setFailureMessage(result.message);
      emitWidgetEvent('abg3d:lead', {
        kind,
        status: result.status,
        reason: result.reason,
      });
      if (result.status === 'unconfigured') {
        setChannelUnavailable(true);
        warnChannelNotConfigured();
      }
      return result;
    },
    [kind, now, options.endpoint, options.fetchImpl],
  );

  return {
    status,
    isSubmitting: status === 'sending',
    fieldError,
    failureMessage,
    channelUnavailable,
    submit,
    reset,
  };
}

/** true, если канал заявок настроен (для подсказки в UI до отправки). */
export function isLeadChannelConfigured(): boolean {
  return resolveLeadEndpoint() !== null;
}

let warnedMissingChannel = false;

/**
 * Предупреждение для интегратора (в консоль, не в лицо клиенту ABG):
 * заявка не отправлена, потому что не задан адрес приёма.
 */
function warnChannelNotConfigured(): void {
  if (warnedMissingChannel || typeof console === 'undefined') return;
  warnedMissingChannel = true;
  console.warn(
    '[ABG3D] Канал заявок не настроен: задайте VITE_LEADS_ENDPOINT при сборке ' +
      'или window.ABG3D_LEADS_ENDPOINT в рантайме. Заявка НЕ отправлена ' +
      '(пользователю показано честное сообщение об ошибке).',
  );
}
