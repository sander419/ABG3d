import { describe, expect, test } from 'bun:test';
import { PANEL_GEOMETRY } from '../src/lib/panelGeometry';

describe('assembled panel geometry', () => {
  const { facade, insulation, structural } = PANEL_GEOMETRY;
  test('concrete and insulation meet without hidden air gaps or overlap', () => {
    expect(structural.centerZ + structural.thickness / 2).toBeCloseTo(insulation.centerZ - insulation.thickness / 2, 8);
    expect(insulation.centerZ + insulation.thickness / 2).toBeCloseTo(facade.centerZ - facade.thickness / 2, 8);
  });
  test('outer faces measure 390 mm', () => {
    expect(facade.centerZ + facade.thickness / 2 - (structural.centerZ - structural.thickness / 2)).toBeCloseTo(0.390, 8);
  });
});
