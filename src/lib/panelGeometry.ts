// Metres. The displayed sample dimensions are not a reinforcement specification.
const facadeThickness = 0.070;
const insulationThickness = 0.200;
const structuralThickness = 0.120;
const totalThickness = facadeThickness + insulationThickness + structuralThickness;

export const PANEL_GEOMETRY = {
  totalThickness,
  facade: { thickness: facadeThickness, centerZ: totalThickness / 2 - facadeThickness / 2 },
  insulation: { thickness: insulationThickness, centerZ: -totalThickness / 2 + structuralThickness + insulationThickness / 2 },
  structural: { thickness: structuralThickness, centerZ: -totalThickness / 2 + structuralThickness / 2 },
};
