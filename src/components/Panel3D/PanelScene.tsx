import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, ContactShadows, Environment, Html, AdaptiveDpr, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { easing } from 'maath';
import { PanelDemoVariant, WidgetViewMode } from '../../data/panelConfig';
import { PanelModel } from './PanelModel';
import { PanelSceneSkeleton } from './PanelSceneSkeleton';
import { SceneErrorBoundary } from './SceneErrorBoundary';
import { useProgressiveProceduralTextures } from '../../utils/textureGenerator';
import { RotateCw, Move3d, Hand, Scissors } from 'lucide-react';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { CrossSectionPlaneHelper, ClippingAxis } from './CrossSectionPlaneHelper';
import { CrossSectionControl } from './CrossSectionControl';
import { CORNER_STAGES, CornerStage } from '../../lib/panelScenarios';

interface PanelSceneProps {
  mode: WidgetViewMode;
  scrubProgress?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  scrollStoryProgress?: number;
  demoVariant?: PanelDemoVariant;
  onDemoVariantChange?: (variant: PanelDemoVariant) => void;
}

// Ensures renderer local clipping is always active across all R3F render loops
function ClippingManager() {
  const { gl } = useThree();
  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);
  return null;
}

// Responsive camera breathing & parallax rig adapting to mobile portrait aspect ratios and user interaction
interface CameraRigProps {
  isInteracting: boolean;
  resetKey?: number;
  mode: WidgetViewMode;
  /** "Угол": 'wide' frames the whole corner (crane step), 'close' the joint section. */
  cornerView?: 'off' | 'wide' | 'close';
  controlsRef?: React.MutableRefObject<OrbitControlsType | null>;
}

// The PVL pocket is at the inner (room-side) corner: from the usual front view it is
// hidden inside the wall. For the corner demo the camera moves into the room, above it.
const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0.05, 0);
const CORNER_VIEWS = {
  // Step 1: the building corner from outside, so panel B is seen coming down onto it.
  wide: { lookAt: new THREE.Vector3(0.55, 0.3, -0.35), offset: new THREE.Vector3(2.5, 1.35, 3.1) },
  // Steps 2–4: close over the loop-level section, looking into the grout pocket.
  close: { lookAt: new THREE.Vector3(0.67, 0.8, -0.13), offset: new THREE.Vector3(-0.24, 0.66, -0.34) },
};

