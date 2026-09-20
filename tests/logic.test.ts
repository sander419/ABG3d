import { describe, expect, test } from 'bun:test';
import { parseWidgetParams } from '../src/lib/widgetParams';
import { MODE_DEFAULTS, MODE_SCRUBBABLE, modeChangePatch, scrubPropFor } from '../src/lib/viewMode';

describe('parseWidgetParams', () => {
  test('?v=thermal2 → режим ТЕПЛО (мёртвый параметр стал живым)', () => {
    expect(parseWidgetParams('?v=thermal2').mode).toBe('thermal');
  });

  test('синонимы режимов', () => {
    expect(parseWidgetParams('?v=exploded').mode).toBe('exploded');
    expect(parseWidgetParams('?mode=structure').mode).toBe('structure');
    expect(parseWidgetParams('?mode=rebar').mode).toBe('structure');
    expect(parseWidgetParams('?v=assembled').mode).toBe('assembled');
    expect(parseWidgetParams('?v=THERMAL').mode).toBe('thermal');
    expect(parseWidgetParams('?mode=teplo').mode).toBe('thermal');
  });

  test('?mode имеет приоритет над ?v', () => {
    expect(parseWidgetParams('?v=thermal2&mode=structure').mode).toBe('structure');
  });

  test('?open= открывает модалки', () => {
    expect(parseWidgetParams('?open=calc').overlay).toBe('calc');
    expect(parseWidgetParams('?open=calculator').overlay).toBe('calc');
    expect(parseWidgetParams('?open=consult').overlay).toBe('consult');
    expect(parseWidgetParams('?open=compare').overlay).toBe('compare');
    expect(parseWidgetParams('?open=assembly').overlay).toBe('assembly');
    expect(parseWidgetParams('?open=montazh').overlay).toBe('assembly');
  });

  test('мусор и пустая строка не ломают виджет', () => {
    expect(parseWidgetParams('')).toEqual({ mode: null, overlay: null, embedded: false, raw: {} });
    expect(parseWidgetParams('?v=<script>').mode).toBeNull();
    expect(parseWidgetParams('?open=hack').overlay).toBeNull();
    expect(parseWidgetParams('?foo=bar').mode).toBeNull();
    expect(parseWidgetParams(undefined as unknown as string).mode).toBeNull();
  });

  test('raw содержит только распознанные ключи', () => {
    const parsed = parseWidgetParams('?v=thermal2&open=calc&embed=1&x=1');
    expect(parsed.raw).toEqual({ mode: 'thermal2', open: 'calc', embed: '1' });
  });

  test('?embed= включает компактный режим встраивания', () => {
    expect(parseWidgetParams('?embed=1').embedded).toBe(true);
    expect(parseWidgetParams('?embed=true').embedded).toBe(true);
    expect(parseWidgetParams('?embed=0').embedded).toBe(false);
  });
});

describe('viewMode', () => {
  test('дефолты разборки совпадают с логикой сцены', () => {
    expect(MODE_DEFAULTS.exploded).toBe(1);
    expect(MODE_DEFAULTS.assembled).toBe(0);
    expect(MODE_DEFAULTS.structure).toBeCloseTo(0.55, 5);
  });

  test('ползунок разборки доступен только в разборных режимах', () => {
    expect(MODE_SCRUBBABLE.exploded).toBe(true);
    expect(MODE_SCRUBBABLE.structure).toBe(true);
    expect(MODE_SCRUBBABLE.assembled).toBe(false);
    expect(MODE_SCRUBBABLE.thermal).toBe(false);
  });

  test('регресс: в режиме АРМАТУРА значение разборки доходит до сцены', () => {
    const patch = modeChangePatch('structure');
    expect(scrubPropFor('structure', patch.scrubValue)).toBe(0.55);
    expect(scrubPropFor('structure', 0.2)).toBe(0.2);
  });

  test('в сборке и тепле сцена получает собственный режим, а не значение ползунка', () => {
    expect(scrubPropFor('assembled', 0.7)).toBeUndefined();
    expect(scrubPropFor('thermal', 0.7)).toBeUndefined();
  });

  test('смена режима очищает выбранный слой там, где это ожидается', () => {
    expect(modeChangePatch('assembled').clearSelection).toBe(true);
    expect(modeChangePatch('thermal').clearSelection).toBe(true);
    expect(modeChangePatch('exploded').clearSelection).toBe(false);
    expect(modeChangePatch('structure').clearSelection).toBe(true);
  });

  test('значение разборки клампится в 0..1', () => {
    expect(scrubPropFor('exploded', 2)).toBe(1);
    expect(scrubPropFor('exploded', -1)).toBe(0);
    expect(scrubPropFor('exploded', NaN)).toBe(MODE_DEFAULTS.exploded);
  });
});
