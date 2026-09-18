import React, { Suspense, useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, ContactShadows, Environment, Html, AdaptiveDpr, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { easing } from 'maath';
import { WidgetViewMode } from '../../data/panelConfig';
import { PanelModel } from './PanelModel';
import { PanelSceneSkeleton } from './PanelSceneSkeleton';
import { SceneErrorBoundary } from './SceneErrorBoundary';
import { SceneFallback } from '../UI/SceneFallback';
import {
  preloadProceduralTextures,
  useProgressiveProceduralTextures,
} from '../../utils/textureGenerator';
import { RotateCw, Move3d, Hand, RotateCcw, Scissors } from 'lucide-react';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { CrossSectionPlaneHelper, ClippingAxis } from './CrossSectionPlaneHelper';
import { CrossSectionControl } from './CrossSectionControl';
import { probeWebGLSupport, type WebGLAvailability } from '../../utils/webglSupport';

/** Текст для мелкой моноширинной строки под чертежом, когда WebGL нет вообще. */
const WEBGL_UNAVAILABLE_DETAIL =
  'Браузер не отдаёт WebGL: аппаратный рендер отключён, устаревший GPU или корпоративная политика';

// Eagerly preload procedural bump, roughness, and noise texture maps
// into Drei's TextureLoader cache to guarantee zero-jank transitions
preloadProceduralTextures();

interface PanelSceneProps {
  mode: WidgetViewMode;
  scrubProgress?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  showDimensions: boolean;
  scrollStoryProgress?: number;
}

// Ensures renderer local clipping is always active across all R3F render loops
function ClippingManager() {
  const { gl } = useThree();
  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);
  return null;
}

/**
 * Ловит потерю WebGL-контекста уже после успешного старта сцены.
 *
 * Почему не хватает ErrorBoundary: когда драйвер сбрасывается или браузер
 * выгружает вкладку в фон, three не бросает ошибку — рендер просто останавливается,
 * канвас замирает последним (или пустым) кадром. Пользователь видит мёртвую сцену
 * без объяснений. Слушаем `webglcontextlost` на самом канвасе R3F и уходим в 2D-фолбэк.
 */
function WebGLContextGuard({ onLost }: { onLost: (detail: string) => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      // preventDefault сообщает браузеру, что мы намерены обработать потерю сами
      // (иначе он не станет восстанавливать контекст). Саму сцену перемонтирует
      // кнопка «Повторить 3D» — с новым канвасом и новым контекстом.
      event.preventDefault();
      onLost('Контекст WebGL потерян: драйвер GPU сбросился или вкладка была выгружена в фон');
    };
    canvas.addEventListener('webglcontextlost', handleLost);
    return () => canvas.removeEventListener('webglcontextlost', handleLost);
  }, [gl, onLost]);
  return null;
}

// Responsive camera breathing & parallax rig adapting to mobile portrait aspect ratios and user interaction
interface CameraRigProps {
  isInteracting: boolean;
  resetKey?: number;
  mode: WidgetViewMode;
}