function CameraRig({ isInteracting, resetKey = 0, mode, cornerView = 'off', controlsRef }: CameraRigProps) {
  const corner = cornerView === 'off' ? null : CORNER_VIEWS[cornerView];
  const { size } = useThree();
  const isPortrait = size.width < size.height;
  const aspect = size.width / Math.max(1, size.height);

  // Dynamic zoom distance: on mobile portrait (aspect ~0.55), step back smoothly so panel and Swiss Callouts never clip
  const scale = isPortrait ? Math.max(1.35, 1.0 / Math.max(0.42, aspect)) : 1.0;

  // Hero framing per mode. The default 3/4 architectural view slightly steps back
  // (vs the old 2.8/1.3/3.4) so the 2.4 m slab keeps air around it instead of
  // touching the viewport edges. Thermal mode swings the camera towards the cut
  // plane: across the 390 mm stack the temperature gradient is what the user came
  // for, and an edge-on-ish angle shows facade -> PIR -> structural in one look.
  const isThermalView = mode === 'thermal';
  const baseX = (isThermalView ? 4.30 : 3.05) * scale;
  const baseY = ((isThermalView ? 0.95 : 1.25) + (isPortrait ? 0.35 : 0)) * scale;
  const baseZ = (isThermalView ? 2.20 : 3.55) * scale;

  // Track if user has performed a custom orbit rotation
  const hasCustomOrbitRef = useRef(false);
  const customBasePosRef = useRef(new THREE.Vector3());
  const prevInteractingRef = useRef(isInteracting);
  const targetLookAtRef = useMemo(() => DEFAULT_LOOK_AT.clone(), []);

  // Reset custom orbit when user triggers camera reset or switches to/from the corner view
  useEffect(() => {
    hasCustomOrbitRef.current = false;
  }, [resetKey, cornerView]);

  useFrame((state, delta) => {
    // Detect when user finishes interacting with OrbitControls
    if (prevInteractingRef.current && !isInteracting) {
      // User just released orbit controls: capture new anchor position
      customBasePosRef.current.copy(state.camera.position);
      hasCustomOrbitRef.current = true;
    }
    prevInteractingRef.current = isInteracting;

    // When user is actively orbiting/pinching, yield completely to OrbitControls for 100% responsive control
    if (isInteracting) return;

    // Orbit and rig must share one pivot, otherwise OrbitControls snaps the view back.
    const lookAt = corner ? corner.lookAt : DEFAULT_LOOK_AT;
    easing.damp3(targetLookAtRef, [lookAt.x, lookAt.y, lookAt.z], 0.6, delta);
    if (controlsRef?.current) controlsRef.current.target.copy(targetLookAtRef);

    // Organic, multi-harmonic low-frequency camera breathing:
    // Uses prime-ratio harmonics to create an authentic architectural exhibition feel:
    // - Primary respiratory cycle: ~10.5 seconds (T = 2π / 0.60 rad/s)
    // - Secondary non-linear drift: ~24.2 seconds (T = 2π / 0.26 rad/s)
    // - Vertical subtle lift & sink: ~13.7 seconds (T = 2π / 0.46 rad/s)
    // - Micro focal depth breathing: ~16.1 seconds (T = 2π / 0.39 rad/s)
    const t = state.clock.elapsedTime;
    const breathWeight = isPortrait ? 0.65 : 1.0;
    const breathX = (Math.sin(t * 0.60) * 0.026 + Math.cos(t * 0.26) * 0.010) * breathWeight;
    const breathY = (Math.cos(t * 0.46) * 0.022 + Math.sin(t * 0.31) * 0.008) * breathWeight;
    const breathZ = (Math.sin(t * 0.39) * 0.020) * breathWeight;

    // Pointer-driven parallax (subtle responsive desk-tilt feedback)
    const pointerX = state.pointer.x * (isPortrait ? 0.08 : 0.22);
    const pointerY = state.pointer.y * (isPortrait ? 0.05 : 0.14);

    if (!hasCustomOrbitRef.current) {
      // Default architectural hero perspective: anchored slab with gentle organic breathing
      const heroX = corner ? corner.lookAt.x + corner.offset.x * scale : baseX;
      const heroY = corner ? corner.lookAt.y + corner.offset.y * scale : baseY;
      const heroZ = corner ? corner.lookAt.z + corner.offset.z * scale : baseZ;
      const targetX = heroX + pointerX + breathX;
      const targetY = heroY + pointerY + breathY;
      const targetZ = heroZ + breathZ;

      easing.damp3(state.camera.position, [targetX, targetY, targetZ], 0.6, delta);
    } else {
      // Custom user-rotated view: apply organic breathing along camera's local viewport axes
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      state.camera.matrixWorld.extractBasis(right, up, new THREE.Vector3());

      const targetX = customBasePosRef.current.x + right.x * (breathX + pointerX) + up.x * (breathY + pointerY);
      const targetY = customBasePosRef.current.y + right.y * (breathX + pointerX) + up.y * (breathY + pointerY);
      const targetZ = customBasePosRef.current.z + right.z * (breathX + pointerX) + up.z * (breathY + pointerY);

      easing.damp3(state.camera.position, [targetX, targetY, targetZ], 0.6, delta);
    }

    state.camera.lookAt(targetLookAtRef);
  });

  return null;
}

