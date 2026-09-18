import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import { easing } from 'maath';
import { WidgetViewMode, PANEL_CONFIG } from '../../data/panelConfig';
import {
  GeneratedTextures,
  useProgressiveProceduralTextures,
} from '../../utils/textureGenerator';
import { PeikkoHardware3D } from './PeikkoHardware3D';
import { SwissCallout } from './SwissCallout';
import { InvisibleHotspot, HotspotAnnotation } from './InvisibleHotspot';
import { createPIRShaderMaterial } from './PIRShaderMaterial';

interface PanelModelProps {
  mode: WidgetViewMode;
  scrubProgress?: number; // 0 to 1
  selectedId: string | null;
  onSelect: (id: string) => void;
  showDimensions: boolean;
  clippingPlanes?: THREE.Plane[];
}

export const PanelModel: React.FC<PanelModelProps> = ({
  mode,
  scrubProgress,
  selectedId,
  onSelect,
  showDimensions,
  clippingPlanes,
}) => {
  // Progressive loading strategy for procedural materials:
  // Starts with low-resolution blurred proxy (32px), background calculates full 512px maps.
  const { textures, stage } = useProgressiveProceduralTextures();

  // Active hotspot pop-up state
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);

  // Groups for physical damping via maath
  const facadeGroup = useRef<THREE.Group>(null);
  const pirGroup = useRef<THREE.Group>(null);
  const structuralGroup = useRef<THREE.Group>(null);
  const rootGroup = useRef<THREE.Group>(null);

  // Stored animated Z positions for Peikko ties
  const currentPos = useRef({
    facadeZ: 0.165,
    pirZ: 0.005,
    structuralZ: -0.155,
    facadeTargetZ: 0.165,
    pirTargetZ: 0.005,
    structuralTargetZ: -0.155,
    thermalLerp: 0,
  });

  // Layer dimensions in meters (W: 2.0m, H: 2.4m, D: 390mm)
  const W = 2.0;
  const H = 2.4;
  const dFacade = 0.07; // 70 mm
  const dPIR = 0.20;    // 200 mm
  const dStructural = 0.12; // 120 mm

  // Rondesignlab / Architectural Gallery:
  // Instead of an ambiguous flush 0-gap gray block, we employ a deliberate "slight Exploded View" (приоткрытая разборка)
  // baseline so that the warm architectural facade (70mm #EDEDE9), the warm sand PIR core (200mm #D4CEBE),
  // and the structural concrete (120mm #D6D3D1) are proudly separated and readable from the very first frame.
  const baseStructuralZ = -0.155;
  const basePIRZ = 0.005;
  const baseFacadeZ = 0.165;

  // Compute explosion factor k
  let k = 0;
  if (scrubProgress !== undefined) {
    k = scrubProgress;
  } else if (mode === 'exploded') {
    k = 1.0;
  } else if (mode === 'structure') {
    k = 0.55;
  }

  // Exact kinematic offsets with slight exploded baseline:
  // - Structural moves into depth: base - 0.14 * k
  // - PIR delays and shifts outward: base + 0.035 * k^1.2
  // - Facade moves forward: base + 0.16 * k^0.9
  const targetStructuralZ = baseStructuralZ - 0.14 * k;
  const targetPIRZ = basePIRZ + 0.035 * Math.pow(k, 1.2);
  const targetFacadeZ = baseFacadeZ + 0.16 * Math.pow(k, 0.9);

  // Materials with authentic precast textures and micro-relief.
  // 1. Facade Concrete: warm architectural concrete B35 (#EDEDE9, roughness 0.88)
  const isFacadeSelected = selectedId === 'facade';
  const facadeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: textures.concreteFacade,
      bumpMap: textures.concreteBump,
      bumpScale: 0.035,
      roughnessMap: textures.concreteRoughness,
      roughness: 0.88,
      metalness: 0.02,
      color: new THREE.Color('#EDEDE9'),
    });
  }, [textures]);

  // 2. PIR: Custom procedural closed-cell porosity ShaderMaterial with warm graphite/sandy tone (#D4CEBE)
  const isPirSelected = selectedId === 'insulation';
  const pirShaderMat = useMemo(() => createPIRShaderMaterial(), []);

  // 3. Structural Concrete: Smooth matte B30 precast concrete (#D6D3D1, roughness 0.86)
  const isStructuralSelected = selectedId === 'structural';
  const structuralMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: textures.concreteStructural,
      bumpMap: textures.structuralBump,
      bumpScale: 0.038,
      roughnessMap: textures.structuralRoughness,
      roughness: 0.86,
      metalness: 0.03,
      color: new THREE.Color('#D6D3D1'),
      emissive: new THREE.Color('#F59E0B'),
      emissiveIntensity: 0.0,
    });
  }, [textures]);

  // Dynamically synchronize clipping planes to materials with double-sided rendering
  useEffect(() => {
    const planes = clippingPlanes && clippingPlanes.length > 0 ? clippingPlanes : null;

    facadeMaterial.clippingPlanes = planes;
    facadeMaterial.clipShadows = true;
    facadeMaterial.side = THREE.DoubleSide;
    facadeMaterial.needsUpdate = true;

    structuralMaterial.clippingPlanes = planes;
    structuralMaterial.clipShadows = true;
    structuralMaterial.side = THREE.DoubleSide;
    structuralMaterial.needsUpdate = true;

    if (pirShaderMat) {
      pirShaderMat.clippingPlanes = planes;
      pirShaderMat.needsUpdate = true;
    }
  }, [clippingPlanes, facadeMaterial, structuralMaterial, pirShaderMat]);

  const isThermal = mode === 'thermal';

  // Zero-jank maath dampening inside useFrame
  useFrame((state, delta) => {
    // 1. Damp structural layer position
    if (structuralGroup.current) {
      easing.damp3(
        structuralGroup.current.position,
        [0, 0, targetStructuralZ],
        0.35,
        delta
      );
      currentPos.current.structuralZ = structuralGroup.current.position.z;
    }

    // 2. Damp PIR layer position with slight spring delay
    if (pirGroup.current) {
      easing.damp3(
        pirGroup.current.position,
        [0, 0, targetPIRZ],
        0.42,
        delta
      );
      currentPos.current.pirZ = pirGroup.current.position.z;
    }

    // 3. Damp Facade position
    if (facadeGroup.current) {
      easing.damp3(
        facadeGroup.current.position,
        [0, 0, targetFacadeZ],
        0.38,
        delta
      );
      currentPos.current.facadeZ = facadeGroup.current.position.z;
    }

    // 4. Smooth zero-jank material transitions without recreating shaders
    const targetFacadeColor = isThermal ? '#B6CEE8' : (isFacadeSelected ? '#FFFFFF' : '#EDEDE9');
    easing.dampC(facadeMaterial.color, targetFacadeColor, 0.25, delta);

    const targetStructuralColor = isThermal ? '#F9E5C5' : (isStructuralSelected ? '#FFFFFF' : '#D6D3D1');
    easing.dampC(structuralMaterial.color, targetStructuralColor, 0.25, delta);
    easing.damp(structuralMaterial, 'emissiveIntensity', isThermal ? 0.14 : 0.0, 0.25, delta);

    // Progressive bump scale interpolation: soft in blur stage, sharpens to full relief in ready stage
    const targetFacadeBump = stage === 'ready' ? 0.035 : 0.005;
    easing.damp(facadeMaterial, 'bumpScale', targetFacadeBump, 0.28, delta);

    const targetStructuralBump = stage === 'ready' ? 0.040 : 0.006;
    easing.damp(structuralMaterial, 'bumpScale', targetStructuralBump, 0.28, delta);

    // 5. Update procedural PIR closed-cell ShaderMaterial uniforms
    if (pirShaderMat && pirShaderMat.uniforms) {
      pirShaderMat.uniforms.uTime.value = state.clock.getElapsedTime();
      easing.damp(
        pirShaderMat.uniforms.uSelected,
        'value',
        isPirSelected ? 1.0 : 0.0,
        0.2,
        delta
      );
      easing.damp(
        pirShaderMat.uniforms.uThermal,
        'value',
        isThermal ? 1.0 : 0.0,
        0.25,
        delta
      );
      if (pirShaderMat.uniforms.uBlurProgress) {
        easing.damp(
          pirShaderMat.uniforms.uBlurProgress,
          'value',
          stage === 'ready' ? 0.0 : 1.0,
          0.32,
          delta
        );
      }
    }
  });

  const layerFacade = PANEL_CONFIG.layers[0];
  const layerPIR = PANEL_CONFIG.layers[1];
  const layerStructural = PANEL_CONFIG.layers[2];
  const layerAnchors = PANEL_CONFIG.layers[3];

  const showCallouts = k > 0.15 || mode === 'exploded' || mode === 'structure' || selectedId !== null;

  // Invisible Hotspots Engineering Annotations
  const hotspotAnnotations: Record<string, HotspotAnnotation> = {
    pdm: {
      id: 'anchors',
      tag: 'PEIKKO PDM',
      title: 'Связи Peikko PDM',
      spec: 'Нержавеющая сталь B600KX • Терморазрыв',
      note: 'Диагональные связи проходят сквозь 200 мм PIR-утеплителя, воспринимая вес фасадной плиты и ветровые нагрузки без создания мостиков холода.',
      details: [
        'Нулевой мостик холода через шов',
        'Коррозионная стойкость > 100 лет',
        'Заводской анкерный замок',
      ],
    },
    pir: {
      id: 'insulation',
      tag: 'PIR КОНТУР',
      title: 'PIR Утеплитель 200 мм',
      spec: 'λ = 0.022 Вт/(м·К) • Замкнутые ячейки',
      note: 'Бесшовный энергоэффективный сердечник с плотностью >32 кг/м³. Замкнутоячеистая структура исключает водопоглощение (<1%) и усадку со временем.',
      details: [
        'R₀ теплового контура: 9.2 (м²·°C)/Вт*',
        'Группа горючести Г1 (самозатухающий)',
        'Стабильность геометрии при морозе',
      ],
    },
    pvl: {
      id: 'anchors',
      tag: 'PEIKKO PVL',
      title: 'Тросовые петли PVL',
      spec: 'Закладные коробки на торцах',
      note: 'Гибкие стальные тросовые петли в защитных боксах. При монтаже петли связываются арматурным стержнем и замоноличиваются безусадочным бетоном.',
      details: [
        'Монолитный пространственный диск перекрытия',
        'Высокая сдвиговая прочность стыка',
        'Монтаж без сварки на объекте',
      ],
    },
    facade: {
      id: 'facade',
      tag: 'ФАСАД B35',
      title: 'Архитектурный бетон',
      spec: '70 мм • F300 / W8 • Теплый оттенок #EDEDE9',
      note: 'Наружный самонесущий слой заводского формования с прецизионными фасками 3 мм. Высокая морозостойкость и устойчивость к ультрафиолету.',
      details: [
        'Заводская геометрия с допуском ±1 мм',
        'Морозостойкость: более 300 циклов (F300)',
        'Натуральная текстура без окраски',
      ],
    },
  };

  return (
    <group ref={rootGroup}>
      {/* 1. FACADE CONCRETE (70 mm) with Beveled Edges.
          NOTE: drei's <RoundedBox> IS a mesh (it renders <mesh ...rest><extrudeGeometry/></mesh>).
          Wrapping it in another <mesh material={...}> put the material on an empty
          geometry-less mesh, so the layers silently fell back to R3F's default white
          MeshBasicMaterial (unlit). Material/props go directly on RoundedBox. */}
      <group ref={facadeGroup} position={[0, 0, baseFacadeZ]}>
        <RoundedBox
          args={[W, H, dFacade]}
          radius={0.003} // 3 mm bevel to catch highlights
          smoothness={4}
          material={facadeMaterial}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onSelect('facade');
          }}
        />

        {/* Swiss Callout for Facade */}
        {showCallouts && (
          <SwissCallout
            position={[-0.85, 0.75, dFacade / 2 + 0.002]}
            layer={layerFacade}
            direction="left"
            isActive={selectedId === 'facade'}
            onSelect={() => onSelect('facade')}
          />
        )}
      </group>

      {/* 2. PIR INSULATION (200 mm) with Micro-Fillet */}
      <group ref={pirGroup} position={[0, 0, basePIRZ]}>
        <RoundedBox
          args={[W, H, dPIR]}
          radius={0.002}
          smoothness={3}
          material={pirShaderMat}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onSelect('insulation');
          }}
        />

        {/* Swiss Callout for PIR */}
        {showCallouts && (
          <SwissCallout
            position={[0.7, 0.3, dPIR / 2 + 0.002]}
            layer={layerPIR}
            direction="right"
            isActive={selectedId === 'insulation'}
            onSelect={() => onSelect('insulation')}
          />
        )}
      </group>

      {/* 3. STRUCTURAL CONCRETE (120 mm) with Beveled Edges */}
      <group ref={structuralGroup} position={[0, 0, baseStructuralZ]}>
        <RoundedBox
          args={[W, H, dStructural]}
          radius={0.003}
          smoothness={4}
          material={structuralMaterial}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onSelect('structural');
          }}
        />

        {/* Swiss Callout for Structural */}
        {showCallouts && (
          <SwissCallout
            position={[0.7, -0.65, -dStructural / 2 - 0.002]}
            layer={layerStructural}
            direction="right"
            isActive={selectedId === 'structural'}
            onSelect={() => onSelect('structural')}
          />
        )}
      </group>

      {/* 4. PEIKKO HARDWARE (Stainless Ties & PVL loops) */}
      <PeikkoHardware3D
        facadeZ={currentPos.current.facadeZ}
        structuralZ={currentPos.current.structuralZ}
        highlightedId={selectedId}
        onSelect={onSelect}
        clippingPlanes={clippingPlanes}
      />

      {/* Swiss Callout for Peikko Hardware */}
      {showCallouts && (
        <group position={[-0.6, 0.0, (currentPos.current.facadeZ + currentPos.current.structuralZ) / 2]}>
          <SwissCallout
            position={[0, 0, 0]}
            layer={layerAnchors}
            direction="left"
            isActive={selectedId === 'anchors'}
            onSelect={() => onSelect('anchors')}
          />
        </group>
      )}

      {/* 5. INVISIBLE UI HOTSPOTS (Discreet Pulsing Micro-Rings) */}
      {/* Hotspot 1: Peikko PDM Diagonal Truss Tie */}
      <InvisibleHotspot
        position={[-0.6, 0.7, (currentPos.current.facadeZ + currentPos.current.structuralZ) / 2]}
        data={hotspotAnnotations.pdm}
        isSelected={activeHotspotId === 'pdm' || selectedId === 'anchors'}
        onSelect={() => {
          setActiveHotspotId('pdm');
          onSelect('anchors');
        }}
        onClose={() => setActiveHotspotId(null)}
      />

      {/* Hotspot 2: PIR Closed-Cell Insulation Core */}
      <InvisibleHotspot
        position={[0.45, -0.2, currentPos.current.pirZ + dPIR / 2 + 0.005]}
        data={hotspotAnnotations.pir}
        isSelected={activeHotspotId === 'pir' || selectedId === 'insulation'}
        onSelect={() => {
          setActiveHotspotId('pir');
          onSelect('insulation');
        }}
        onClose={() => setActiveHotspotId(null)}
      />

      {/* Hotspot 3: Peikko PVL Wire Loops (Recessed end box) */}
      <InvisibleHotspot
        position={[-1.02, 0.0, currentPos.current.structuralZ]}
        data={hotspotAnnotations.pvl}
        isSelected={activeHotspotId === 'pvl'}
        onSelect={() => {
          setActiveHotspotId('pvl');
          onSelect('anchors');
        }}
        onClose={() => setActiveHotspotId(null)}
      />

      {/* 6. MINIMALIST HAIRLINE DIMENSION TICKS (When Assembled) */}
      {showDimensions && k < 0.15 && !isThermal && (
        <group position={[1.12, -1.2, 0]}>
          <Html center distanceFactor={4.5} className="pointer-events-none select-none">
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#71717A] tracking-wider whitespace-nowrap bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-black/5 shadow-sm">
              <span className="text-[10px] uppercase text-[#A1A1AA]">Контур:</span>
              <span className="font-semibold text-[#18181B]">390 мм</span>
              <span className="text-[9px] text-[#A1A1AA]">(70 + 200 + 120)*</span>
            </div>
          </Html>
        </group>
      )}

      {/* 6. THERMAL RESTRAINED INFOGRAPHIC */}
      {isThermal && (
        <group>
          {/* Outdoor Frost Tag - attached to top-left of the Facade layer */}
          <group position={[-0.65, 1.28, currentPos.current.facadeZ + dFacade / 2]}>
            <Html center distanceFactor={4.8} className="pointer-events-none select-none">
              <div className="flex items-center gap-2 font-mono text-xs text-[#18181B] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/10 shadow-[0_4px_16px_rgba(0,0,0,0.06)] whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6] ring-2 ring-[#93C5FD]/60" />
                <span className="text-[#71717A] text-[10px] uppercase tracking-wider">Снаружи:</span>
                <span className="font-semibold text-[#1D4ED8]">-20 °C</span>
              </div>
            </Html>
          </group>

          {/* PIR Zero Isotherm Tag - attached to top-center of the PIR foam core */}
          <group position={[0.0, 1.34, currentPos.current.pirZ]}>
            <Html center distanceFactor={4.8} className="pointer-events-none select-none">
              <div className="flex items-center gap-2 font-mono text-xs text-[#18181B] bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-black/10 shadow-[0_4px_16px_rgba(0,0,0,0.06)] whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-[#A7F3D0]/60" />
                <span className="text-[#71717A] text-[10px] uppercase tracking-wider">Точка 0 °C:</span>
                <span className="font-medium text-[#047857]">Внутри PIR</span>
              </div>
            </Html>
          </group>

          {/* Indoor Room Warmth Tag - attached to top-right of the Structural inner layer */}
          <group position={[0.65, 1.28, currentPos.current.structuralZ - dStructural / 2]}>
            <Html center distanceFactor={4.8} className="pointer-events-none select-none">
              <div className="flex items-center gap-2 font-mono text-xs text-[#18181B] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/10 shadow-[0_4px_16px_rgba(0,0,0,0.06)] whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] ring-2 ring-[#FDE68A]/60 animate-pulse" />
                <span className="text-[#71717A] text-[10px] uppercase tracking-wider">Интерьер:</span>
                <span className="font-semibold text-[#B45309]">+22 °C</span>
              </div>
            </Html>
          </group>
        </group>
      )}
    </group>
  );
};