function CameraRig({ isInteracting, resetKey = 0, mode }: CameraRigProps) {
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
  const targetLookAtRef = useMemo(() => new THREE.Vector3(0, 0.05, 0), []);

  // Reset custom orbit when user triggers camera reset
  useEffect(() => {
    hasCustomOrbitRef.current = false;
  }, [resetKey]);

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
      const targetX = baseX + pointerX + breathX;
      const targetY = baseY + pointerY + breathY;
      const targetZ = baseZ + breathZ;

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
  showDimensions,
}) => {
  const controlsRef = useRef<OrbitControlsType | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  // Specific 'Interact' toggle: when false (default), 1-finger touches allow page scrolling, 2 fingers rotate
  const [isInteractActive, setIsInteractActive] = useState(false);

  // Progressive procedural textures pipeline state
  const { stage, progress, resolution, recalculate } = useProgressiveProceduralTextures();

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

  // Ширина самой сцены (канваса), а не окна: на 1024–1279 px оба рейла уже занимают
  // ~620 px, сцена сжимается до ~400 px, и HUD материалов начинал наезжать на
  // температурные теги. Ширина меряется ResizeObserver'ом на корневом диве.
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(0);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    setStageW(Math.round(el.getBoundingClientRect().width));
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === 'number') setStageW(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    setResetKey((prev) => prev + 1);
  };

  // WebGL-проба ДО монтирования <Canvas>. Отказ создания WebGLRenderer живёт
  // в эффекте R3F, вне React-границы ошибок: SceneErrorBoundary его не видит,
  // и пользователь получал пустую сцену — без сообщения и без 2D-чертежа.
  const [webglSupport, setWebglSupport] = useState<WebGLAvailability>(() => probeWebGLSupport());
  const [contextLostDetail, setContextLostDetail] = useState<string | null>(null);
  // Ключ перемонтирования сцены: «Повторить 3D» поднимает канвас с нуля.
  const [sceneKey, setSceneKey] = useState(0);

  const handleContextLost = useCallback((detail: string) => {
    setContextLostDetail(detail);
  }, []);

  const handleRetry3D = useCallback(() => {
    const support = probeWebGLSupport();
    setWebglSupport(support);
    setContextLostDetail(null);
    if (support === 'available') setSceneKey((prev) => prev + 1);
  }, []);

  const sceneUnavailable = webglSupport === 'unsupported' || contextLostDetail !== null;

  return (
    <div
      ref={stageRef}
      className="relative w-full h-full select-none overflow-hidden bg-[#FBFBFB]"
      style={{ touchAction: isInteractActive ? 'none' : 'pan-y' }}
    >
      {/* 3D-сцена. Два слоя защиты:
          1) проба WebGL до монтирования <Canvas> — отказ создания WebGLRenderer
             в эффекте R3F не попадает в React-границу ошибок и раньше давал
             пустую сцену без сообщения;
          2) SceneErrorBoundary — ошибки рендера/шейдеров уже внутри <Canvas>;
          3) WebGLContextGuard внутри сцены — потеря контекста на лету.
          Любой из трёх исходов ведёт в один и тот же 2D-фолбэк (SceneFallback). */}
      {sceneUnavailable ? (
        <SceneFallback
          reason={contextLostDetail ? 'Контекст 3D потерян' : 'Показан 2D-разрез панели'}
          detail={contextLostDetail ?? WEBGL_UNAVAILABLE_DETAIL}
          onRetry={handleRetry3D}
          onSelectLayer={onSelect}
        />
      ) : (
      <SceneErrorBoundary onSelectLayer={onSelect}>
      <Canvas
        key={sceneKey}
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

        <WebGLContextGuard onLost={handleContextLost} />

        <PerspectiveCamera
          makeDefault
          position={[2.8, 1.2, 3.4]}
          fov={38}
          near={0.1}
          far={40}
        />

        <CameraRig isInteracting={isInteracting} resetKey={resetKey} mode={mode} />

        <OrbitControls
          ref={controlsRef}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={1.8}
          maxDistance={7.5}
          maxPolarAngle={Math.PI / 2 + 0.05}
          target={[0, 0.05, 0]}
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
          <color attach="background" args={['#33363B']} />
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
            showDimensions={showDimensions}
            clippingPlanes={clippingPlanesArray}
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
      )}

      {/* Floating Cross-Section Tool Dock (Top-Right / Responsive).
          Инструмент управляет 3D-сценой: без неё док не показываем вовсе. */}
      {clippingState.enabled && !sceneUnavailable && (
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
          />
        </div>
      )}

      {/* Floating touch interaction mode & camera reset controls.
          Raised above the mobile action bar (<lg) so the stage controls never sit
          on top of the bar's buttons; desktop keeps the bottom-right corner.
          Без 3D вращать и сбрасывать нечего — контролы скрываются, уступая место
          фолбэку с его кнопкой «Повторить 3D» (иначе они садились на неё). */}
      <div
        id="stage-controls-dock"
        className={`absolute bottom-[4.5rem] lg:bottom-4 right-3 sm:right-4 z-20 items-center gap-2 ${
          sceneUnavailable ? 'hidden' : 'flex'
        }`}
      >
        {/* Cross-Section Tool Trigger Button */}
        <button
          id="cross-section-trigger-btn"
          onClick={handleToggleClipping}
          className={`px-3 py-1.5 rounded-full font-mono text-[11px] tracking-tight flex items-center gap-1.5 border shadow-sm backdrop-blur-md transition-all duration-200 cursor-pointer ${
            clippingState.enabled
              ? 'bg-[#18181B] text-white border-black/20 shadow-md ring-2 ring-sky-500/30'
              : 'bg-white/90 text-[#3F3F46] hover:text-[#18181B] hover:bg-white border-black/[0.08]'
          }`}
          title={
            clippingState.enabled
              ? 'Закрыть инструмент сечения'
              : 'Инструмент сечения (Clipping Plane): послойный разрез панели и обнажение связей'
          }
        >
          <Scissors className={`w-3.5 h-3.5 shrink-0 ${clippingState.enabled ? 'text-sky-400' : 'text-sky-600'}`} />
          <span className="font-medium whitespace-nowrap">
            {clippingState.enabled ? 'Сечение ВКЛ' : 'Сечение'}
          </span>
        </button>

        {/* Specific 'Interact' Toggle Button */}
        <button
          id="orbit-interact-toggle"
          onClick={() => setIsInteractActive((prev) => !prev)}
          className={`px-3 py-1.5 rounded-full font-mono text-[11px] tracking-tight flex items-center gap-1.5 border shadow-sm backdrop-blur-md transition-all duration-200 cursor-pointer ${
            isInteractActive
              ? 'bg-[#18181B] text-white border-[#18181B] shadow-md ring-2 ring-black/10'
              : 'bg-white/90 text-[#3F3F46] hover:text-[#18181B] hover:bg-white border-black/[0.08]'
          }`}
          title={
            isInteractActive
              ? 'Вращение 1 пальцем активно. Нажмите для включения скролла страницы'
              : 'Включить вращение 3D одним пальцем'
          }
        >
          {isInteractActive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
              <Move3d className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">3D Режим Вкл</span>
            </>
          ) : (
            <>
              <Hand className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
              <span className="font-medium whitespace-nowrap">3D Обзор</span>
            </>
          )}
        </button>

        {/* Camera Reset */}
        <button
          id="orbit-reset-camera-btn"
          onClick={resetCamera}
          className="p-2 rounded-full bg-white/90 hover:bg-white text-[#71717A] hover:text-[#18181B] border border-black/[0.08] shadow-sm backdrop-blur-md transition-all duration-200 cursor-pointer"
          title="Сбросить ракурс камеры"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progressive procedural material status indicator + gesture hint.
          Own zone at the top-left of the stage: the bottom strip belongs to the
          comparison pill / mobile action bar / stage controls.
          HUD описывает разрешение текстур живой 3D-сцены — без неё он бессмысленен
          и только накрывал бы 2D-чертёж фолбэка. */}
      <div className={`absolute top-28 sm:top-32 left-3 sm:left-4 z-20 flex-col items-start gap-2 max-w-[calc(100%-1.5rem)] ${
        sceneUnavailable
          ? 'hidden'
          : mode === 'thermal' && stageW > 0 && stageW < 640
          ? 'hidden'
          : clippingState.enabled
          ? 'hidden xl:flex'
          : 'flex'
      }`}>
        <div
          id="progressive-texture-hud"
          className={`px-2.5 py-1.5 rounded-full border shadow-xs backdrop-blur-md transition-all duration-300 flex items-center gap-2 font-mono text-[10.5px] ${
            stage === 'ready'
              ? 'bg-white/90 text-[#3F3F46] border-black/[0.08]'
              : 'bg-[#18181B]/95 text-white border-black/20 shadow-md ring-1 ring-amber-500/25'
          }`}
        >
          {stage !== 'ready' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="text-amber-300 font-semibold tracking-wider text-[9.5px] uppercase whitespace-nowrap">
                {resolution}px Размытие
              </span>
              <span className="text-white/40">→</span>
              <span className="text-white/90 whitespace-nowrap">
                Расчет 512px ({progress}%)
              </span>
              <div className="w-10 h-1.5 rounded-full bg-white/20 overflow-hidden shrink-0">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-medium text-[#27272A] whitespace-nowrap">512px Hi-Res карты</span>
              <button
                id="recalc-progressive-texture-btn"
                onClick={() => recalculate()}
                title="Смоделировать прогрессивную загрузку: 32px размытие → фоновый расчет 512px"
                className="p-0.5 hover:bg-black/5 rounded text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </>
          )}
        </div>

        {/* Discreet gesture indicator pill on desktop / tablet */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/75 backdrop-blur-xs border border-black/[0.04] text-[10px] font-mono text-[#71717A]">
          <span>{isInteractActive ? '1 палец: вращение 3D' : '2 пальца: 3D · 1 палец: скролл'}</span>
        </div>
      </div>
    </div>
  );
};