export const PanelScene: React.FC<PanelSceneProps> = ({
  mode,
  scrubProgress,
  selectedId,
  onSelect,
  demoVariant = 'standard',
  onDemoVariantChange,
}) => {
  const controlsRef = useRef<OrbitControlsType | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  // Specific 'Interact' toggle: when false (default), 1-finger touches allow page scrolling, 2 fingers rotate
  const [isInteractActive, setIsInteractActive] = useState(false);

  // Corner joint demonstration: switching to "Угол" plays the four steps once
  // (loops → docking → bar → grout); the stepper lets the presenter replay any step.
  const [cornerStage, setCornerStage] = useState<CornerStage>(4);
  const [cornerPlaying, setCornerPlaying] = useState(false);
  const playCorner = () => {
    setCornerStage(1);
    setCornerPlaying(true);
  };
  useEffect(() => {
    if (demoVariant !== 'corner') { setCornerPlaying(false); return; }
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setCornerStage(4); return; }
    playCorner();
  }, [demoVariant]);
  useEffect(() => {
    if (!cornerPlaying) return;
    if (cornerStage >= 4) { setCornerPlaying(false); return; }
    const holdMs: Record<CornerStage, number> = { 1: 3000, 2: 2400, 3: 2600, 4: 0 };
    const timer = window.setTimeout(() => setCornerStage((stage) => Math.min(4, stage + 1) as CornerStage), holdMs[cornerStage]);
    return () => window.clearTimeout(timer);
  }, [cornerPlaying, cornerStage]);

  // Textures are prepared in the background; progress is deliberately not exposed to clients.
  useProgressiveProceduralTextures();

  // Cross-section clipping plane state
  const [clippingState, setClippingState] = useState<{
    enabled: boolean;
    axis: ClippingAxis;
    offset: number;
    inverted: boolean;
    showPlaneHelper: boolean;
  }>({
    enabled: false,
    axis: 'z',
    offset: 0.025, // default slices directly into the PIR insulation core (+25 mm)
    inverted: false,
    showPlaneHelper: true,
  });

  const handleToggleClipping = () => {
    setClippingState((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleChangeAxis = (axis: ClippingAxis) => {
    let defaultOffset = 0.0;
    if (axis === 'z') defaultOffset = 0.025;
    setClippingState((prev) => ({
      ...prev,
      axis,
      offset: defaultOffset,
      inverted: false,
    }));
  };

  const handleChangeOffset = (offset: number) => {
    setClippingState((prev) => ({ ...prev, offset }));
  };

  const handleToggleInverted = () => {
    setClippingState((prev) => ({ ...prev, inverted: !prev.inverted }));
  };

  const handleToggleShowPlaneHelper = () => {
    setClippingState((prev) => ({ ...prev, showPlaneHelper: !prev.showPlaneHelper }));
  };

  const handleResetClipping = () => {
    let defaultOffset = 0.0;
    if (clippingState.axis === 'z') defaultOffset = 0.025;
    setClippingState((prev) => ({
      ...prev,
      offset: defaultOffset,
      inverted: false,
    }));
  };

  // Construct standard THREE.Plane instance
  const clippingPlane = useMemo(() => {
    if (!clippingState.enabled) return null;
    const normal = new THREE.Vector3();
    if (clippingState.axis === 'z') {
      normal.set(0, 0, clippingState.inverted ? 1 : -1);
    } else if (clippingState.axis === 'x') {
      normal.set(clippingState.inverted ? 1 : -1, 0, 0);
    } else if (clippingState.axis === 'y') {
      normal.set(0, clippingState.inverted ? 1 : -1, 0);
    }
    const constant = clippingState.inverted ? -clippingState.offset : clippingState.offset;
    return new THREE.Plane(normal, constant);
  }, [clippingState.enabled, clippingState.axis, clippingState.offset, clippingState.inverted]);

  const clippingPlanesArray = useMemo(() => {
    return clippingPlane ? [clippingPlane] : [];
  }, [clippingPlane]);

  // Synchronize OrbitControls configuration dynamically
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enablePan = false;
      controlsRef.current.screenSpacePanning = false;
      controlsRef.current.touches = {
        ONE: isInteractActive ? THREE.TOUCH.ROTATE : (-1 as any),
        TWO: THREE.TOUCH.DOLLY_ROTATE,
      };
    }
  }, [isInteractActive]);

  const [resetKey, setResetKey] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    setResetKey((prev) => prev + 1);
  };

  return (
    <div
      ref={stageRef}
      className="relative h-full w-full select-none overflow-hidden bg-[#D8D3C9]"
      style={{ touchAction: isInteractActive ? 'none' : 'pan-y' }}
    >
      {/* 3D WebGL Canvas. Wrapped in an ErrorBoundary: a failed 3D mount (WebGL,
          environment, shader compile) must degrade to the 2D blueprint, never
          to the blank rectangle it used to become. */}
      <SceneErrorBoundary onSelectLayer={onSelect}>
      <Canvas
        shadows="soft"
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.95,
          localClippingEnabled: true,
        }}
        className="w-full h-full"
        style={{ touchAction: isInteractActive ? 'none' : 'pan-y' }}
      >
        <ClippingManager />

        <PerspectiveCamera
          makeDefault
          position={[2.8, 1.2, 3.4]}
          fov={38}
          near={0.1}
          far={40}
        />

        <CameraRig isInteracting={isInteracting} resetKey={resetKey} mode={mode} cornerView={demoVariant !== 'corner' ? 'off' : cornerStage === 1 ? 'wide' : 'close'} controlsRef={controlsRef} />

        <OrbitControls
          ref={controlsRef}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={demoVariant === 'corner' ? 0.7 : 1.8}
          maxDistance={7.5}
          maxPolarAngle={Math.PI / 2 + 0.05}
          enablePan={false}
          screenSpacePanning={false}
          enableRotate={true}
          touches={{
            ONE: isInteractActive ? THREE.TOUCH.ROTATE : (-1 as any),
            TWO: THREE.TOUCH.DOLLY_ROTATE,
          }}
          onStart={() => setIsInteracting(true)}
          onEnd={() => setIsInteracting(false)}
        />

        {/* Studio High-Key Lighting: procedural IBL + Directionals + Subtle PointLight Accents */}
        {/* Environment is built in-code from Lightformers (no external HDRI):
            drei's `preset` pulls a ~1.5 MB map from raw.githack.com inside Suspense,
            so one blocked third-party request used to blank the whole widget. */}
        <Environment resolution={256} frames={1} environmentIntensity={0.55}>
            <color attach="background" args={['#D8D3C9']} />
          {/* Large soft key box above and slightly behind the slab */}
          <Lightformer
            form="rect"
            intensity={3.0}
            color="#FFFFFF"
            position={[0.5, 4.0, -3.0]}
            scale={[7, 3.2, 1]}
            target={[0, 0, 0]}
          />
          {/* Cool north-sky side panel (concrete reads mineral, not yellowish) */}
          <Lightformer
            form="rect"
            intensity={1.0}
            color="#DBE6F3"
            position={[-4.5, 1.5, 1.0]}
            scale={[4.5, 4.5, 1]}
            target={[0, 0, 0]}
          />
          {/* Warm floor bounce so the lower bevels of the precast layers stay readable */}
          <Lightformer
            form="rect"
            intensity={0.7}
            color="#FFE9CF"
            position={[4.2, 0.4, 1.8]}
            scale={[4, 4, 1]}
            target={[0, 0, 0]}
          />
          {/* Dim under-ring: grounds the slab without washing out cast shadows */}
          <Lightformer form="ring" intensity={0.35} color="#FFFFFF" position={[0, -3.4, 0]} scale={4} target={[0, 0, 0]} />
        </Environment>

        {/* Base Ambient: kept low so cast shadows stay readable between the slab layers */}
        <ambientLight intensity={0.16} color="#EDF2F7" />

        {/* Primary Key Light: crisp architectural sun / key light. This is the ONLY shadow
            caster — a single shadow map keeps the layer separation legible without the
            cost of shadowing every light. The frustum is fitted to the exploded slab
            (2.0 x 2.4 m plus ~0.5 m of travel along Z) with headroom. */}
        <directionalLight
          position={[4.2, 7.0, 4.0]}
          intensity={0.9}
          color="#FCFBF7"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-3}
          shadow-camera-right={3}
          shadow-camera-top={3.5}
          shadow-camera-bottom={-3.5}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
          shadow-bias={-0.0006}
          shadow-normalBias={0.025}
        />

        {/* Secondary Fill Light: cool north-sky fill giving concrete its refined architectural tone */}
        <directionalLight position={[-4.0, 3.5, -2.5]} intensity={0.40} color="#DCE7F5" />

        {/* Rim / Contour Light: sharp glancing light to highlight chamfered precast edges */}
        <directionalLight position={[-2.5, 1.2, 3.8]} intensity={0.28} color="#E8EEF5" />

        {/* Ground bounce light */}
        <directionalLight position={[0, -3.5, 1.0]} intensity={0.10} color="#CBD5E1" />

        <AdaptiveDpr />

        <Suspense
          fallback={
            <Html center>
              <div className="w-[100vw] h-[100vh] flex items-center justify-center pointer-events-none">
                <PanelSceneSkeleton inline />
              </div>
            </Html>
          }
        >
          <PanelModel
            mode={mode}
            scrubProgress={scrubProgress}
            selectedId={selectedId}
            onSelect={onSelect}
            clippingPlanes={clippingPlanesArray}
            demoVariant={demoVariant}
            cornerStage={cornerStage}
          />

          {/* 3D Visual Slice Plane Guide Blade */}
          <CrossSectionPlaneHelper
            axis={clippingState.axis}
            offset={clippingState.offset}
            visible={clippingState.enabled && clippingState.showPlaneHelper}
          />

          {/* Contact shadow grounding the slab onto the floor */}
          <ContactShadows
            position={[0, -1.21, 0]}
            opacity={0.35}
            scale={6.5}
            blur={2.5}
            far={3.0}
            resolution={512}
            color="#18181B"
          />
        </Suspense>
      </Canvas>
      </SceneErrorBoundary>

      {/* Floating Cross-Section Tool Dock (Top-Right / Responsive) */}
      {clippingState.enabled && (
        <div className="absolute top-16 sm:top-20 right-3 sm:right-4 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
          <CrossSectionControl
            enabled={clippingState.enabled}
            onToggleEnabled={handleToggleClipping}
            axis={clippingState.axis}
            onChangeAxis={handleChangeAxis}
            offset={clippingState.offset}
            onChangeOffset={handleChangeOffset}
            inverted={clippingState.inverted}
            onToggleInverted={handleToggleInverted}
            showPlaneHelper={clippingState.showPlaneHelper}
            onToggleShowPlaneHelper={handleToggleShowPlaneHelper}
            onReset={handleResetClipping}
            demoVariant={demoVariant}
          />
        </div>
      )}

      {/* "Узлы" demo-variant switcher. Rendered before stage-controls-dock in the DOM
          (though it sits visually below the mode capsule and above the dock) so tab
          order matches the top-to-bottom reading order the 4 mode tabs already follow —
          previously the bottom camera controls came first in the tab sequence. It also
          sits one notch lower (top-24/sm:top-28) than it used to, so the mode capsule's
          second row (scrubber / thermal caption) has room above it. That still isn't
          enough clearance from the cross-section dock's own multi-row panel once it's
          open — a fixed vertical gap can't outrun a panel of variable height — so while
          "Сечение" is open this bar moves to the opposite (left) edge instead of staying
          centered under the right-anchored dock; on this widget's aspect ratio (canvas
          filling most of the width) that's ample room for both. */}
      <div role="group" aria-label="Демонстрационные узлы панели" className={`no-scrollbar absolute top-24 z-20 flex max-w-[calc(100vw-1rem)] items-center gap-1 overflow-x-auto border border-black/10 bg-[#F3F0E9]/90 p-1 shadow-[0_12px_30px_rgba(38,34,27,0.1)] backdrop-blur-md transition-[left,transform] duration-200 sm:top-28 ${clippingState.enabled ? 'left-3' : 'left-1/2 -translate-x-1/2'}`}>
        <span className="sr-only">Узлы</span>
        <span aria-hidden="true" className="hidden px-2 text-[9px] uppercase tracking-[0.16em] text-[#846846] md:block">Узлы</span>
        {([
          ['standard', 'Панель'],
          ['corner', 'Угол'],
          ['windows', 'Окна'],
          ['services', 'Коммуникации'],
        ] as const).map(([variant, label]) => (
          <button
            key={variant}
            type="button"
            aria-pressed={demoVariant === variant}
            onClick={() => onDemoVariantChange?.(variant)}
            className={`whitespace-nowrap px-2.5 py-1.5 text-[10px] transition-[background-color,color,transform] active:scale-[0.96] ${demoVariant === variant ? 'bg-[#1D1C19] text-[#F3F0E9]' : 'text-[#665F55] hover:bg-black/[0.05] hover:text-[#1D1C19]'}`}
          >{label}</button>
        ))}
      </div>

      {demoVariant === 'corner' && (() => {
        const current = CORNER_STAGES.find((item) => item.stage === cornerStage) ?? CORNER_STAGES[3];
        return (
          <div className="absolute bottom-[7.5rem] left-1/2 z-20 w-[min(420px,calc(100vw-1rem))] -translate-x-1/2 border border-black/10 bg-[#F3F0E9]/95 p-3 shadow-[0_12px_30px_rgba(38,34,27,0.12)] backdrop-blur-md lg:bottom-16">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9px] uppercase tracking-[0.16em] text-[#846846]">Угол: соединение Peikko PVL · разрез на уровне петель</p>
              <button type="button" onClick={playCorner} className="text-[10px] text-[#665F55] underline-offset-2 hover:text-[#1D1C19] hover:underline">{cornerPlaying ? 'Идёт показ…' : 'Показать заново'}</button>
            </div>
            <ol role="group" aria-label="Шаги соединения панелей" className="mt-2 grid grid-cols-4 gap-1">
              {CORNER_STAGES.map((item) => {
                const active = item.stage === cornerStage;
                const done = item.stage < cornerStage;
                return (
                  <li key={item.stage}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => { setCornerPlaying(false); setCornerStage(item.stage); }}
                      className={`flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-[10px] transition-colors ${active ? 'bg-[#1D1C19] text-[#F3F0E9]' : done ? 'bg-black/[0.06] text-[#1D1C19]' : 'text-[#8A8378] hover:bg-black/[0.05] hover:text-[#1D1C19]'}`}
                    >
                      <span className="font-mono text-[9px] opacity-70">{item.stage}</span>
                      <span>{item.title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p aria-live="polite" className="mt-2 min-h-[2.5em] text-[11px] leading-snug text-[#4A463F]">{current.text}</p>
          </div>
        );
      })()}

      {/* Floating touch interaction mode & camera reset controls.
          Raised above the mobile action bar (<lg); on larger stages the group is
          centered below the model so it never collides with either information rail. */}
      <div id="stage-controls-dock" className="absolute bottom-[4.5rem] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 lg:bottom-4">
        {/* Cross-Section Tool Trigger Button */}
        <button
          id="cross-section-trigger-btn"
          onClick={handleToggleClipping}
          className={`flex min-h-9 cursor-pointer items-center gap-1.5 border px-3 py-1.5 text-[11px] tracking-tight shadow-sm backdrop-blur-md transition-all duration-200 ${
            clippingState.enabled
              ? 'border-[#1D1C19] bg-[#1D1C19] text-white shadow-md'
              : 'border-black/10 bg-[#F3F0E9]/90 text-[#5F5A51] hover:bg-white hover:text-black'
          }`}
          title={
            clippingState.enabled
              ? 'Закрыть инструмент сечения'
              : 'Инструмент сечения (Clipping Plane): послойный разрез панели и обнажение связей'
          }
        >
          <Scissors className={`h-3.5 w-3.5 shrink-0 ${clippingState.enabled ? 'text-[#B89A70]' : 'text-[#8B7354]'}`} />
          <span className="font-medium whitespace-nowrap">
            {clippingState.enabled ? 'Сечение ВКЛ' : 'Сечение'}
          </span>
        </button>

        {/* Specific 'Interact' Toggle Button */}
        <button
          id="orbit-interact-toggle"
          onClick={() => setIsInteractActive((prev) => !prev)}
          className={`flex min-h-9 cursor-pointer items-center gap-1.5 border px-3 py-1.5 text-[11px] tracking-tight shadow-sm backdrop-blur-md transition-all duration-200 ${
            isInteractActive
              ? 'border-[#1D1C19] bg-[#1D1C19] text-white shadow-md'
              : 'border-black/10 bg-[#F3F0E9]/90 text-[#5F5A51] hover:bg-white hover:text-black'
          }`}
          title={
            isInteractActive
              ? 'Вращение 1 пальцем активно. Нажмите для включения скролла страницы'
              : 'Включить вращение 3D одним пальцем'
          }
        >
          {isInteractActive ? (
            <>
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#B89A70] animate-pulse" />
              <Move3d className="h-3.5 w-3.5 shrink-0 text-[#B89A70]" />
              <span className="font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">3D Режим Вкл</span>
            </>
          ) : (
            <>
              <Hand className="h-3.5 w-3.5 shrink-0 text-[#8B7354]" />
              <span className="font-medium whitespace-nowrap">3D Обзор</span>
            </>
          )}
        </button>

        {/* Camera Reset */}
        <button
          id="orbit-reset-camera-btn"
          onClick={resetCamera}
          className="flex min-h-9 cursor-pointer items-center gap-1.5 border border-black/10 bg-[#F3F0E9]/90 px-3 py-1.5 text-[11px] tracking-tight text-[#6F695F] shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-white hover:text-black"
          title="Сбросить ракурс камеры"
        >
          <RotateCw className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden font-medium whitespace-nowrap sm:inline">Сбросить вид</span>
        </button>
      </div>

      {/* Renderer diagnostics remain internal: technical status never competes with the product. */}
    </div>
  );
};
