import { PANEL_GEOMETRY } from './panelGeometry';

// Metres. Every figure here is illustrative demo geometry, not an ABG design
// value: see docs/engineering-model-scope.md before labelling anything "по проекту".

export interface Opening {
  id: string;
  /** Centre of the opening in panel coordinates (x right, y up, origin at panel centre). */
  x: number;
  y: number;
  width: number;
  height: number;
}

export const WINDOW_OPENINGS: readonly Opening[] = [
  { id: 'tall', x: -0.46, y: 0.32, width: 0.48, height: 0.88 },
  { id: 'wide', x: 0.42, y: 0.1, width: 0.82, height: 0.58 },
];

/** Returns human-readable problems; an empty list means the layout is buildable. */
export function validateOpenings(openings: readonly Opening[], panelWidth: number, panelHeight: number, minMargin = 0.1): string[] {
  const problems: string[] = [];
  const edges = (o: Opening) => ({ l: o.x - o.width / 2, r: o.x + o.width / 2, b: o.y - o.height / 2, t: o.y + o.height / 2 });
  openings.forEach((o) => {
    const e = edges(o);
    if (e.l < -panelWidth / 2 + minMargin || e.r > panelWidth / 2 - minMargin || e.b < -panelHeight / 2 + minMargin || e.t > panelHeight / 2 - minMargin) {
      problems.push(`${o.id}: closer than ${minMargin} m to the panel edge`);
    }
  });
  for (let i = 0; i < openings.length; i += 1) {
    for (let j = i + 1; j < openings.length; j += 1) {
      const a = edges(openings[i]);
      const b = edges(openings[j]);
      const apartX = a.r + minMargin <= b.l || b.r + minMargin <= a.l;
      const apartY = a.t + minMargin <= b.b || b.t + minMargin <= a.b;
      if (!apartX && !apartY) problems.push(`${openings[i].id} and ${openings[j].id}: closer than ${minMargin} m`);
    }
  }
  return problems;
}

export type LayerId = 'facade' | 'insulation' | 'structural';

/**
 * Outside corner: panel A ends at x = width / 2, a grouted vertical joint follows,
 * then panel B runs backwards (-z) with its layers stacked across x — structural
 * nearest the joint, facade outermost. B's front end is flush with A's facade plane.
 */
export const CORNER = { jointWidth: 0.04, returnLength: 1.35 };

export function cornerLayout() {
  const { width, totalThickness, facade, insulation, structural } = PANEL_GEOMETRY;
  const start = width / 2 + CORNER.jointWidth;
  const structuralX = start + structural.thickness / 2;
  const insulationX = start + structural.thickness + insulation.thickness / 2;
  const facadeX = start + structural.thickness + insulation.thickness + facade.thickness / 2;
  return {
    layers: {
      structural: { x: structuralX, thickness: structural.thickness },
      insulation: { x: insulationX, thickness: insulation.thickness },
      facade: { x: facadeX, thickness: facade.thickness },
    } satisfies Record<LayerId, { x: number; thickness: number }>,
    length: CORNER.returnLength,
    centerZ: totalThickness / 2 - CORNER.returnLength / 2,
    joint: { x: width / 2 + CORNER.jointWidth / 2, width: CORNER.jointWidth, depth: totalThickness },
  };
}

// Sleeves and the back box run through the inner structural wythe.
export const SERVICE_SLEEVES = [
  { id: 'power', x: -0.46, y: 0.34, tone: 'red' },
  { id: 'water', x: 0, y: 0.1, tone: 'blue' },
  { id: 'vent', x: 0.46, y: -0.14, tone: 'box' },
] as const;
export const SERVICE_BOX = { x: 0, y: -0.42, width: 0.42, height: 0.28, depth: 0.08 };
