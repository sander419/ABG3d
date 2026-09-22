import { describe, expect, test } from 'bun:test';
import { PANEL_GEOMETRY } from '../src/lib/panelGeometry';
import { CORNER, CORNER_PVL, CORNER_STAGES, SERVICE_BOX, SERVICE_SLEEVES, WINDOW_OPENINGS, cornerEndX, cornerPocket, panelBToWorld, validateOpenings } from '../src/lib/panelScenarios';
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

describe('corner: two identical panels meeting on a PVL pocket', () => {
  const pocket = cornerPocket();
  const { protrusion, loopHalfWidth } = CORNER_PVL;
  test('panel A keeps its 2.0 m facade width', () => {
    expect(cornerEndX('facade', totalThickness / 2)).toBeCloseTo(width / 2, 8);
  });
  test('panel B is panel A mirrored across the 45° corner plane', () => {
    // A's outer corner and B's outer corner are the same point.
    const [X, Z] = panelBToWorld(CORNER.outerX, totalThickness / 2);
    expect(X).toBeCloseTo(CORNER.outerX, 8);
    expect(Z).toBeCloseTo(totalThickness / 2, 8);
    // Points on the mitre plane map onto themselves.
    const z = 0.05;
    const [mx, mz] = panelBToWorld(cornerEndX('insulation', z), z);
    expect(mx).toBeCloseTo(cornerEndX('insulation', z), 8);
    expect(mz).toBeCloseTo(z, 8);
  });
  test('the inner wythes stop short and leave a square pocket at the inner corner', () => {
    // A's inner-wythe end face is the pocket's A side...
    expect(pocket.faceX).toBeCloseTo(pocket.x - pocket.size / 2, 8);
    // ...B's inner-wythe end face maps onto A's room face line, closing the other side.
    const [, zEndB] = panelBToWorld(cornerEndX('structural', 0), 0);
    expect(zEndB).toBeCloseTo(-totalThickness / 2, 8);
    // A's insulation covers the pocket's far side.
    expect(cornerEndX('insulation', structural.centerZ + structural.thickness / 2)).toBeCloseTo(pocket.faceX + pocket.size, 8);
  });
  test('loops of both panels reach past the bar at the pocket centre and stay inside the pocket', () => {
    expect(pocket.faceX + protrusion).toBeGreaterThan(pocket.x + 0.009);
    expect(pocket.faceX + protrusion).toBeLessThan(pocket.faceX + pocket.size);
    expect(loopHalfWidth * 2).toBeGreaterThan(0.018 + 0.012);
  });
  test('loops of the two panels are stacked no more than 20 mm apart (Peikko)', () => {
    expect(CORNER_PVL.pairOffsetY).toBeLessThanOrEqual(0.02);
  });
  test('the demonstration has four ordered steps', () => {
    expect(CORNER_STAGES.map((s) => s.stage)).toEqual([1, 2, 3, 4]);
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
