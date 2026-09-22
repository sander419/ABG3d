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
 * Outside corner of two IDENTICAL sandwich panels (B is A mirrored across the 45°
 * corner plane). Each panel's corner end is stepped: the 120 mm inner wythes stop
 * short of the corner and leave a square grout pocket at the inner corner; the
 * insulation and the facade wythe run on and meet the other panel on a 45° mitre.
 *
 * Connection per Peikko PVL: loops cast in boxes on both inner-wythe end faces are
 * folded out into the pocket after erection, overlap, a vertical bar goes through
 * all of them, the pocket is grouted (PVL technical manual 02/2020; Terwa loop box
 * "corner joint"). Loop pitch, protrusion and bar size are illustrative.
 *
 * Panel-local frame: length along x (corner end at +x), thickness along z
 * (room face at -T/2, facade face at +T/2), origin at the panel centre.
 */
export const CORNER = {
  /** A's facade reaches the outer corner here — the panel keeps its 2.0 m width. */
  outerX: PANEL_GEOMETRY.width / 2,
};

export const CORNER_PVL = {
  loopYs: [-0.84, -0.42, 0, 0.42, 0.84],
  protrusion: 0.088,
  loopHalfWidth: 0.03,
  /** Peikko: loops of the two panels lie on top of each other, max 20 mm apart. */
  pairOffsetY: 0.018,
  /** Step 1: panel B is lowered by crane from this height. */
  liftHeight: 1.9,
  /**
   * Walls and grout are shown in a horizontal section just above the top loop (like the
   * plan drawings in the Peikko manual) — otherwise the pocket is buried inside the wall.
   */
  sectionY: 0.91,
};

export type CornerStage = 1 | 2 | 3 | 4;

export const CORNER_STAGES: readonly { stage: CornerStage; title: string; text: string }[] = [
  { stage: 1, title: 'Монтаж', text: 'Вторую панель краном опускают на место. Петли пока сложены в коробках в торцах несущих слоёв.' },
  { stage: 2, title: 'Петли', text: 'Петли отгибают из коробок: из обоих торцов они заходят в угловой карман и ложатся одна над другой.' },
  { stage: 3, title: 'Стержень', text: 'Сверху через все петли опускают вертикальный арматурный стержень — он сцепляет две панели.' },
  { stage: 4, title: 'Бетон', text: 'Карман заливают безусадочным бетоном: петли и стержень внутри, угол монолитный. Снаружи шов герметизируют.' },
];

/** Where the corner end of a layer stops, at thickness position z (panel-local). */
export function cornerEndX(layer: LayerId, z: number): number {
  const { totalThickness } = PANEL_GEOMETRY;
  // Inner wythe: stops one full wall thickness short of the outer corner.
  if (layer === 'structural') return CORNER.outerX - totalThickness;
  // Insulation and facade: 45° mitre through the outer corner.
  return CORNER.outerX + (z - totalThickness / 2);
}

/** Plan outline (x, z) of a layer slice between z0 and z1, corner end at +x. */
export function cornerLayerOutline(layer: LayerId, z0: number, z1: number): [number, number][] {
  const start = -PANEL_GEOMETRY.width / 2;
  return [[start, z0], [cornerEndX(layer, z0), z0], [cornerEndX(layer, z1), z1], [start, z1]];
}

/** Panel B = panel A mirrored in x, turned +90° about Y, then offset. Maps A-local (x, z) to world (X, Z). */
export const CORNER_PANEL_B = {
  position: [CORNER.outerX - PANEL_GEOMETRY.totalThickness / 2, 0, PANEL_GEOMETRY.totalThickness / 2 - CORNER.outerX] as [number, number, number],
  rotationY: Math.PI / 2,
  mirrorX: -1,
};

export function panelBToWorld(x: number, z: number): [number, number] {
  // mirror (-x, z), rotate +90° about Y: (x, z) -> (z, -x), then offset
  const [ox, , oz] = CORNER_PANEL_B.position;
  return [z + ox, x + oz];
}

/** The grout pocket: a square between the two inner-wythe ends, at the inner corner. */
export function cornerPocket() {
  const { structural, totalThickness } = PANEL_GEOMETRY;
  const size = structural.thickness;
  return {
    x: CORNER.outerX - totalThickness + size / 2,
    z: structural.centerZ,
    size,
    /** A's inner-wythe end face (loops point +x from here, panel-local). */
    faceX: CORNER.outerX - totalThickness,
  };
}

// Sleeves and the back box run through the inner structural wythe.
export const SERVICE_SLEEVES = [
  { id: 'power', x: -0.46, y: 0.34, tone: 'red' },
  { id: 'water', x: 0, y: 0.1, tone: 'blue' },
  { id: 'vent', x: 0.46, y: -0.14, tone: 'box' },
] as const;
export const SERVICE_BOX = { x: 0, y: -0.42, width: 0.42, height: 0.28, depth: 0.08 };
