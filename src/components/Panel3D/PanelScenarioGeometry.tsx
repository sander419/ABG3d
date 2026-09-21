import React from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { PanelDemoVariant } from '../../data/panelConfig';
import { PANEL_GEOMETRY } from '../../lib/panelGeometry';
import { CORNER, LayerId, Opening, SERVICE_BOX, SERVICE_SLEEVES, WINDOW_OPENINGS, cornerLayout } from '../../lib/panelScenarios';

const frameMaterial = new THREE.MeshStandardMaterial({ color: '#242522', roughness: 0.28, metalness: 0.58 });
const glassMaterial = new THREE.MeshPhysicalMaterial({ color: '#32454B', roughness: 0.12, metalness: 0.18, transmission: 0.08, transparent: true, opacity: 0.9 });
const serviceMaterials = {
  red: new THREE.MeshStandardMaterial({ color: '#A94A40', roughness: 0.38, metalness: 0.15 }),
  blue: new THREE.MeshStandardMaterial({ color: '#4E7898', roughness: 0.38, metalness: 0.15 }),
  box: new THREE.MeshStandardMaterial({ color: '#8E816D', roughness: 0.58, metalness: 0.35 }),
};
const jointGrout = new THREE.MeshStandardMaterial({ color: '#A59D8F', roughness: 0.96 });
const pvlBoxMaterial = new THREE.MeshStandardMaterial({ color: '#8E816D', roughness: 0.58, metalness: 0.35 });

const scenarioMaterials: THREE.Material[] = [frameMaterial, glassMaterial, ...Object.values(serviceMaterials), jointGrout, pvlBoxMaterial];

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
}

/**
 * Parts that belong to one layer. They render inside that layer's group, so they
 * follow it through the exploded/structure/thermal offsets.
 */
export const ScenarioLayerExtras: React.FC<ScenarioLayerExtrasProps> = ({ variant, layer, material, layerCenterZ, onSelect }) => {
  const { height, insulation, structural } = PANEL_GEOMETRY;

  if (variant === 'windows' && layer === 'insulation') {
    // Frame sits in the outer part of the insulation, glass in the middle of the opening.
    const depth = 0.07;
    return <group position={[0, 0, insulation.thickness / 2 - depth / 2 - 0.01]}>
      {WINDOW_OPENINGS.map((opening) => <WindowUnit key={opening.id} opening={opening} depth={depth} />)}
    </group>;
  }

  if (variant === 'corner') {
    const layout = cornerLayout();
    const { x, thickness } = layout.layers[layer];
    return <RoundedBox
      args={[thickness, height, layout.length]}
      position={[x, 0, layout.centerZ - layerCenterZ]}
      radius={0.003}
      smoothness={4}
      material={material}
      castShadow
      receiveShadow
      onClick={onSelect ? (event) => { event.stopPropagation(); onSelect(layer); } : undefined}
    />;
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

/** Grouted vertical joint between the two corner panels, with the continuous bar and PVL boxes. */
export const CornerJoint: React.FC = () => {
  const { height } = PANEL_GEOMETRY;
  const { joint } = cornerLayout();
  return <group position={[joint.x, 0, 0]}>
    <mesh material={jointGrout} castShadow receiveShadow><boxGeometry args={[joint.width, height, joint.depth]} /></mesh>
    <mesh material={frameMaterial} castShadow><cylinderGeometry args={[0.012, 0.012, height + 0.1, 12]} /></mesh>
    {[-0.68, 0, 0.68].map((y) => <mesh key={y} position={[0, y, joint.depth / 2 + 0.001]} material={pvlBoxMaterial}><boxGeometry args={[CORNER.jointWidth * 0.8, 0.12, 0.012]} /></mesh>)}
  </group>;
};
