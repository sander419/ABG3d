import React, { useMemo } from 'react';
import * as THREE from 'three';

interface PeikkoHardware3DProps {
  facadeZ: number;
  structuralZ: number;
  highlightedId: string | null;
  onSelect: (id: string) => void;
  clippingPlanes?: THREE.Plane[];
}

export const PeikkoHardware3D: React.FC<PeikkoHardware3DProps> = ({
  facadeZ,
  structuralZ,
  highlightedId,
  onSelect,
  clippingPlanes,
}) => {
  // Brushed stainless steel B600KX / Peikko PDM
  const isSelected = highlightedId === 'anchors';
  const activePlanes = clippingPlanes && clippingPlanes.length > 0 ? clippingPlanes : null;

  const steelMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isSelected ? '#18181B' : '#717682',
      roughness: 0.24,
      metalness: 0.92,
      clippingPlanes: activePlanes,
      clipShadows: true,
      side: THREE.DoubleSide,
    });
  }, [isSelected, activePlanes]);

  const boxMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#27272A',
      roughness: 0.38,
      metalness: 0.75,
      clippingPlanes: activePlanes,
      clipShadows: true,
      side: THREE.DoubleSide,
    });
  }, [activePlanes]);

  // 6 diagonal composite tie locations across the slab
  const tiePositions: [number, number][] = useMemo(
    () => [
      [-0.6, 0.7],
      [0.6, 0.7],
      [-0.6, 0.0],
      [0.6, 0.0],
      [-0.6, -0.7],
      [0.6, -0.7],
    ],
    []
  );

  const pvlYPositions = [-0.6, 0.0, 0.6];

  // Length bridging from structural layer to facade
  // Structural front face is at structuralZ + 0.06
  // Facade rear face is at facadeZ - 0.035
  const tieSpan = Math.max(0.22, (facadeZ - 0.035) - (structuralZ + 0.06));
  const tieCenterZ = ((facadeZ - 0.035) + (structuralZ + 0.06)) / 2;

  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect('anchors'); }}>
      {/* 1. Peikko PDM Composite Diagonal Ties */}
      {tiePositions.map(([x, y], idx) => {
        const angleZ = (idx % 2 === 0 ? 1 : -1) * 0.32;
        return (
          <group key={`pdm-${idx}`} position={[x, y, tieCenterZ]}>
            {/* Diagonal Rod 1 */}
            <mesh rotation={[angleZ, 0, 0]} material={steelMaterial}>
              <cylinderGeometry args={[0.007, 0.007, tieSpan, 12]} />
            </mesh>

            {/* Diagonal Rod 2 */}
            <mesh rotation={[-angleZ, 0, 0]} material={steelMaterial}>
              <cylinderGeometry args={[0.007, 0.007, tieSpan, 12]} />
            </mesh>

            {/* Front Anchor Pin inside Facade */}
            <mesh position={[0, 0, (facadeZ - tieCenterZ)]} rotation={[0, 0, Math.PI / 2]} material={steelMaterial}>
              <cylinderGeometry args={[0.01, 0.01, 0.08, 12]} />
            </mesh>

            {/* Rear Anchor Pin inside Structural */}
            <mesh position={[0, 0, (structuralZ - tieCenterZ)]} rotation={[0, 0, Math.PI / 2]} material={steelMaterial}>
              <cylinderGeometry args={[0.01, 0.01, 0.08, 12]} />
            </mesh>
          </group>
        );
      })}

      {/* 2. Peikko PVL Wire Loop Joint (firmly attached to structural concrete side) */}
      {pvlYPositions.map((y, idx) => (
        <group key={`pvl-${idx}`} position={[-1.005, y, structuralZ]}>
          <mesh position={[0.02, 0, 0]} material={boxMaterial}>
            <boxGeometry args={[0.035, 0.12, 0.07]} />
          </mesh>
          <mesh position={[-0.045, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={steelMaterial}>
            <torusGeometry args={[0.035, 0.006, 12, 24, Math.PI * 1.5]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
