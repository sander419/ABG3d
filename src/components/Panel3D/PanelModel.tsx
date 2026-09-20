import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox, Html, useTexture } from '@react-three/drei';
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
import { PANEL_GEOMETRY } from '../../lib/panelGeometry';

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
  const precastAlbedo = useTexture('/textures/architectural-precast-concrete-v1.webp');

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
  const dFacade = PANEL_GEOMETRY.facade.thickness;
  const dPIR = PANEL_GEOMETRY.insulation.thickness;
  const dStructural = PANEL_GEOMETRY.structural.thickness;

  // Albedo is an authored, seamless concrete surface. The procedural maps below
  // remain dedicated non-colour PBR data (micro-relief and roughness), rather
  // than trying to fake every material property in a single noisy bitmap.
  useMemo(() => {
    precastAlbedo.colorSpace = THREE.SRGBColorSpace;
    precastAlbedo.wrapS = THREE.RepeatWrapping;
    precastAlbedo.wrapT = THREE.RepeatWrapping;
    precastAlbedo.repeat.set(1, 1);
    precastAlbedo.anisotropy = 4;
    precastAlbedo.needsUpdate = true;
  }, [precastAlbedo]);

  // In assembly the layers touch: 70 + 200 + 120 = 390 mm.
  // Only the exploded modes introduce explanatory gaps.
  const baseStructuralZ = PANEL_GEOMETRY.structural.centerZ;
  const basePIRZ = PANEL_GEOMETRY.insulation.centerZ;
  const baseFacadeZ = PANEL_GEOMETRY.facade.centerZ;

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

  // Materials use a restrained architectural palette: the model is a product
  // visualisation, not a claim about a specific concrete mix or insulation brand.
  // 1. Facade concrete: warm, matte factory-cast surface.
  const isFacadeSelected = selectedId === 'facade';
  const facadeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: precastAlbedo,
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
  }, [textures, precastAlbedo]);

  // 2. Insulation: a calm, dense board surface in normal views. The dedicated
  // shader is used only in thermal mode, where it carries the temperature field.
  const isPirSelected = selectedId === 'insulation';
  const pirShaderMat = useMemo(() => createPIRShaderMaterial(), []);
  const insulationMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#B9B6AD'),
      roughness: 0.96,
      metalness: 0,
      envMapIntensity: 0.22,
    });
  }, []);

  // 3. Structural concrete: slightly denser and darker than the facade.
  const isStructuralSelected = selectedId === 'structural';
  const structuralMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: precastAlbedo,
      bumpMap: textures.structuralBump,
      bumpScale: 0.026,
      roughnessMap: textures.structuralRoughness,
      roughness: 0.86,
      metalness: 0.03,
      color: new THREE.Color('#C4C1BA'),
      emissive: new THREE.Color('#F59E0B'),
      emissiveIntensity: 0.0,
      envMapIntensity: 0.5,
    });
  }, [textures, precastAlbedo]);

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
    insulationMaterial.clippingPlanes = planes;
    insulationMaterial.clipShadows = true;
    insulationMaterial.side = THREE.DoubleSide;
    insulationMaterial.needsUpdate = true;
  }, [clippingPlanes, facadeMaterial, structuralMaterial, pirShaderMat, insulationMaterial]);

  const isThermal = mode === 'thermal';
  const isStructure = mode === 'structure';
  // The sales view keeps the object itself unobstructed. Layer navigation lives
  // in the rails/callouts; floating HTML targets are reserved for an eventual
  // dedicated engineering-inspection mode.
  const showFloatingHotspots = false;

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
      pirGroup.current.visible = !isStructure;
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
    easing.damp(facadeMaterial, 'opacity', isThermal ? 0.3 : isStructure ? 0.16 : 1.0, 0.25, delta);
    structuralMaterial.transparent = isStructure;
    easing.damp(structuralMaterial, 'opacity', isStructure ? 0.16 : 1.0, 0.25, delta);
    facadeMaterial.depthWrite = !isThermal && !isStructure;
    structuralMaterial.depthWrite = !isStructure;

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
    showDimensions && mode !== 'thermal' && !compactStage && selectedId !== null;

  // Invisible Hotspots Engineering Annotations
  const hotspotAnnotations: Record<string, HotspotAnnotation> = {
    pdm: {
      id: 'anchors',
      tag: 'PEIKKO PDM',
      title: 'Связи Peikko PDM',
      spec: 'Состав и материал — по проекту',
      note: 'Диагональные связи проходят сквозь теплоизоляционный слой и работают в составе проектного конструктивного решения.',
      details: [
        'Положение определяется проектом',
        'Узел требует инженерного расчёта',
        'Монтаж по рабочей документации',
      ],
    },
    pir: {
      id: 'insulation',
      tag: 'ТЕПЛОВОЙ КОНТУР',
      title: 'Теплоизоляция 2 × 100 мм*',
      spec: 'Материал и теплотехнические характеристики — по проекту',
      note: 'Теплоизоляционный слой между железобетонными оболочками. Тип утеплителя и расчётные характеристики зависят от серии панели и климатического района.',
      details: [
        'Два слоя с перехлёстом швов',
        'Теплотехника — по расчёту проекта',
        'Материал — по спецификации ABG',
      ],
    },
    pvl: {
      id: 'anchors',
      tag: 'PEIKKO PVL',
      title: 'Тросовые петли PVL',
      spec: 'Соединительные петли в зоне проектного стыка',
      note: 'Петли устанавливаются в зоне вертикального стыка. После монтажа через них проходит вертикальный стержень, затем узел заполняется согласно рабочей документации.',
      details: [
        'Положение и тип — по проекту',
        'Стержень в стыке — по рабочему узлу',
        'Заполнение — по ППР',
      ],
    },
    facade: {
      id: 'facade',
      tag: 'ФАСАДНЫЙ СЛОЙ',
      title: 'Архитектурный бетон',
      spec: '70 мм* • заводское формование',
      note: 'Наружный защитно-декоративный слой. Класс бетона, фактура и защитные характеристики определяются проектом.',
      details: [
        'Толщина показана для примера',
        'Параметры бетона — по спецификации',
        'Фактура согласуется с архитектурой',
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
        {showCallouts && selectedId === 'facade' && (
          <SwissCallout
            position={[-0.85, 0.75, dFacade / 2 + 0.002]}
            layer={layerFacade}
            direction="left"
            isActive={selectedId === 'facade'}
            onSelect={() => onSelect('facade')}
          />
        )}
      </group>

      {/* 2. 200 mm insulation contour. ABG describes it as two 100 mm layers;
          the small physical split is visible in the exploded view. Thermal mode
          remains a continuous material so its illustrative colour gradient stays legible. */}
      <group ref={pirGroup} position={[0, 0, basePIRZ]}>
        {isThermal ? (
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
        ) : (
          <>
            {[-1, 1].map((side) => (
              <RoundedBox
                key={side}
                args={[W, H, dPIR / 2]}
                position={[0, 0, side * (dPIR / 4 + 0.003 * k)]}
                radius={0.002}
                smoothness={3}
                material={insulationMaterial}
                castShadow
                receiveShadow
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect('insulation');
                }}
              />
            ))}
          </>
        )}

        {/* Swiss Callout for PIR */}
        {showCallouts && selectedId === 'insulation' && (
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
        {showCallouts && selectedId === 'structural' && (
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
        mode={mode}
        clippingPlanes={clippingPlanes}
      />

      {/* Swiss Callout for Peikko Hardware */}
      {showCallouts && selectedId === 'anchors' && (
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

      {/* 5. Engineering annotations stay out of the structure view: the exposed
          mesh is the primary object there, and HTML rings visually read as defects. */}
      {showFloatingHotspots && !isStructure && <>
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
      </>}

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

      {/* 6. THERMAL RESTRAINED INFOGRAPHIC */}
      {showFloatingHotspots && isThermal && !sectionFocusNarrow && (
        <group>
          {/* Outdoor Frost Tag - attached to top-left of the Facade layer */}
          <group position={[-thermalTagX, 1.3, targetFacadeZ + dFacade / 2]}>
            <Html center distanceFactor={4.8} zIndexRange={[15, 0]} className="pointer-events-none select-none">
              <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[11px] sm:text-xs text-[#18181B] bg-white/95 backdrop-blur-md px-2 sm:px-3 py-1.5 rounded-full border border-black/10 shadow-[0_4px_16px_rgba(0,0,0,0.06)] whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6] ring-2 ring-[#93C5FD]/60 shrink-0" />
                <span className="hidden sm:inline text-[#71717A] text-[10px] uppercase tracking-wider">Снаружи:</span>
                <span className="font-semibold text-[#1D4ED8]">расчётный режим</span>
              </div>
            </Html>
          </group>

          {/* Insulation contour tag — exact material and thermal profile are project-specific. */}
          <group position={[0.0, 1.3, targetPIRZ]}>
            <Html center distanceFactor={4.8} zIndexRange={[15, 0]} className="pointer-events-none select-none">
              <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[11px] sm:text-xs text-[#18181B] bg-white/95 backdrop-blur-md px-2 sm:px-3.5 py-1.5 rounded-full border border-black/10 shadow-[0_4px_16px_rgba(0,0,0,0.06)] whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-[#A7F3D0]/60 shrink-0" />
                <span className="hidden sm:inline text-[#71717A] text-[10px] uppercase tracking-wider">Контур:</span>
                <span className="hidden sm:inline font-medium text-[#047857]">2 × 100 мм*</span>
                <span className="sm:hidden font-medium text-[#047857]">2 × 100 мм*</span>
              </div>
            </Html>
          </group>

          {/* Indoor Room Warmth Tag - attached to top-right of the Structural inner layer */}
          <group position={[thermalTagX, 1.3, targetStructuralZ - dStructural / 2]}>
            <Html center distanceFactor={4.8} zIndexRange={[15, 0]} className="pointer-events-none select-none">
              <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[11px] sm:text-xs text-[#18181B] bg-white/95 backdrop-blur-md px-2 sm:px-3 py-1.5 rounded-full border border-black/10 shadow-[0_4px_16px_rgba(0,0,0,0.06)] whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] ring-2 ring-[#FDE68A]/60 animate-pulse shrink-0" />
                <span className="hidden sm:inline text-[#71717A] text-[10px] uppercase tracking-wider">Интерьер:</span>
                <span className="font-semibold text-[#B45309]">расчётный режим</span>
              </div>
            </Html>
          </group>
        </group>
      )}
    </group>
  );
};
