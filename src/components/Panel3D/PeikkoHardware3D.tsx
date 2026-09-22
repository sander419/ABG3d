import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { PanelDemoVariant, WidgetViewMode } from '../../data/panelConfig';
import { Opening, SERVICE_SLEEVES, WINDOW_OPENINGS } from '../../lib/panelScenarios';

interface PeikkoHardware3DProps {
  facadeZ: number;
  structuralZ: number;
  highlightedId: string | null;
  onSelect: (id: string) => void;
  mode: WidgetViewMode;
  clippingPlanes?: THREE.Plane[];
  /** "Узлы" demo variant — this generic reinforcement diagram is otherwise blind to
   * it, so a window cutout, a service sleeve, or the corner joint can end up with a
   * rebar bar running straight through it. */
  demoVariant?: PanelDemoVariant;
}

/** True if a vertical bar at this x, spanning the full panel height, would pass through the opening. */
function crossesOpeningX(x: number, opening: Opening, margin: number): boolean {
  return Math.abs(x - opening.x) < opening.width / 2 + margin;
}

/** True if a horizontal bar at this y, spanning the full panel width, would pass through the opening. */
function crossesOpeningY(y: number, opening: Opening, margin: number): boolean {
  return Math.abs(y - opening.y) < opening.height / 2 + margin;
}

