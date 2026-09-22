import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { easing } from 'maath';
import { PanelDemoVariant } from '../../data/panelConfig';
import { PANEL_GEOMETRY } from '../../lib/panelGeometry';
import { CORNER, CORNER_PANEL_B, CORNER_PVL, CornerStage, LayerId, Opening, SERVICE_BOX, SERVICE_SLEEVES, WINDOW_OPENINGS, cornerPocket } from '../../lib/panelScenarios';
import { CornerEndSlab } from './PerforatedSlab';

// side: DoubleSide on every scenario material — the cross-section tool clips these
// meshes too (see syncScenarioClipping below), and a clipped FrontSide mesh shows a
// hollow, see-through cut instead of a solid face at the cut plane.
const frameMaterial = new THREE.MeshStandardMaterial({ color: '#242522', roughness: 0.28, metalness: 0.58, side: THREE.DoubleSide });
const glassMaterial = new THREE.MeshPhysicalMaterial({ color: '#32454B', roughness: 0.12, metalness: 0.18, transmission: 0.08, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
const serviceMaterials = {
  red: new THREE.MeshStandardMaterial({ color: '#A94A40', roughness: 0.38, metalness: 0.15, side: THREE.DoubleSide }),
  blue: new THREE.MeshStandardMaterial({ color: '#4E7898', roughness: 0.38, metalness: 0.15, side: THREE.DoubleSide }),
  box: new THREE.MeshStandardMaterial({ color: '#8E816D', roughness: 0.58, metalness: 0.35, side: THREE.DoubleSide }),
};
// Fresh grout reads darker and warmer than the cured precast faces around it.
const jointGrout = new THREE.MeshStandardMaterial({ color: '#8F877A', roughness: 0.98, side: THREE.DoubleSide });
// Loops carry a faint glow so they stay readable inside the dark joint.
const loopMaterial = new THREE.MeshStandardMaterial({ color: '#E4E8EA', emissive: '#5E6A70', emissiveIntensity: 0.35, roughness: 0.22, metalness: 0.85, side: THREE.DoubleSide });
const rodMaterial = new THREE.MeshStandardMaterial({ color: '#B8782E', roughness: 0.42, metalness: 0.7, side: THREE.DoubleSide });
const pocketMaterial = new THREE.MeshStandardMaterial({ color: '#2B2C2A', roughness: 0.7, metalness: 0.3, side: THREE.DoubleSide });
const sealantMaterial = new THREE.MeshStandardMaterial({ color: '#3A3B39', roughness: 0.5, side: THREE.DoubleSide });

// Section fill where the walls are cut in the corner demo: plan-drawing colours,
// insulation in the orange ABG uses on its own panel diagram.
export const sectionCapMaterials: Record<LayerId, THREE.Material> = {
  facade: new THREE.MeshStandardMaterial({ color: '#CFCAC0', roughness: 0.9, side: THREE.DoubleSide }),
  insulation: new THREE.MeshStandardMaterial({ color: '#E0A866', roughness: 0.95, side: THREE.DoubleSide }),
  structural: new THREE.MeshStandardMaterial({ color: '#A9A398', roughness: 0.9, side: THREE.DoubleSide }),
};

const scenarioMaterials: THREE.Material[] = [
  ...Object.values(sectionCapMaterials),
  frameMaterial, glassMaterial, ...Object.values(serviceMaterials),
  jointGrout, loopMaterial, rodMaterial, pocketMaterial, sealantMaterial,
];

/** Keeps the module-level demo materials inside the cross-section tool's clipping. */
export function syncScenarioClipping(planes: THREE.Plane[] | null, sectionPlanes: THREE.Plane[] | null = planes, jointClosed = false) {
  // PVL boxes are cast into the concrete, so they follow the wall section. Loops and
  // the bar stay whole while they are being placed (they read above the cut); once the
  // joint is grouted they are inside the concrete and are cut with it.
  const sectioned = new Set<THREE.Material>(jointClosed ? [pocketMaterial, loopMaterial, rodMaterial] : [pocketMaterial]);
  sectioned.forEach((material) => {
    material.clippingPlanes = sectionPlanes;
    material.clipShadows = true;
    material.needsUpdate = true;
  });
  scenarioMaterials.filter((material) => !sectioned.has(material)).forEach((material) => {
    material.clippingPlanes = planes;
    material.clipShadows = true;
    material.needsUpdate = true;
  });
}

function WindowUnit({ opening, depth }: { opening: Opening; depth: number }) {
  const { width, height } = opening;
  const bar = 0.035;
  return <group position={[opening.x, opening.y, 0]}>
    <mesh material={glassMaterial}><boxGeometry args={[width - 2 * bar, height - 2 * bar, 0.012]} /></mesh>
    <mesh position={[0, height / 2 - bar / 2, 0]} material={frameMaterial}><boxGeometry args={[width, bar, depth]} /></mesh>
    <mesh position={[0, -height / 2 + bar / 2, 0]} material={frameMaterial}><boxGeometry args={[width, bar, depth]} /></mesh>
    <mesh position={[-width / 2 + bar / 2, 0, 0]} material={frameMaterial}><boxGeometry args={[bar, height - 2 * bar, depth]} /></mesh>
    <mesh position={[width / 2 - bar / 2, 0, 0]} material={frameMaterial}><boxGeometry args={[bar, height - 2 * bar, depth]} /></mesh>
    <mesh position={[0, 0, 0]} material={frameMaterial}><boxGeometry args={[bar * 0.7, height - 2 * bar, depth * 0.8]} /></mesh>
  </group>;
}

interface ScenarioLayerExtrasProps {
  variant: PanelDemoVariant;
  layer: LayerId;
  /** The layer's material and its rest-position centre, for parts that continue the layer. */
  material: THREE.Material;
  layerCenterZ: number;
  onSelect?: (id: LayerId) => void;
}

/**
 * Parts that belong to one layer. They render inside that layer's group, so they
 * follow it through the exploded/structure/thermal offsets.
 */
export const ScenarioLayerExtras: React.FC<ScenarioLayerExtrasProps> = ({ variant, layer }) => {
  const { height, structural } = PANEL_GEOMETRY;

  if (variant === 'windows' && layer === 'facade') {
    // Rendered inside the facade's own group (not insulation's) so the frame/glass
    // ride the SAME animated Z as the punched hole in the facade slab. Parenting it
    // to insulation instead used to leave the frame behind while the facade (and its
    // cut opening) explode away in "Разобран"/"Тепло", stranding an empty hole.
    const depth = 0.05;
    return <group>
      {WINDOW_OPENINGS.map((opening) => <WindowUnit key={opening.id} opening={opening} depth={depth} />)}
    </group>;
  }

  if (variant === 'services' && layer === 'structural') {
    // Sleeves pass through the whole inner wythe; the back box is set flush with its face.
    const face = structural.thickness / 2;
    return <group>
      {SERVICE_SLEEVES.map((sleeve) => <group key={sleeve.id} position={[sleeve.x, sleeve.y, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={serviceMaterials[sleeve.tone]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, structural.thickness + 0.006, 20]} />
        </mesh>
        <mesh position={[0, 0, face + 0.002]} material={serviceMaterials.box} castShadow><torusGeometry args={[0.05, 0.008, 8, 20]} /></mesh>
      </group>)}
      <mesh position={[SERVICE_BOX.x, SERVICE_BOX.y, face - SERVICE_BOX.depth / 2 + 0.004]} material={serviceMaterials.box} castShadow>
        <boxGeometry args={[SERVICE_BOX.width, SERVICE_BOX.height, SERVICE_BOX.depth]} />
      </mesh>
      <mesh position={[SERVICE_BOX.x, SERVICE_BOX.y, face + 0.006]} material={frameMaterial}><boxGeometry args={[0.18, 0.04, 0.01]} /></mesh>
    </group>;
  }

  return null;
};

/** U-shaped wire loop lying in the XZ plane, protruding along +x from its box on the end face (x = 0). */
function useLoopGeometry() {
  const geometry = useMemo(() => {
    const { protrusion: L, loopHalfWidth: w } = CORNER_PVL;
    const anchor = -0.05; // legs continue into the wythe, as a cast-in loop does
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(anchor, 0, -w),
      new THREE.Vector3(L - w, 0, -w),
      new THREE.Vector3(L - w * 0.3, 0, -w * 0.72),
      new THREE.Vector3(L, 0, 0),
      new THREE.Vector3(L - w * 0.3, 0, w * 0.72),
      new THREE.Vector3(L - w, 0, w),
      new THREE.Vector3(anchor, 0, w),
    ]);
    return new THREE.TubeGeometry(curve, 48, 0.006, 10, false);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/**
 * PVL boxes and wire loops on a panel's inner-wythe corner end, in that panel's
 * structural-layer frame (local z = 0 is the wythe centre). Until step 2 each loop
 * lies folded up inside its box; then it is bent out 90° into the grout pocket.
 * The same component is used for both panels — they are identical elements.
 */
export const CornerLoops: React.FC<{ stage: CornerStage; yOffset?: number }> = ({ stage, yOffset = 0 }) => {
  const loop = useLoopGeometry();
  const loopRefs = useRef<(THREE.Group | null)[]>([]);
  const { faceX } = cornerPocket();
  useFrame((_, delta) => {
    loopRefs.current.forEach((group) => {
      if (group) easing.damp(group.rotation, 'z', stage >= 2 ? 0 : Math.PI / 2, 0.45, delta);
    });
  });
  return <group position={[faceX, yOffset, 0]}>
    {CORNER_PVL.loopYs.map((y, index) => <group key={y} position={[0, y, 0]}>
      {/* Galvanised recess box cast flush into the end face (PVL box ≈ 160 × 50 × 22 mm) */}
      <mesh position={[-0.011, 0.045, 0]} material={pocketMaterial}><boxGeometry args={[0.022, 0.16, 0.05]} /></mesh>
      <group ref={(group) => { loopRefs.current[index] = group; }} rotation={[0, 0, Math.PI / 2]}>
        <mesh geometry={loop} material={loopMaterial} castShadow />
      </group>
    </group>)}
  </group>;
};

const ROD_PARKED_Y = 3.0;

/** Vertical bar and grout in the corner pocket, in panel A's structural-layer frame. */
export const CornerPocketFill: React.FC<{ stage: CornerStage }> = ({ stage }) => {
  const { height } = PANEL_GEOMETRY;
  const pocket = cornerPocket();
  // Grout rises up to the section plane, so its top face reads as grout in the cut.
  const groutHeight = height / 2 + CORNER_PVL.sectionY;
  const rodRef = useRef<THREE.Mesh>(null);
  const groutRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (rodRef.current) {
      easing.damp(rodRef.current.position, 'y', stage >= 3 ? 0.04 : ROD_PARKED_Y, 0.6, delta);
      rodRef.current.visible = stage >= 3 || rodRef.current.position.y < ROD_PARKED_Y - 0.05;
    }
    if (groutRef.current) {
      easing.damp(groutRef.current.scale, 'y', stage >= 4 ? 1 : 0.0001, 0.85, delta);
      groutRef.current.visible = groutRef.current.scale.y > 0.002;
    }
  });
  return <group>
    <mesh ref={rodRef} position={[pocket.x, ROD_PARKED_Y, 0]} material={rodMaterial} castShadow visible={false}>
      <cylinderGeometry args={[0.009, 0.009, height + 0.12, 14]} />
    </mesh>
    <group ref={groutRef} position={[pocket.x, -height / 2, 0]} scale={[1, 0.0001, 1]} visible={false}>
      <mesh position={[0, groutHeight / 2, 0]} material={jointGrout} castShadow receiveShadow>
        <boxGeometry args={[pocket.size - 0.002, groutHeight, pocket.size - 0.002]} />
      </mesh>
    </group>
  </group>;
};

/** Sealant along the 45° facade mitre at the outer corner, in panel A's facade-layer frame. */
export const CornerFacadeSeal: React.FC<{ stage: CornerStage }> = ({ stage }) => {
  const { facade, height } = PANEL_GEOMETRY;
  if (stage < 4) return null;
  return <mesh position={[CORNER.outerX - facade.thickness / 2, 0, 0]} rotation={[0, -Math.PI / 4, 0]} material={sealantMaterial}>
    <boxGeometry args={[facade.thickness * Math.SQRT2, height, 0.008]} />
  </mesh>;
};

/** A group whose z eases toward `targetZ` — the explode/structure/thermal offsets. */
const DampedLayer: React.FC<{ targetZ: number; visible?: boolean; children: React.ReactNode }> = ({ targetZ, visible = true, children }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) easing.damp(ref.current.position, 'z', targetZ, 0.38, delta);
  });
  return <group ref={ref} position={[0, 0, targetZ]} visible={visible}>{children}</group>;
};

