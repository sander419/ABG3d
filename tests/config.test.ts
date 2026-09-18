/**
 * Сторожевые тесты для пункта P2-8 аудита (единый источник текстов/метрик).
 *
 * Фиксируют три вещи, которые раньше разъезжались:
 *  - R₀ 9.2 и канонические температуры (−20/+22) живут литералами только в
 *    data/panelConfig.ts;
 *  - теплопотери графика согласованы с каноническим ΔT (U · 100 м² · ΔT);
 *  - текст дисклеймера не копируется по компонентам, а берётся из PANEL_CONFIG.
 */
import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { PANEL_CONFIG, formatTemperatureC } from '../src/data/panelConfig';
import { THERMAL_COMPARISON_DATA } from '../src/components/UI/ThermalUValueComparison';

const SRC = join(import.meta.dir, '..', 'src');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

/** Комментарии вырезаем: в них допустимы пояснения с числами. */
const stripComments = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const SOURCES = walk(SRC)
  .filter((file) => /\.(ts|tsx)$/.test(file))
  .map((file) => ({ file, code: stripComments(readFileSync(file, 'utf8')) }));

const filesMatching = (re: RegExp) =>
  SOURCES.filter((source) => re.test(source.code)).map((source) =>
    source.file.replace(/\\/g, '/').split('/src/')[1],
  );

describe('P2-8: единый источник метрик', () => {
  test('R₀ 9.2 — единственный литерал в panelConfig.ts', () => {
    expect(filesMatching(/9\.2/)).toEqual(['data/panelConfig.ts']);
  });

  test('канонические температуры не дублируются по компонентам', () => {
    // Любые -20/-25/+22 (с «°C» рядом) вне panelConfig — регресс.
    expect(filesMatching(/[-−]2\d\s?°C|\+2\d\s?°C/)).toEqual([]);
  });

  test('текст дисклеймера не копируется, а читается из PANEL_CONFIG', () => {
    const duplicated = SOURCES.filter(
      (source) =>
        source.code.includes(PANEL_CONFIG.meta.disclaimer) &&
        !source.file.endsWith('panelConfig.ts'),
    ).map((source) => source.file);
    expect(duplicated).toEqual([]);
  });
});

describe('P2-8: согласованность температур и теплопотерь', () => {
  test('climate согласован: indoor − outdoor = deltaT', () => {
    const { outdoorC, indoorC, deltaTC } = PANEL_CONFIG.climate;
    expect(indoorC - outdoorC).toBe(deltaTC);
    expect(deltaTC).toBe(42);
  });

  test('формат тегов: −20 °C и +22 °C', () => {
    expect(formatTemperatureC(PANEL_CONFIG.climate.outdoorC)).toBe('-20 °C');
    expect(formatTemperatureC(PANEL_CONFIG.climate.indoorC)).toBe('+22 °C');
  });

  test('heatLoss графика = U · 100 м² · ΔT (допуск 0.01 кВт)', () => {
    for (const point of THERMAL_COMPARISON_DATA) {
      const expected = (point.uValue * 100 * PANEL_CONFIG.climate.deltaTC) / 1000;
      expect(Math.abs(point.heatLoss - expected)).toBeLessThanOrEqual(0.01);
    }
  });

  test('R₀ панели в графике берётся из конфига', () => {
    const prefab = THERMAL_COMPARISON_DATA.find((point) => point.id === 'prefab-panel');
    expect(prefab?.rValue).toBe(PANEL_CONFIG.meta.r0Value);
  });
});