/** A rod between two points in the YZ plane. Three's cylinder axis is Y. */
const Rod = ({ x, y1, z1, y2, z2, radius, material, ribbed = false }: {
  x: number; y1: number; z1: number; y2: number; z2: number; radius: number; material: THREE.Material; ribbed?: boolean;
}) => {
  const dy = y2 - y1;
  const dz = z2 - z1;
  const length = Math.hypot(dy, dz);
  const ribCount = ribbed ? Math.max(0, Math.floor(length / 0.12) - 1) : 0;
  return <group position={[x, (y1 + y2) / 2, (z1 + z2) / 2]} rotation={[Math.atan2(dz, dy), 0, 0]}>
    <mesh material={material} castShadow><cylinderGeometry args={[radius, radius, length, 10]} /></mesh>
    {Array.from({ length: ribCount }, (_, index) => <mesh key={index} position={[0, -length / 2 + (index + 1) * 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} material={material} castShadow>
      <torusGeometry args={[radius * 1.13, radius * 0.14, 6, 10]} />
    </mesh>)}
  </group>;
};

/** A rod along the X axis. Mesh bars use the same ribbed finish in both directions. */
const HorizontalRod = ({ x1, x2, y, z, radius, material, ribbed = false }: {
  x1: number; x2: number; y: number; z: number; radius: number; material: THREE.Material; ribbed?: boolean;
}) => {
  const length = Math.abs(x2 - x1);
  const ribCount = ribbed ? Math.max(0, Math.floor(length / 0.12) - 1) : 0;
  return <group position={[(x1 + x2) / 2, y, z]} rotation={[0, 0, Math.PI / 2]}>
    <mesh material={material} castShadow><cylinderGeometry args={[radius, radius, length, 10]} /></mesh>
    {Array.from({ length: ribCount }, (_, index) => <mesh key={index} position={[0, -length / 2 + (index + 1) * 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} material={material} castShadow>
      <torusGeometry args={[radius * 1.13, radius * 0.14, 6, 10]} />
    </mesh>)}
  </group>;
};

/**
 * Generic, manufacturer-grounded sandwich-panel reinforcement diagram.
 * It visualises the Peikko PDM topology (two longitudinal flanges connected by
 * stainless diagonals) plus reinforcement meshes. Counts and exact spacing remain
 * deliberately non-project-specific until ABG supplies KЖ / IFC.
 */
export const PeikkoHardware3D: React.FC<PeikkoHardware3DProps> = ({
  facadeZ, structuralZ, highlightedId, onSelect, mode, clippingPlanes, demoVariant = 'standard',
}) => {
  const selected = highlightedId === 'anchors';
  const loopGeometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, -0.025), new THREE.Vector3(-0.065, 0, -0.025),
    new THREE.Vector3(-0.09, 0, 0), new THREE.Vector3(-0.065, 0, 0.025),
    new THREE.Vector3(0, 0, 0.025),
  ]), 24, 0.004, 8, false), []);
  useEffect(() => () => loopGeometry.dispose(), [loopGeometry]);
  const activePlanes = clippingPlanes?.length ? clippingPlanes : null;
  const structureMode = mode === 'structure';
  const steel = useMemo(() => new THREE.MeshStandardMaterial({
    color: selected ? '#E0BB50' : '#B6C2C6', roughness: 0.26, metalness: 0.88,
    envMapIntensity: 1.45, clippingPlanes: activePlanes, clipShadows: true,
  }), [selected, activePlanes]);
  const rebar = useMemo(() => new THREE.MeshStandardMaterial({
    color: selected ? '#F4DD45' : '#65747B', roughness: 0.48, metalness: 0.62,
    envMapIntensity: 1.15, clippingPlanes: activePlanes, clipShadows: true,
  }), [selected, activePlanes]);
  const box = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#242827', roughness: 0.55, metalness: 0.45, clippingPlanes: activePlanes, clipShadows: true,
  }), [activePlanes]);
  useEffect(() => () => { steel.dispose(); }, [steel]);
  useEffect(() => () => { rebar.dispose(); }, [rebar]);
  useEffect(() => () => { box.dispose(); }, [box]);

  // Bars are a visual mesh, not a reinforcement specification. They sit inside
  // the two concrete wythes and only surface in the dedicated structure mode.
  const allMeshXs = [-0.8, -0.4, 0, 0.4, 0.8];
  const allMeshYs = [-0.9, -0.45, 0, 0.45, 0.9];
  const outerRebarZ = facadeZ - 0.010;
  const innerRebarZ = structuralZ + 0.015;
  const frontFlangeZ = facadeZ + 0.010;
  const rearFlangeZ = structuralZ + 0.035;
  const allTrussXs = [-0.62, 0.62];
  const trussY = [-1.00, -0.68, -0.36, -0.04, 0.28, 0.60, 0.92];

  // A generic mesh grid otherwise has no idea a window cutout or a service sleeve
  // occupies part of the panel — left alone it draws a bar straight through the
  // glass, or a rebar rod straight through a factory sleeve. This diagram isn't a
  // reinforcement spec, so the honest move for these demo variants is to omit the
  // bar rather than invent how it would actually be routed around the obstruction.
  const barMargin = 0.05;
  const isWindows = demoVariant === 'windows';
  const isServices = demoVariant === 'services';
  const isCorner = demoVariant === 'corner';
  const meshXs = isWindows ? allMeshXs.filter((x) => !WINDOW_OPENINGS.some((o) => crossesOpeningX(x, o, barMargin))) : allMeshXs;
  const meshYs = isWindows ? allMeshYs.filter((y) => !WINDOW_OPENINGS.some((o) => crossesOpeningY(y, o, barMargin))) : allMeshYs;
  const structuralMeshXs = isServices
    ? meshXs.filter((x) => !SERVICE_SLEEVES.some((s) => Math.abs(x - s.x) < barMargin))
    : meshXs;
  const trussXs = isWindows ? allTrussXs.filter((x) => !WINDOW_OPENINGS.some((o) => crossesOpeningX(x, o, barMargin))) : allTrussXs;

  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect('anchors'); }} visible={structureMode || selected}>
      {/* A500C/Bp-I mesh representation in both concrete layers. The structural (inner)
          layer additionally routes around service sleeves in the "Коммуникации" variant. */}
      {[outerRebarZ, innerRebarZ].map((z, layer) => <group key={`mesh-${layer}`}>
        {(layer === 1 ? structuralMeshXs : meshXs).map((x) => <Rod key={`v-${layer}-${x}`} x={x} y1={-1.02} z1={z} y2={1.02} z2={z} radius={0.006} material={rebar} ribbed />)}
        {meshYs.map((y) => <HorizontalRod key={`h-${layer}-${y}`} x1={-0.925} x2={0.925} y={y} z={z - 0.012} radius={0.006} material={rebar} ribbed />)}
      </group>)}

      {/* PDM: two flanges along the panel height and a continuous stainless zig-zag through insulation. */}
      {trussXs.map((x) => <group key={`pdm-${x}`}>
        <Rod x={x} y1={-1.06} z1={frontFlangeZ} y2={1.06} z2={frontFlangeZ} radius={0.013} material={rebar} ribbed />
        <Rod x={x} y1={-1.06} z1={rearFlangeZ} y2={1.06} z2={rearFlangeZ} radius={0.013} material={rebar} ribbed />
        {trussY.slice(0, -1).map((y, index) => <React.Fragment key={`diag-${x}-${index}`}>
          <Rod x={x} y1={y} z1={index % 2 ? rearFlangeZ : frontFlangeZ} y2={trussY[index + 1]} z2={index % 2 ? frontFlangeZ : rearFlangeZ} radius={0.009} material={steel} />
        </React.Fragment>)}
      </group>)}

      {/* PVL loop boxes are placed on the vertical joint edge; loop pitch is illustrative.
          The "Угол" variant has a real joint on the OPPOSITE (right) edge, already drawn
          by CornerJoint at the correct location — showing this generic left-edge end
          condition too would put unconnected hardware over empty space. */}
      {!isCorner && [-0.68, 0, 0.68].map((y) => <group key={`pvl-${y}`} position={[-1.005, y, structuralZ + 0.035]}>
        <mesh material={box}><boxGeometry args={[0.05, 0.13, 0.07]} /></mesh>
        <mesh geometry={loopGeometry} material={steel} castShadow />
      </group>)}
    </group>
  );
};
