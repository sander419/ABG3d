import { describe, expect, test } from 'bun:test';
import {
  WIDGET_EVENT_SOURCE,
  WIDGET_EVENT_VERSION,
  buildWidgetEvent,
  emitWidgetEvent,
  resolveEventTarget,
} from '../src/lib/widgetEvents';

interface Sent {
  message: unknown;
  targetOrigin: string;
}

/** Мини-заглушка окна: `parent` может совпадать с самим окном (нет iframe) или отличаться. */
function makeWindow(sameParent: boolean): { window: unknown; sent: Sent[] } {
  const sent: Sent[] = [];
  const win: Record<string, unknown> = {
    postMessage(message: unknown, targetOrigin: string) {
      sent.push({ message, targetOrigin });
    },
  };
  win.parent = sameParent ? win : {
    postMessage(message: unknown, targetOrigin: string) {
      sent.push({ message, targetOrigin });
    },
  };
  return { window: win, sent };
}

describe('buildWidgetEvent', () => {
  test('конверт события стабилен: source + version + type + payload', () => {
    const event = buildWidgetEvent('abg3d:mode', { mode: 'thermal' });
    expect(event).toEqual({
      source: 'abg3d-widget',
      version: 1,
      type: 'abg3d:mode',
      payload: { mode: 'thermal' },
    });
    expect(WIDGET_EVENT_SOURCE).toBe('abg3d-widget');
    expect(WIDGET_EVENT_VERSION).toBe(1);
  });

  test('payload по умолчанию пустой, а не undefined', () => {
    expect(buildWidgetEvent('abg3d:overlay').payload).toEqual({});
  });
});

describe('resolveEventTarget', () => {
  test('в iframe цель — родительское окно', () => {
    const { window: win } = makeWindow(false);
    const target = resolveEventTarget(win);
    expect(target).not.toBeNull();
    expect(target).not.toBe(win);
  });

  test('без iframe (parent === self) цель — собственное окно', () => {
    const { window: win, sent } = makeWindow(true);
    const target = resolveEventTarget(win);
    expect(target).not.toBeNull();
    target?.postMessage(buildWidgetEvent('abg3d:mode', { mode: 'assembled' }), '*');
    expect(sent.length).toBe(1);
  });

  test('не-окно (SSR, примитив) — цели нет', () => {
    expect(resolveEventTarget(undefined)).toBeNull();
    expect(resolveEventTarget(null)).toBeNull();
    expect(resolveEventTarget('window')).toBeNull();
    expect(resolveEventTarget({})).toBeNull();
  });
});

describe('emitWidgetEvent', () => {
  test('событие уходит родителю с targetOrigin="*"', () => {
    const { window: win, sent } = makeWindow(false);
    const event = emitWidgetEvent('abg3d:overlay', { overlay: 'calc', open: true }, win);

    expect(event?.type).toBe('abg3d:overlay');
    expect(sent.length).toBe(1);
    expect(sent[0].targetOrigin).toBe('*');
    expect(sent[0].message).toEqual({
      source: 'abg3d-widget',
      version: 1,
      type: 'abg3d:overlay',
      payload: { overlay: 'calc', open: true },
    });
  });

  test('в событиях заявки нет персональных данных (только факт и статус)', () => {
    const { window: win, sent } = makeWindow(false);
    emitWidgetEvent('abg3d:lead', { kind: 'calculator', status: 'success', httpStatus: 200 }, win);

    const payload = (sent[0].message as { payload: Record<string, unknown> }).payload;
    expect(Object.keys(payload).sort()).toEqual(['httpStatus', 'kind', 'status']);
    expect(JSON.stringify(payload)).not.toContain('@');
  });

  test('падение чужого postMessage не роняет виджет', () => {
    const win = {
      postMessage() {
        throw new Error('blocked');
      },
    } as unknown as Record<string, unknown>;
    win.parent = win;

    expect(emitWidgetEvent('abg3d:mode', { mode: 'thermal' }, win)).toBeNull();
  });

  test('нет окна — событие просто не отправляется (никаких исключений)', () => {
    expect(emitWidgetEvent('abg3d:mode', { mode: 'thermal' }, undefined)).toBeNull();
  });
});
