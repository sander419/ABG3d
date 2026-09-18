import React, { useState, Suspense } from 'react';
import { WidgetViewMode } from './data/panelConfig';
import { Header } from './components/UI/Header';
import { PanelScene } from './components/Panel3D/PanelScene';
import { PanelSceneSkeleton } from './components/Panel3D/PanelSceneSkeleton';
import { CenterModeCapsule } from './components/UI/CenterModeCapsule';
import { LeftAnatomyRail } from './components/UI/LeftAnatomyRail';
import { RightMetricsRail } from './components/UI/RightMetricsRail';
import { LayerDetailCard } from './components/UI/LayerDetailCard';
import { FallbackBlueprint } from './components/UI/FallbackBlueprint';
import { ProjectCalculatorModal } from './components/UI/ProjectCalculatorModal';
import { EngineerConsultModal } from './components/UI/EngineerConsultModal';
import { ComparisonDrawer } from './components/UI/ComparisonDrawer';
import { Layers, Sliders, X, FileText, Calculator, HelpCircle, Columns } from 'lucide-react';

export const App: React.FC = () => {
  // Default to 'exploded' view mode so the user immediately sees the precast sandwich layers and Peikko ties
  const [viewMode, setViewMode] = useState<WidgetViewMode>('exploded');
  const [scrubValue, setScrubValue] = useState<number>(1.0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [show2DFallback, setShow2DFallback] = useState<boolean>(false);

  // Modals state
  const [isCalcOpen, setIsCalcOpen] = useState<boolean>(false);
  const [isConsultOpen, setIsConsultOpen] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);

  // Mobile drawer state ('none' | 'anatomy' | 'metrics')
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'anatomy' | 'metrics'>('none');

  const handleModeChange = (mode: WidgetViewMode) => {
    setViewMode(mode);
    if (mode === 'assembled') {
      setScrubValue(0);
      setSelectedElementId(null);
    } else if (mode === 'exploded') {
      setScrubValue(1.0);
    } else if (mode === 'structure') {
      setScrubValue(0.5);
    } else if (mode === 'thermal') {
      setScrubValue(0.15);
      setSelectedElementId(null);
    }
  };

  return (
    <div className="h-screen h-[100dvh] w-screen overflow-hidden select-none bg-[#FBFBFB] text-[#18181B] flex flex-col relative font-sans antialiased">
      {/* Background subtle architectural hair-grid */}
      <div className="absolute inset-0 gallery-grid pointer-events-none opacity-50 z-0" />

      {/* 1. Ultra-slim Swiss Micro-Header (48px) */}
      <Header />

      {/* 2. Main Zero-Scroll 3-Column Studio Layout */}
      <div className="flex-1 w-full min-h-0 relative flex overflow-hidden z-10">
        {/* DESKTOP LEFT COLUMN: АНАТОМИЯ И КОНСТРУКТИВ PEIKKO */}
        <div className="hidden lg:flex w-[320px] xl:w-[350px] shrink-0 h-full border-r border-black/[0.04] bg-[#FBFBFB]/80 backdrop-blur-xs flex-col z-20">
          <LeftAnatomyRail
            selectedId={selectedElementId}
            onSelect={(id) => setSelectedElementId(id)}
            currentMode={viewMode}
          />
        </div>

        {/* CENTER STAGE: 3D-СЦЕНА & ПАРИРУЮЩИЙ РЕЖИМНЫЙ КОНТРОЛЛЕР */}
        <main className="flex-1 h-full relative flex flex-col min-w-0 z-10 overflow-hidden">
          {/* Floating State Machine Capsule (Rond Design Lab Floating Text Capsule) */}
          <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <CenterModeCapsule
              currentMode={viewMode}
              onModeChange={handleModeChange}
              scrubValue={scrubValue}
              onScrubChange={(val) => setScrubValue(val)}
              showDimensions={showDimensions}
              onToggleDimensions={() => setShowDimensions(!showDimensions)}
            />
          </div>

          {/* Interactive 3D Model Scene or 2D Architectural Blueprint */}
          {show2DFallback ? (
            <div className="w-full h-full p-4 sm:p-8 flex items-center justify-center">
              <FallbackBlueprint
                onClose={() => setShow2DFallback(false)}
                onSelectLayer={(id) => setSelectedElementId(id)}
              />
            </div>
          ) : (
            <Suspense fallback={<PanelSceneSkeleton />}>
              <PanelScene
                mode={viewMode}
                scrubProgress={viewMode === 'exploded' ? scrubValue : undefined}
                selectedId={selectedElementId}
                onSelect={(id) => setSelectedElementId(id)}
                showDimensions={showDimensions}
              />
            </Suspense>
          )}

          {/* Selected Layer Micro-Placard (Center Bottom) */}
          <LayerDetailCard
            selectedId={selectedElementId}
            onClose={() => setSelectedElementId(null)}
          />

          {/* Discreet Bottom Anchor: Comparison Trigger Pill.
              Visible only from xl up: below that the floating pill would collide with the
              mobile action bar (App.tsx:118) or the stage controls (PanelScene.tsx:376),
              and the very same action already lives in the right rail
              (RightMetricsRail «ABG VS ГАЗОБЕТОН (ТАБЛИЦА)»). */}
          <div className="hidden xl:flex absolute bottom-4 left-4 z-20 items-center">
            <button
              onClick={() => setIsComparisonOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-white/85 hover:bg-white text-[#3F3F46] hover:text-[#18181B] text-[10px] font-mono uppercase tracking-[0.18em] border border-black/[0.06] shadow-xs backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>Почему не просто бетон? ABG vs Газобетон</span>
            </button>
          </div>

          {/* MOBILE BOTTOM MICRO-BAR (< 1024px) */}
          <div className="lg:hidden absolute bottom-3 left-0 right-0 z-30 px-3 flex items-center justify-center gap-2 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 backdrop-blur-xl border border-black/[0.06] shadow-sm">
              <button
                onClick={() => setMobileDrawer(mobileDrawer === 'anatomy' ? 'none' : 'anatomy')}
                className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  mobileDrawer === 'anatomy'
                    ? 'bg-[#18181B] text-white'
                    : 'text-[#52525B] hover:text-[#18181B]'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Анатомия</span>
              </button>

              <button
                onClick={() => setMobileDrawer(mobileDrawer === 'metrics' ? 'none' : 'metrics')}
                className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  mobileDrawer === 'metrics'
                    ? 'bg-[#18181B] text-white'
                    : 'text-[#52525B] hover:text-[#18181B]'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Показатели</span>
              </button>

              <button
                onClick={() => setIsCalcOpen(true)}
                className="px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider bg-[#18181B] text-white flex items-center gap-1"
              >
                <Calculator className="w-3 h-3" />
                <span>Расчет</span>
              </button>
            </div>
          </div>
        </main>

        {/* DESKTOP RIGHT COLUMN: ИНТЕРАКТИВНЫЕ ПРЕИМУЩЕСТВА & CTA */}
        <div className="hidden lg:flex w-[300px] xl:w-[330px] shrink-0 h-full border-l border-black/[0.04] bg-[#FBFBFB]/80 backdrop-blur-xs flex-col z-20">
          <RightMetricsRail
            currentMode={viewMode}
            onModeChange={handleModeChange}
            onOpenCalculator={() => setIsCalcOpen(true)}
            onOpenConsult={() => setIsConsultOpen(true)}
            onOpenComparison={() => setIsComparisonOpen(true)}
            onToggle2D={() => setShow2DFallback(!show2DFallback)}
            is2DActive={show2DFallback}
            selectedId={selectedElementId}
          />
        </div>
      </div>

      {/* MOBILE EXPANDABLE DRAWER (< 1024px) */}
      {mobileDrawer !== 'none' && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end bg-black/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-h-[72vh] bg-[#FBFBFB] rounded-t-3xl border-t border-black/10 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] p-4 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Drag handle & close */}
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.04]">
              <div className="w-12 h-1 rounded-full bg-[#D4D4D8] mx-auto" />
              <button
                onClick={() => setMobileDrawer('none')}
                className="p-1 rounded-full text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-2">
              {mobileDrawer === 'anatomy' ? (
                <LeftAnatomyRail
                  selectedId={selectedElementId}
                  onSelect={(id) => {
                    setSelectedElementId(id);
                    setMobileDrawer('none');
                  }}
                  currentMode={viewMode}
                />
              ) : (
                <RightMetricsRail
                  currentMode={viewMode}
                  onModeChange={handleModeChange}
                  onOpenCalculator={() => {
                    setMobileDrawer('none');
                    setIsCalcOpen(true);
                  }}
                  onOpenConsult={() => {
                    setMobileDrawer('none');
                    setIsConsultOpen(true);
                  }}
                  onOpenComparison={() => {
                    setMobileDrawer('none');
                    setIsComparisonOpen(true);
                  }}
                  onToggle2D={() => {
                    setMobileDrawer('none');
                    setShow2DFallback(!show2DFallback);
                  }}
                  is2DActive={show2DFallback}
                  selectedId={selectedElementId}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Interactive Calculation Modal [РАССЧИТАТЬ ПРОЕКТ] */}
      <ProjectCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
      />

      {/* 4. Interactive Engineering Question Modal [СПРОСИТЬ ИНЖЕНЕРА] */}
      <EngineerConsultModal
        isOpen={isConsultOpen}
        onClose={() => setIsConsultOpen(false)}
      />

      {/* 5. Interactive Comparison Sheet [ABG vs ГАЗОБЕТОН] */}
      <ComparisonDrawer
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        onOpenCalculator={() => {
          setIsComparisonOpen(false);
          setIsCalcOpen(true);
        }}
      />
    </div>
  );
};

export default App;
