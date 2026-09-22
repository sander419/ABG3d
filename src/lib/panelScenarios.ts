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
// The joint is drawn wider than a site joint so the loops, bar and grout stay
// readable on screen; the real width comes from the ABG joint detail.
export const CORNER = { jointWidth: 0.08, returnLength: 1.35 };

/**
 * PVL principle (Peikko): wire loops cast into both panel edges fold out into the
 * joint and overlap, a vertical bar is dropped through the overlap, the joint is
 * grouted. Loop pitch, protrusion and wire size here are illustrative.
 */
export const CORNER_PVL = {
  loopYs: [-0.72, -0.24, 0.24, 0.72],
  protrusion: 0.07,
  loopHalfWidth: 0.032,
  /** Panel B lifts in from this far away in step 1. */
  separation: 0.5,
};

export type CornerStage = 1 | 2 | 3 | 4;

export const CORNER_STAGES: readonly { stage: CornerStage; title: string; text: string }[] = [
  { stage: 1, title: 'Петли', text: 'В торцы обеих панелей на заводе заложены стальные тросовые петли.' },
  { stage: 2, title: 'Стыковка', text: 'Вторую панель ставят краном — петли из двух торцов заходят друг в друга.' },
  { stage: 3, title: 'Стержень', text: 'Сверху через все петли опускают вертикальный арматурный стержень — он сцепляет панели.' },
  { stage: 4, title: 'Бетон', text: 'Шов заливают бетоном: петли и стержень оказываются внутри, узел становится монолитным.' },
];

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
    joint: {
      x: width / 2 + CORNER.jointWidth / 2,
      width: CORNER.jointWidth,
      depth: totalThickness,
      /** Panel A's end face and panel B's inner face. */
      startX: width / 2,
      endX: start,
      /** Loops and grout sit in the structural wythes, where the two panels bear on each other. */
      structuralZ: structural.centerZ,
      insulationZ: insulation.centerZ,
      facadeZ: facade.centerZ,
    },
  };
}

// Sleeves and the back box run through the inner structural wythe.
export const SERVICE_SLEEVES = [
  { id: 'power', x: -0.46, y: 0.34, tone: 'red' },
  { id: 'water', x: 0, y: 0.1, tone: 'blue' },
  { id: 'vent', x: 0.46, y: -0.14, tone: 'box' },
] as const;
export const SERVICE_BOX = { x: 0, y: -0.42, width: 0.42, height: 0.28, depth: 0.08 };
