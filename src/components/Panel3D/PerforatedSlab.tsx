import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { cornerLayerOutline, type LayerId, type Opening } from '../../lib/panelScenarios';
import { PANEL_GEOMETRY } from '../../lib/panelGeometry';

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

/**
 * A layer whose corner end is stepped/mitred (see cornerLayerOutline), extruded to
 * full height. Local z is centred on `panelCenterZ`, so a slab of the insulation
 * still spans z = ±thickness/2 — the thermal shader reads exactly that axis.
 */
export function buildCornerEndGeometry(layer: LayerId, depth: number, panelCenterZ: number, height: number, width: number) {
  const z0 = panelCenterZ - depth / 2;
  const z1 = panelCenterZ + depth / 2;
  const outline = cornerLayerOutline(layer, z0, z1);
  // Shape space (sx, sy) = (x, panelCenterZ - z): after rotateX(-90°) sy becomes -z.
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, panelCenterZ - z)));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, steps: 1 });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -height / 2, 0);
  geometry.computeVertexNormals();
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < position.count; i += 1) {
    const x = (position.getX(i) + width / 2) / width;
    const y = (position.getY(i) + height / 2) / height;
    const z = (position.getZ(i) + depth / 2) / width;
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    const nz = Math.abs(normal.getZ(i));
    if (nz >= nx && nz >= ny) uv.setXY(i, x, y);
    else if (ny >= nx) uv.setXY(i, x, z);
    else uv.setXY(i, z, y);
  }
  uv.needsUpdate = true;
  return geometry;
}

/** Flat section cap for a corner-end layer: its plan outline, lying horizontally (local z centred). */
export function buildCornerCapGeometry(layer: LayerId, depth: number, panelCenterZ: number) {
  const outline = cornerLayerOutline(layer, panelCenterZ - depth / 2, panelCenterZ + depth / 2);
  const geometry = new THREE.ShapeGeometry(new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, panelCenterZ - z))));
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

interface CornerEndSlabProps {
  layer: LayerId;
  depth: number;
  panelCenterZ: number;
  material: THREE.Material;
  position?: [number, number, number];
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  /** When the walls are shown in a horizontal section, fill the cut with this material at `section.y`. */
  section?: { y: number; material: THREE.Material };
}

export const CornerEndSlab: React.FC<CornerEndSlabProps> = ({ layer, depth, panelCenterZ, material, position, onClick, section }) => {
  const geometry = useMemo(
    () => buildCornerEndGeometry(layer, depth, panelCenterZ, PANEL_GEOMETRY.height, PANEL_GEOMETRY.width),
    [layer, depth, panelCenterZ],
  );
  const cap = useMemo(() => buildCornerCapGeometry(layer, depth, panelCenterZ), [layer, depth, panelCenterZ]);
  useEffect(() => () => { geometry.dispose(); cap.dispose(); }, [geometry, cap]);
  return <group position={position}>
    <mesh geometry={geometry} material={material} castShadow receiveShadow onClick={onClick} />
    {section && <mesh geometry={cap} material={section.material} position={[0, section.y - 0.0005, 0]} onClick={onClick} />}
  </group>;
};

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
