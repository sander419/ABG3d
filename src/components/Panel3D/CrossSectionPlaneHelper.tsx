import React, { useMemo } from 'react';
import * as THREE from 'three';

export type ClippingAxis = 'z' | 'x' | 'y';

interface CrossSectionPlaneHelperProps {
  axis: ClippingAxis;
  offset: number;
  visible: boolean;
}

export const CrossSectionPlaneHelper: React.FC<CrossSectionPlaneHelperProps> = ({
  axis,
  offset,
  visible,
}) => {
  if (!visible) return null;

  // Geometry dimensions and orientation depending on slice axis
  const config = useMemo(() => {
    switch (axis) {
      case 'z':
        return {
          args: [2.25, 2.65] as [number, number],
          position: [0, 0, offset] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          borderArgs: [2.25, 2.65, 0.001] as [number, number, number],
        };
      case 'x':
        return {
          args: [0.55, 2.65] as [number, number],
          position: [offset, 0, 0] as [number, number, number],
          rotation: [0, Math.PI / 2, 0] as [number, number, number],
          borderArgs: [0.55, 2.65, 0.001] as [number, number, number],
        };
      case 'y':
        return {
          args: [2.25, 0.55] as [number, number],
          position: [0, offset, 0] as [number, number, number],
          rotation: [Math.PI / 2, 0, 0] as [number, number, number],
          borderArgs: [2.25, 0.55, 0.001] as [number, number, number],
        };
    }
  }, [axis, offset]);

  return (
    <group position={config.position} rotation={config.rotation}>
      {/* Translucent cutting plane blade */}
      <mesh>
        <planeGeometry args={config.args} />
        <meshBasicMaterial
          color="#0EA5E9"
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Perimeter hairline glowing border */}
      <lineSegments>
        <edgesGeometry args={[useMemo(() => new THREE.BoxGeometry(...config.borderArgs), [config.borderArgs])]} />
        <lineBasicMaterial color="#38BDF8" transparent opacity={0.65} linewidth={1.5} />
      </lineSegments>

      {/* Subtle center crosshairs indicating cut origin */}
      <mesh scale={[0.08, 0.002, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh scale={[0.002, 0.08, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
