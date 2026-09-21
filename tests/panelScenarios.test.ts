import { describe, expect, test } from 'bun:test';
import { PANEL_GEOMETRY } from '../src/lib/panelGeometry';
import { CORNER, SERVICE_BOX, SERVICE_SLEEVES, WINDOW_OPENINGS, cornerLayout, validateOpenings } from '../src/lib/panelScenarios';
import { buildPerforatedGeometry } from '../src/components/Panel3D/PerforatedSlab';

const { width, height, totalThickness, structural, insulation, facade } = PANEL_GEOMETRY;

describe('window openings', () => {
  test('demo layout is buildable', () => {
    expect(validateOpenings(WINDOW_OPENINGS, width, height)).toEqual([]);
  });
  test('rejects overlap and edge contact', () => {
    const overlap = [{ id: 'a', x: 0, y: 0, width: 0.6, height: 0.6 }, { id: 'b', x: 0.3, y: 0, width: 0.6, height: 0.6 }];
    expect(validateOpenings(overlap, width, height).length).toBeGreaterThan(0);
    const edge = [{ id: 'c', x: 0.9, y: 0, width: 0.4, height: 0.4 }];
    expect(validateOpenings(edge, width, height).length).toBeGreaterThan(0);
  });
});

describe('perforated slab', () => {
  const geometry = buildPerforatedGeometry(width, height, structural.thickness, WINDOW_OPENINGS);
  geometry.computeBoundingBox();
  test('keeps the exact layer size', () => {
    const box = geometry.boundingBox!;
    expect(box.max.x - box.min.x).toBeCloseTo(width, 6);
    expect(box.max.y - box.min.y).toBeCloseTo(height, 6);
    expect(box.max.z - box.min.z).toBeCloseTo(structural.thickness, 6);
  });
  test('has no surface inside an opening', () => {
    const position = geometry.getAttribute('position');
    const inside = (x: number, y: number) => WINDOW_OPENINGS.some((o) => Math.abs(x - o.x) < o.width / 2 - 1e-6 && Math.abs(y - o.y) < o.height / 2 - 1e-6);
    for (let i = 0; i < position.count; i += 1) expect(inside(position.getX(i), position.getY(i))).toBe(false);
  });
  test('uv stays within 0..1', () => {
    const uv = geometry.getAttribute('uv');
    for (let i = 0; i < uv.count; i += 1) {
      expect(uv.getX(i)).toBeGreaterThanOrEqual(-1e-6);
      expect(uv.getX(i)).toBeLessThanOrEqual(1 + 1e-6);
    }
  });
});

describe('corner layout', () => {
  const layout = cornerLayout();
  test('layers stack across the return wall without overlap or gap', () => {
    const { structural: s, insulation: i, facade: f } = layout.layers;
    expect(s.x + s.thickness / 2).toBeCloseTo(i.x - i.thickness / 2, 8);
    expect(i.x + i.thickness / 2).toBeCloseTo(f.x - f.thickness / 2, 8);
    expect(f.x + f.thickness / 2 - (s.x - s.thickness / 2)).toBeCloseTo(structural.thickness + insulation.thickness + facade.thickness, 8);
  });
  test('return wall starts one joint width after panel A and is flush with its facade plane', () => {
    expect(layout.layers.structural.x - structural.thickness / 2).toBeCloseTo(width / 2 + CORNER.jointWidth, 8);
    expect(layout.centerZ + layout.length / 2).toBeCloseTo(totalThickness / 2, 8);
  });
});

describe('service layout', () => {
  test('sleeves and box fit inside the panel', () => {
    SERVICE_SLEEVES.forEach((s) => {
      expect(Math.abs(s.x)).toBeLessThan(width / 2 - 0.1);
      expect(Math.abs(s.y)).toBeLessThan(height / 2 - 0.1);
    });
    expect(Math.abs(SERVICE_BOX.x) + SERVICE_BOX.width / 2).toBeLessThan(width / 2);
    expect(SERVICE_BOX.depth).toBeLessThan(structural.thickness);
  });
});
