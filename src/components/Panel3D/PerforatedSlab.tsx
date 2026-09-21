import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { Opening } from '../../lib/panelScenarios';

// Extruded slab with rectangular holes: the opening is cut through the full layer
// thickness, unlike stacking boxes around a gap.
export function buildPerforatedGeometry(width: number, height: number, depth: number, openings: readonly Opening[], bevel = 0.003) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.closePath();
  openings.forEach((o) => {
    const hole = new THREE.Path();
    hole.moveTo(o.x - o.width / 2, o.y - o.height / 2);
    hole.lineTo(o.x + o.width / 2, o.y - o.height / 2);
    hole.lineTo(o.x + o.width / 2, o.y + o.height / 2);
    hole.lineTo(o.x - o.width / 2, o.y + o.height / 2);
    hole.closePath();
    shape.holes.push(hole);
  });
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 2,
    curveSegments: 1,
    steps: 1,
  });
  geometry.translate(0, 0, -(depth / 2 - bevel));
  // Front faces use the same 0..1 mapping as the plain layers; reveals and edges
  // are box-mapped at the same texel density (1 UV = panel width) so they don't streak.
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < position.count; i += 1) {
    const x = (position.getX(i) + width / 2) / width;
    const y = (position.getY(i) + height / 2) / width;
    const z = (position.getZ(i) + depth / 2) / width;
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    const nz = Math.abs(normal.getZ(i));
    if (nz >= nx && nz >= ny) uv.setXY(i, x, (position.getY(i) + height / 2) / height);
    else if (nx >= ny) uv.setXY(i, z, y);
    else uv.setXY(i, x, z);
  }
  uv.needsUpdate = true;
  return geometry;
}

interface PerforatedSlabProps {
  width: number;
  height: number;
  depth: number;
  openings: readonly Opening[];
  material: THREE.Material;
  position?: [number, number, number];
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}

export const PerforatedSlab: React.FC<PerforatedSlabProps> = ({ width, height, depth, openings, material, position, onClick }) => {
  const geometry = useMemo(() => buildPerforatedGeometry(width, height, depth, openings), [width, height, depth, openings]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} position={position} castShadow receiveShadow onClick={onClick} />;
};