interface CornerPanelBProps {
  stage: CornerStage;
  materials: { facade: THREE.Material; insulation: THREE.Material; thermal: THREE.Material; structural: THREE.Material };
  isThermal: boolean;
  hideInsulation: boolean;
  /** Walls shown in the horizontal section (fill the cut). */
  sectioned: boolean;
  /** Explode factor, only for the small split between the two insulation boards. */
  k: number;
  targets: { facade: number; insulation: number; structural: number };
  onSelect: (id: LayerId) => void;
  /** Reinforcement diagram for this panel, rendered in its own frame. */
  hardware?: React.ReactNode;
}

/**
 * The second corner panel: exactly the same element as panel A (same layers, same
 * stepped corner end, same PVL boxes), mirrored across the 45° corner plane.
 * In step 1 it is lowered into place from above, as it is by crane on site.
 */
export const CornerPanelB: React.FC<CornerPanelBProps> = ({ stage, materials, isThermal, hideInsulation, sectioned, k, targets, onSelect, hardware }) => {
  const { facade, insulation, structural } = PANEL_GEOMETRY;
  const liftRef = useRef<THREE.Group>(null);
  useEffect(() => {
    if (stage === 1 && liftRef.current) liftRef.current.position.y = CORNER_PVL.liftHeight;
  }, [stage]);
  useFrame((_, delta) => {
    if (liftRef.current) easing.damp(liftRef.current.position, 'y', 0, 0.7, delta);
  });
  const cut = (layer: LayerId) => (sectioned ? { y: CORNER_PVL.sectionY, material: sectionCapMaterials[layer] } : undefined);
  const select = (id: LayerId) => (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(id);
  };
  return <group ref={liftRef}>
    <group position={CORNER_PANEL_B.position} rotation={[0, CORNER_PANEL_B.rotationY, 0]}>
      <group scale={[CORNER_PANEL_B.mirrorX, 1, 1]}>
        <DampedLayer targetZ={targets.facade}>
          <CornerEndSlab layer="facade" depth={facade.thickness} panelCenterZ={facade.centerZ} material={materials.facade} onClick={select('facade')} section={cut('facade')} />
        </DampedLayer>
        <DampedLayer targetZ={targets.insulation} visible={!hideInsulation}>
          {isThermal
            ? <CornerEndSlab layer="insulation" depth={insulation.thickness} panelCenterZ={insulation.centerZ} material={materials.thermal} onClick={select('insulation')} section={cut('insulation')} />
            : [-1, 1].map((side) => <CornerEndSlab
                key={side}
                layer="insulation"
                depth={insulation.thickness / 2}
                panelCenterZ={insulation.centerZ + side * insulation.thickness / 4}
                position={[0, 0, side * (insulation.thickness / 4 + 0.003 * k)]}
                material={materials.insulation}
                onClick={select('insulation')}
                section={cut('insulation')}
              />)}
        </DampedLayer>
        <DampedLayer targetZ={targets.structural}>
          <CornerEndSlab layer="structural" depth={structural.thickness} panelCenterZ={structural.centerZ} material={materials.structural} onClick={select('structural')} section={cut('structural')} />
          <CornerLoops stage={stage} yOffset={CORNER_PVL.pairOffsetY} />
        </DampedLayer>
        {hardware}
      </group>
    </group>
  </group>;
};
