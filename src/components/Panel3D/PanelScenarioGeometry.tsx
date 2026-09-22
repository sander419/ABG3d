import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { easing } from 'maath';
import { PanelDemoVariant } from '../../data/panelConfig';
import { PANEL_GEOMETRY } from '../../lib/panelGeometry';
import { CORNER_PVL, CornerStage, LayerId, Opening, SERVICE_BOX, SERVICE_SLEEVES, WINDOW_OPENINGS, cornerLayout } from '../../lib/panelScenarios';

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
const jointInsulation = new THREE.MeshStandardMaterial({ color: '#C9C2B2', roughness: 0.96, side: THREE.DoubleSide });
const sealantMaterial = new THREE.MeshStandardMaterial({ color: '#3A3B39', roughness: 0.5, side: THREE.DoubleSide });

const scenarioMaterials: THREE.Material[] = [
  frameMaterial, glassMaterial, ...Object.values(serviceMaterials),
  jointGrout, loopMaterial, rodMaterial, pocketMaterial, jointInsulation, sealantMaterial,
];

/** Keeps the module-level demo materials inside the cross-section tool's clipping. */
export function syncScenarioClipping(planes: THREE.Plane[] | null) {
  scenarioMaterials.forEach((material) => {
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
  /** Corner step 1: panel B hangs this far out from the joint (see CornerJoint). */
  cornerSeparation?: number;
}

/**
 * Parts that belong to one layer. They render inside that layer's group, so they
 * follow it through the exploded/structure/thermal offsets.
 */
export const ScenarioLayerExtras: React.FC<ScenarioLayerExtrasProps> = ({ variant, layer, material, layerCenterZ, onSelect, cornerSeparation = 0 }) => {
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

  if (variant === 'corner') {
    const layout = cornerLayout();
    const { x, thickness } = layout.layers[layer];
    // The mesh keeps thickness on its own local z (args' 3rd slot), exactly like the
    // straight panel, and only the wrapping group turns it 90° so the wall runs into
    // the scene. This matters beyond looks: the thermal shader reads vObjectPosition.z
    // as the 0–200 mm insulation core, in the mesh's own local space, so if thickness
    // isn't on local z there the temperature gradient reads along the wrong axis.
    return <EasedGroupX targetX={cornerSeparation}>
      <group position={[x, 0, layout.centerZ - layerCenterZ]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox
          args={[layout.length, height, thickness]}
          radius={0.003}
          smoothness={4}
          material={material}
          castShadow
          receiveShadow
          onClick={onSelect ? (event) => { event.stopPropagation(); onSelect(layer); } : undefined}
        />
      </group>
    </EasedGroupX>;
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

/** Horizontal U-shaped wire loop in the XZ plane, protruding along +x from x = 0. */
function useLoopGeometry() {
  const geometry = useMemo(() => {
    const { protrusion: L, loopHalfWidth: w } = CORNER_PVL;
    const anchor = -0.035; // legs continue into the panel, as a cast-in loop does
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(anchor, 0, -w),
      new THREE.Vector3(L - w, 0, -w),
      new THREE.Vector3(L - w * 0.3, 0, -w * 0.72),
      new THREE.Vector3(L, 0, 0),
      new THREE.Vector3(L - w * 0.3, 0, w * 0.72),
      new THREE.Vector3(L - w, 0, w),
      new THREE.Vector3(anchor, 0, w),
    ]);
    return new THREE.TubeGeometry(curve, 48, 0.008, 10, false);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/** A group whose x eases toward `targetX` — used to lift panel B in and out. */
export const EasedGroupX: React.FC<{ baseX?: number; targetX: number; children: React.ReactNode }> = ({ baseX = 0, targetX, children }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) easing.damp(ref.current.position, 'x', baseX + targetX, 0.55, delta);
  });
  return <group ref={ref} position={[baseX + targetX, 0, 0]}>{children}</group>;
};

interface CornerJointProps {
  /** Current structural-layer explosion delta (targetStructuralZ - baseStructuralZ). */
  offsetZ?: number;
  stage: CornerStage;
}

const ROD_PARKED_Y = 3.0;

/**
 * The PVL corner joint as a four-step demonstration: loops in both panel edges,
 * panel B set against A so the loops overlap, the vertical bar dropped through the
 * overlap, then the joint grouted. Steps are driven from PanelScene.
 */
export const CornerJoint: React.FC<CornerJointProps> = ({ offsetZ = 0, stage }) => {
  const { height, structural, insulation } = PANEL_GEOMETRY;
  const { joint } = cornerLayout();
  const loop = useLoopGeometry();
  const rodRef = useRef<THREE.Mesh>(null);
  const groutRef = useRef<THREE.Group>(null);
  const rodLength = height + 0.16;

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

  return <group position={[0, 0, offsetZ]}>
    {/* Panel A: recessed loop pockets in the end face, loops pointing into the joint. */}
    {CORNER_PVL.loopYs.map((y) => <group key={`a-${y}`} position={[joint.startX, y, joint.structuralZ]}>
      <mesh position={[-0.012, 0, 0]} material={pocketMaterial}><boxGeometry args={[0.026, 0.12, 0.085]} /></mesh>
      <mesh geometry={loop} material={loopMaterial} castShadow />
    </group>)}

    {/* Panel B's loops travel with panel B, and sit slightly higher so the two loops stack. */}
    <EasedGroupX targetX={stage === 1 ? CORNER_PVL.separation : 0}>
      {CORNER_PVL.loopYs.map((y) => <group key={`b-${y}`} position={[joint.endX, y + 0.016, joint.structuralZ]} rotation={[0, Math.PI, 0]}>
        <mesh position={[-0.012, 0, 0]} material={pocketMaterial}><boxGeometry args={[0.026, 0.12, 0.085]} /></mesh>
        <mesh geometry={loop} material={loopMaterial} castShadow />
      </group>)}
    </EasedGroupX>

    {/* Vertical bar through every overlapping pair of loops. */}
    <mesh ref={rodRef} position={[joint.x, ROD_PARKED_Y, joint.structuralZ]} material={rodMaterial} castShadow visible={false}>
      <cylinderGeometry args={[0.011, 0.011, rodLength, 14]} />
    </mesh>

    {/* Grout rises from the bottom of the joint between the structural wythes. */}
    <group ref={groutRef} position={[joint.x, -height / 2, joint.structuralZ]} scale={[1, 0.0001, 1]} visible={false}>
      <mesh position={[0, height / 2, 0]} material={jointGrout} castShadow receiveShadow>
        <boxGeometry args={[joint.width, height, structural.thickness]} />
      </mesh>
    </group>

    {/* After grouting the rest of the joint is closed: insulation insert and outer sealant. */}
    {stage >= 4 && <>
      <mesh position={[joint.x, 0, joint.insulationZ]} material={jointInsulation}>
        <boxGeometry args={[joint.width, height, insulation.thickness]} />
      </mesh>
      <mesh position={[joint.x, 0, joint.facadeZ]} material={sealantMaterial}>
        <boxGeometry args={[joint.width, height, PANEL_GEOMETRY.facade.thickness]} />
      </mesh>
    </>}
  </group>;
};
