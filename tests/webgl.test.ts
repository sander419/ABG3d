import { describe, expect, test } from 'bun:test';
import { PROBE_CONTEXT_IDS, probeWebGLSupport } from '../src/utils/webglSupport';

/** Пробный канвас-двойник: только getContext, как у настоящего HTMLCanvasElement. */
function fakeCanvas(getContext: (id: string) => unknown, spy?: string[]): HTMLCanvasElement {
  return {
    getContext: (id: string) => {
      spy?.push(id);
      return getContext(id);
    },
  } as unknown as HTMLCanvasElement;
}

describe('probeWebGLSupport', () => {
  test('webgl2 есть → available, контекст освобождён (не отнимаем слот у сцены)', () => {
    let lost = 0;
    const gl = { getExtension: () => ({ loseContext: () => { lost += 1; } }) };
    const result = probeWebGLSupport({ createCanvas: () => fakeCanvas(() => gl) });

    expect(result).toBe('available');
    expect(lost).toBe(1);
  });

  test('webgl2 нет, webgl1 есть → available (порядок проб как у three)', () => {
    const order: string[] = [];
    const gl = { getExtension: () => null };
    const result = probeWebGLSupport({
      createCanvas: () => fakeCanvas((id) => (id === 'webgl' ? gl : null), order),
    });

    expect(result).toBe('available');
    expect(order[0]).toBe('webgl2');
    expect(order[1]).toBe('webgl');
  });

  test('все идентификаторы отдают null → unsupported (старый Android, выключенный аппаратный рендер)', () => {
    const order: string[] = [];
    const result = probeWebGLSupport({ createCanvas: () => fakeCanvas(() => null, order) });

    expect(result).toBe('unsupported');
    expect(order).toEqual([...PROBE_CONTEXT_IDS]);
  });

  test('getContext кидает на незнакомом id → идём дальше, не падаем', () => {
    const gl = { getExtension: () => null };
    const result = probeWebGLSupport({
      createCanvas: () => fakeCanvas((id) => {
        if (id === 'webgl2') throw new Error('unknown context id');
        return id === 'experimental-webgl' ? gl : null;
      }),
    });

    expect(result).toBe('available');
  });

  test('канвас не создался (SSR/без document) → available: о поддержке судит браузер, а не отсутствие DOM', () => {
    expect(probeWebGLSupport({ createCanvas: () => null })).toBe('available');
  });

  test('createCanvas кидает → unsupported, а не исключение наружу', () => {
    const result = probeWebGLSupport({
      createCanvas: () => {
        throw new Error('DOM недоступен');
      },
    });

    expect(result).toBe('unsupported');
  });

  test('WEBGL_lose_context отсутствует → available без исключения', () => {
    const gl = { getExtension: () => null };
    expect(probeWebGLSupport({ createCanvas: () => fakeCanvas(() => gl) })).toBe('available');
  });
});
