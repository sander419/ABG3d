import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import { easing } from 'maath';
import { WidgetViewMode, PANEL_CONFIG } from '../../data/panelConfig';
import {
  GeneratedTextures,
  useProgressiveProceduralTextures,
} from '../../utils/textureGenerator';
import { PeikkoHardware3D } from './PeikkoHardware3D';
import { SwissCallout } from './SwissCallout';
import { ThermalTag } from './ThermalTag';
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
  } else if (mode === 'thermal') {
    // Thermal mode used to render a fully assembled slab (k = 0): the PIR core that
    // carries the whole temperature gradient sat hidden behind the 70 mm facade, so
    // "ТЕПЛО" looked identical to "СБОРКА". A partial spread opens the 390 mm stack
    // wide enough to read the gradient, while the facade also goes translucent below.
    k = 0.45;
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
      bumpScale: 0.022,
      roughnessMap: textures.concreteRoughness,
      roughness: 0.88,
      metalness: 0.02,
      color: new THREE.Color('#EDEDE9'),
      // IBL from the in-code studio Environment; kept low so the precast face stays
      // matte instead of picking up a plastic sheen.
      envMapIntensity: 0.55,
      // Always transparent-capable: in "ТЕПЛО" the facade fades to ~0.28 opacity
      // (see useFrame) so the PIR gradient is visible through it.
      transparent: true,
      opacity: 1,
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
      bumpScale: 0.026,
      roughnessMap: textures.structuralRoughness,
      roughness: 0.86,
      metalness: 0.03,
      color: new THREE.Color('#D6D3D1'),
      emissive: new THREE.Color('#F59E0B'),
      emissiveIntensity: 0.0,
      envMapIntensity: 0.5,
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

  // Thermal tags are 3D-anchored HTML pills. On a wide desktop stage the 2 m slab
  // projects into a narrow strip, so the outer tags must sit further apart in model
  // space than on a phone, where the panel already fills the whole canvas width.
  const { size: viewportSize } = useThree();
  const thermalTagX = viewportSize.width < 640 ? 0.9 : 1.25;

  // Единая политика «один голос за раз» на узкой сцене (см. docs/layout-overlap-fixes.md):
  //  * < 1024 px поповер хотспота не рендерится — те же данные показывает LayerDetailCard;
  //  * при открытой панели «Сечение» на узкой сцене температурные теги скрываются
  //    ровно так же, как это уже делает SwissCallout для плашек слоёв: панель среза —
  //    фокусный режим, и её текст не должен пересекаться с аннотациями на канвасе.
  const compactStage = viewportSize.width < 1024;
  const [sectionFocusNarrow, setSectionFocusNarrow] = useState(false);
  useEffect(() => {
    const tick = () =>
      setSectionFocusNarrow(
        !!document.getElementById('cross-section-panel-dock') && viewportSize.width < 1280
      );
    tick();
    const id = window.setInterval(tick, 400);
    return () => window.clearInterval(id);
  }, [viewportSize.width]);

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
    }

    // 2. Damp PIR layer position with slight spring delay
    if (pirGroup.current) {
      easing.damp3(
        pirGroup.current.position,
        [0, 0, targetPIRZ],
        0.42,
        delta
      );
    }

    // 3. Damp Facade position
    if (facadeGroup.current) {
      easing.damp3(
        facadeGroup.current.position,
        [0, 0, targetFacadeZ],
        0.38,
        delta
      );
    }

    // 4. Smooth zero-jank material transitions without recreating shaders
    const targetFacadeColor = isThermal ? '#D3DEEA' : (isFacadeSelected ? '#FFFFFF' : '#EDEDE9');
    easing.dampC(facadeMaterial.color, targetFacadeColor, 0.25, delta);

    const targetStructuralColor = isThermal ? '#F9E5C5' : (isStructuralSelected ? '#FFFFFF' : '#D6D3D1');
    easing.dampC(structuralMaterial.color, targetStructuralColor, 0.25, delta);
    easing.damp(structuralMaterial, 'emissiveIntensity', isThermal ? 0.14 : 0.0, 0.25, delta);

    // 4b. Thermal mode: facade fades to a glass-like veil so the PIR temperature
    // field (the actual subject of the mode) is visible through it. Depth writes are
    // disabled while translucent, otherwise the box's back face would occlude the
    // insulation sitting right behind it.
    easing.damp(facadeMaterial, 'opacity', isThermal ? 0.3 : 1.0, 0.25, delta);
    facadeMaterial.depthWrite = !isThermal;

    // Progressive bump scale interpolation: soft in blur stage, sharpens to full relief in ready stage
    const targetFacadeBump = stage === 'ready' ? 0.022 : 0.004;
    easing.damp(facadeMaterial, 'bumpScale', targetFacadeBump, 0.28, delta);

    const targetStructuralBump = stage === 'ready' ? 0.026 : 0.005;
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

  // In "ТЕПЛО" the layer placcards are replaced by the three temperature tags: with both
  // on screen the callouts and the tags fought for the same strip (the audit measured
  // 666 px² of text overlap at 390x844). Selecting a layer still shows its callout.
  const showCallouts =
    mode !== 'thermal' &&
    (k > 0.15 || mode === 'exploded' || mode === 'structure' || selectedId !== null);

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
        facadeZ={targetFacadeZ}
        structuralZ={targetStructuralZ}
        highlightedId={selectedId}
        onSelect={onSelect}
        clippingPlanes={clippingPlanes}
      />

      {/* Swiss Callout for Peikko Hardware */}
      {showCallouts && (
        <group position={[-0.6, 0.0, (targetFacadeZ + targetStructuralZ) / 2]}>
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
        position={[-0.6, 0.7, (targetFacadeZ + targetStructuralZ) / 2]}
        data={hotspotAnnotations.pdm}
        allowPopover={!compactStage}
        isSelected={activeHotspotId === 'pdm' || selectedId === 'anchors'}
        onSelect={() => {
          setActiveHotspotId('pdm');
          onSelect('anchors');
        }}
        onClose={() => setActiveHotspotId(null)}
      />

      {/* Hotspot 2: PIR Closed-Cell Insulation Core */}
      <InvisibleHotspot
        position={[0.45, -0.2, targetPIRZ + dPIR / 2 + 0.005]}
        data={hotspotAnnotations.pir}
        allowPopover={!compactStage}
        isSelected={activeHotspotId === 'pir' || selectedId === 'insulation'}
        onSelect={() => {
          setActiveHotspotId('pir');
          onSelect('insulation');
        }}
        onClose={() => setActiveHotspotId(null)}
      />

      {/* Hotspot 3: Peikko PVL Wire Loops (Recessed end box) */}
      <InvisibleHotspot
        position={[-1.02, 0.0, targetStructuralZ]}
        data={hotspotAnnotations.pvl}
        allowPopover={!compactStage}
        isSelected={activeHotspotId === 'pvl'}
        onSelect={() => {
          setActiveHotspotId('pvl');
          onSelect('anchors');
        }}
        onClose={() => setActiveHotspotId(null)}
      />

      {/* 6. MINIMALIST HAIRLINE DIMENSION TICKS (When Assembled)
          Плашка «Контур» живёт внизу по центру сцены: правый нижний угол занят
          доками (контролы сцены), левый — пилюлей сравнения (xl), снизу на <1024 —
          мобильный бар. Раньше плашка висела справа и на 1600 упиралась прямо
          в «Сечение / 3D Обзор». */}
      {showDimensions && k < 0.15 && !isThermal && !selectedId && (
        <group position={[0, -1.42, 0]}>
          <Html center distanceFactor={4.5} zIndexRange={[15, 0]} className="pointer-events-none select-none">
            <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-[#71717A] tracking-wider whitespace-nowrap bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-black/5 shadow-sm">
              <span className="text-[10px] uppercase text-[#A1A1AA]">Контур:</span>
              <span className="font-semibold text-[#18181B]">390 мм</span>
              <span className="text-[9px] text-[#A1A1AA]">(70 + 200 + 120)*</span>
            </div>
          </Html>
        </group>
      )}

      {/* 6. THERMAL RESTRAINED INFOGRAPHIC
          Сами таблетки живут в <ThermalTag>: их экранные смещения считает общий проход
          раскладки (screenAnnotationLayout), потому что проекция анкеров не гарантирует
          зазор — на 1024–1600 px таблетки пересекались между собой, а «Снаружи» на 1366
          накрывала плашку HUD «512px Hi-Res карты». */}
      {isThermal && !sectionFocusNarrow && (
        <group>
          {/* Outdoor Frost Tag - attached to top-left of the Facade layer */}
          <ThermalTag id="thermal-tag-outer" order={1} position={[-thermalTagX, 1.3, targetFacadeZ + dFacade / 2]}>
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] ring-2 ring-[#93C5FD]/60 shrink-0" />
            <span className="hidden sm:inline text-[#71717A] text-[10px] uppercase tracking-wider">Снаружи:</span>
            <span className="font-semibold text-[#1D4ED8]">-20 °C</span>
          </ThermalTag>

          {/* PIR Zero Isotherm Tag - attached to top-center of the PIR foam core */}
          <ThermalTag id="thermal-tag-pir" order={2} position={[0.0, 1.3, targetPIRZ]}>
            <span className="w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-[#A7F3D0]/60 shrink-0" />
            <span className="hidden sm:inline text-[#71717A] text-[10px] uppercase tracking-wider">0 °C:</span>
            <span className="hidden sm:inline font-medium text-[#047857]">Внутри PIR</span>
            <span className="sm:hidden font-medium text-[#047857]">0 °C</span>
          </ThermalTag>

          {/* Indoor Room Warmth Tag - attached to top-right of the Structural inner layer */}
          <ThermalTag id="thermal-tag-inner" order={3} position={[thermalTagX, 1.3, targetStructuralZ - dStructural / 2]}>
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] ring-2 ring-[#FDE68A]/60 animate-pulse shrink-0" />
            <span className="hidden sm:inline text-[#71717A] text-[10px] uppercase tracking-wider">Интерьер:</span>
            <span className="font-semibold text-[#B45309]">+22 °C</span>
          </ThermalTag>
        </group>
      )}
    </group>
  );
};
