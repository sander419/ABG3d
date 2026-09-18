import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_TIMEOUT_MS,
  ENDPOINT_QUERY_KEY,
  MIN_FILL_MS,
  buildLeadPayload,
  isLikelyBot,
  normalizeContact,
  readEndpointFromQuery,
  resolveLeadEndpoint,
  sanitizeEndpoint,
  submitLead,
  validateContact,
} from '../src/lib/leads';

const meta = { now: 1_700_000_000_000, elapsedMs: 5_000, page: 'https://abg.hiborg-space.ru/?v=thermal2' };

describe('validateContact', () => {
  test('принимает российский телефон в свободном формате', () => {
    const res = validateContact('  +7 (999) 000-00-00 ');
    expect(res.ok).toBe(true);
    expect(res.normalized).toBe('+7 (999) 000-00-00');
  });

  test('принимает 8-формат и телефон с пробелами', () => {
    expect(validateContact('8 917 169 18 61').ok).toBe(true);
  });

  test('принимает telegram и email', () => {
    expect(validateContact('@sander_l').ok).toBe(true);
    expect(validateContact('lead@abg.ru').ok).toBe(true);
  });

  test('отклоняет пустое, короткое и текст', () => {
    expect(validateContact('').ok).toBe(false);
    expect(validateContact('   ').ok).toBe(false);
    expect(validateContact('+7 999').ok).toBe(false);
    expect(validateContact('позвоните мне').ok).toBe(false);
    expect(validateContact('12345678901234567890').ok).toBe(false);
  });

  test('ошибка сформулирована для человека', () => {
    const res = validateContact('abc');
    expect(res.error).toContain('Проверьте контакт');
  });
});

describe('normalizeContact', () => {
  test('схлопывает пробелы и обрезает длину', () => {
    expect(normalizeContact('  +7   999\t000-00-00 ')).toBe('+7 999 000-00-00');
    expect(normalizeContact('x'.repeat(500)).length).toBe(120);
  });
});

describe('isLikelyBot', () => {
  test('honeypot заполнен → бот', () => {
    expect(isLikelyBot({ honeypot: 'http://spam', elapsedMs: 10_000 })).toBe(true);
  });

  test('слишком быстрая отправка → бот', () => {
    expect(isLikelyBot({ elapsedMs: MIN_FILL_MS - 1 })).toBe(true);
  });

  test('живой сценарий (пустой honeypot, время выдержано) → не бот', () => {
    expect(isLikelyBot({ honeypot: '', elapsedMs: MIN_FILL_MS })).toBe(false);
    expect(isLikelyBot({ elapsedMs: 30_000 })).toBe(false);
  });
});

describe('buildLeadPayload', () => {
  test('калькулятор: заполняет поля и метаданные', () => {
    const payload = buildLeadPayload(
      { kind: 'calculator', contact: ' +7 999 000-00-00 ', areaM2: 180, floors: 2, panelsApprox: 94 },
      meta,
    );
    expect(payload).toEqual({
      kind: 'calculator',
      contact: '+7 999 000-00-00',
      source: 'abg3d-widget',
      page: meta.page,
      submittedAt: new Date(meta.now).toISOString(),
      elapsedMs: 5_000,
      areaM2: 180,
      floors: 2,
      panelsApprox: 94,
    });
  });

  test('консультация: тема и сообщение, необязательные поля не появляются', () => {
    const payload = buildLeadPayload(
      { kind: 'consult', contact: '@sander_l', topic: 'peikko', message: '  Вопрос по узлу PDM  ' },
      meta,
    );
    expect(payload.topic).toBe('peikko');
    expect(payload.message).toBe('Вопрос по узлу PDM');
    expect('areaM2' in payload).toBe(false);
    expect('floors' in payload).toBe(false);
  });

  test('honeypot попадает в payload только если заполнен', () => {
    expect(buildLeadPayload({ kind: 'consult', contact: '@user', honeypot: '' }, meta).honeypot).toBeUndefined();
    expect(buildLeadPayload({ kind: 'consult', contact: '@user', honeypot: 'bot' }, meta).honeypot).toBe('bot');
  });

  test('длинное сообщение обрезается до 2000 символов', () => {
    const payload = buildLeadPayload({ kind: 'consult', contact: '@user', message: 'a'.repeat(5000) }, meta);
    expect(payload.message?.length).toBe(2000);
  });

  test('отрицательное время не уходит в payload', () => {
    const payload = buildLeadPayload({ kind: 'calculator', contact: '+7 999 000-00-00' }, { ...meta, elapsedMs: -50 });
    expect(payload.elapsedMs).toBe(0);
  });
});

describe('resolveLeadEndpoint', () => {
  test('читает рантайм-настройку и тримит её', () => {
    expect(resolveLeadEndpoint({ ABG3D_LEADS_ENDPOINT: '  https://api.abg.ru/lead  ' })).toBe('https://api.abg.ru/lead');
  });

  test('пустое значение и мусор → null', () => {
    expect(resolveLeadEndpoint({ ABG3D_LEADS_ENDPOINT: '   ' })).toBeNull();
    expect(resolveLeadEndpoint({ ABG3D_LEADS_ENDPOINT: 42 })).toBeNull();
    expect(resolveLeadEndpoint(null)).toBeNull();
    expect(resolveLeadEndpoint(undefined)).toBeNull();
  });
});

describe('submitLead', () => {
  const payload = buildLeadPayload({ kind: 'calculator', contact: '+7 999 000-00-00', areaM2: 180 }, meta);

  test('200 → success и реальный POST с JSON-телом', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ id: 'lead-1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    const result = await submitLead(payload, { endpoint: 'https://api.abg.ru/lead', fetchImpl });

    expect(result.status).toBe('success');
    expect(calls.length).toBe(1);
    expect(calls[0].url).toBe('https://api.abg.ru/lead');
    expect(calls[0].init.method).toBe('POST');
    expect((calls[0].init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.kind).toBe('calculator');
    expect(body.contact).toBe('+7 999 000-00-00');
    expect(body.areaM2).toBe(180);
  });

  test('500 → error, успех НЕ показывается', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 500 })) as unknown as typeof fetch;
    const result = await submitLead(payload, { endpoint: 'https://api.abg.ru/lead', fetchImpl });
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.reason).toBe('http');
      expect(result.httpStatus).toBe(500);
      expect(result.message).toContain('HTTP 500');
    }
  });

  test('сеть упала → error/network (а не фейковый успех)', async () => {
    const fetchImpl = (async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    const result = await submitLead(payload, { endpoint: 'https://api.abg.ru/lead', fetchImpl });
    expect(result.status).toBe('error');
    if (result.status === 'error') expect(result.reason).toBe('network');
  });

  test('таймаут → error/timeout', async () => {
    const fetchImpl = (async () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    }) as unknown as typeof fetch;
    const result = await submitLead(payload, { endpoint: 'https://api.abg.ru/lead', fetchImpl });
    expect(result.status).toBe('error');
    if (result.status === 'error') expect(result.reason).toBe('timeout');
  });

  test('endpoint не задан → unconfigured и ни одного сетевого вызова', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return new Response('', { status: 200 });
    }) as unknown as typeof fetch;
    const result = await submitLead(payload, { endpoint: null, fetchImpl, scope: {} });
    expect(result.status).toBe('unconfigured');
    expect(calls).toBe(0);
  });

  test('бот (honeypot заполнен) не доходит до сети', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return new Response('', { status: 200 });
    }) as unknown as typeof fetch;
    const botPayload = buildLeadPayload(
      { kind: 'consult', contact: '@bot', honeypot: 'spam' },
      { ...meta, elapsedMs: 30 },
    );
    const result = await submitLead(botPayload, { endpoint: 'https://api.abg.ru/lead', fetchImpl });
    expect(result.status).toBe('success');
    expect(result.status === 'success' && result.skippedAsBot).toBe(true);
    expect(calls).toBe(0);
  });

  test('дефолтный таймаут разумный', () => {
    expect(DEFAULT_TIMEOUT_MS).toBeLessThanOrEqual(20_000);
  });
});

describe('адрес приёма заявок из URL виджета (?leads=)', () => {
  test('ключ и синоним читаются из query-строки', () => {
    expect(ENDPOINT_QUERY_KEY).toBe('leads');
    expect(readEndpointFromQuery('?leads=https://api.abg.ru/lead')).toBe('https://api.abg.ru/lead');
    expect(readEndpointFromQuery('?endpoint=https://hook.abg.ru/x')).toBe('https://hook.abg.ru/x');
  });

  test('URL-кодирование и мусор в query-строке', () => {
    expect(readEndpointFromQuery('?leads=https%3A%2F%2Fapi.abg.ru%2Flead')).toBe('https://api.abg.ru/lead');
    expect(readEndpointFromQuery('?v=thermal2')).toBeNull();
    expect(readEndpointFromQuery('')).toBeNull();
  });

  test('пропускает только http(s): javascript:, data:, ftp, пробелы — мимо', () => {
    expect(sanitizeEndpoint('https://api.abg.ru/lead')).toBe('https://api.abg.ru/lead');
    expect(sanitizeEndpoint('  https://api.abg.ru/lead  ')).toBe('https://api.abg.ru/lead');
    expect(sanitizeEndpoint('http://localhost:8899/lead')).toBe('http://localhost:8899/lead');
    expect(readEndpointFromQuery('?leads=javascript:alert(1)')).toBeNull();
    expect(readEndpointFromQuery('?leads=data:text/html,x')).toBeNull();
    expect(sanitizeEndpoint('ftp://abg.ru/lead')).toBeNull();
    expect(sanitizeEndpoint('https://api.abg.ru/le ad')).toBeNull();
    expect(sanitizeEndpoint(`https://abg.ru/${'x'.repeat(400)}`)).toBeNull();
    expect(sanitizeEndpoint(undefined)).toBeNull();
    expect(sanitizeEndpoint(42)).toBeNull();
  });

  test('приоритет: window.ABG3D_LEADS_ENDPOINT → ?leads= → сборка', () => {
    const g = globalThis as unknown as { window?: unknown };
    const previousWindow = g.window;
    try {
      g.window = { location: { search: '?leads=https://from-query.abg.ru/lead' } };
      expect(resolveLeadEndpoint({})).toBe('https://from-query.abg.ru/lead');

      g.window = {
        ABG3D_LEADS_ENDPOINT: 'https://from-window.abg.ru/lead',
        location: { search: '?leads=https://from-query.abg.ru/lead' },
      };
      expect(resolveLeadEndpoint({})).toBe('https://from-window.abg.ru/lead');
    } finally {
      if (previousWindow === undefined) delete g.window;
      else g.window = previousWindow;
    }
  });
});
