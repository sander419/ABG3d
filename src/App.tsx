import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Calculator, Layers3, SlidersHorizontal, X } from 'lucide-react';
import { PanelDemoVariant, WidgetViewMode } from './data/panelConfig';
import { MODE_DEFAULTS, modeChangePatch, scrubPropFor } from './lib/viewMode';
import { readWidgetParamsFromLocation } from './lib/widgetParams';
import { emitWidgetEvent } from './lib/widgetEvents';
import { Header } from './components/UI/Header';
import { PanelSceneSkeleton } from './components/Panel3D/PanelSceneSkeleton';
import { CenterModeCapsule } from './components/UI/CenterModeCapsule';
import { LeftAnatomyRail } from './components/UI/LeftAnatomyRail';
import { RightMetricsRail } from './components/UI/RightMetricsRail';
import { LayerDetailCard } from './components/UI/LayerDetailCard';
import { FallbackBlueprint } from './components/UI/FallbackBlueprint';
import { ProjectCalculatorModal } from './components/UI/ProjectCalculatorModal';
import { EngineerConsultModal } from './components/UI/EngineerConsultModal';
import { ComparisonDrawer } from './components/UI/ComparisonDrawer';
import { AssemblyStoryModal } from './components/UI/AssemblyStoryModal';

const PanelScene = lazy(() => import('./components/Panel3D/PanelScene').then((module) => ({ default: module.PanelScene })));

export const App: React.FC = () => {
  const initialParams = useMemo(() => readWidgetParamsFromLocation(), []);
  const isEmbedded = initialParams.embedded;
  const initialMode: WidgetViewMode = initialParams.mode ?? 'assembled';
  const [viewMode, setViewMode] = useState<WidgetViewMode>(initialMode);
  const [scrubValue, setScrubValue] = useState(MODE_DEFAULTS[initialMode]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [show2DFallback, setShow2DFallback] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(initialParams.overlay === 'calc');
  const [isConsultOpen, setIsConsultOpen] = useState(initialParams.overlay === 'consult');
  const [isComparisonOpen, setIsComparisonOpen] = useState(initialParams.overlay === 'compare');
  const [isAssemblyOpen, setIsAssemblyOpen] = useState(initialParams.overlay === 'assembly');
  const [demoVariant, setDemoVariant] = useState<PanelDemoVariant>('standard');
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'anatomy' | 'metrics'>('none');
  const overlayOpen = isCalcOpen || isConsultOpen || isComparisonOpen || isAssemblyOpen;
  const drawerTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (mobileDrawer === 'none') {
      drawerTriggerRef.current?.focus({ preventScroll: true });
      drawerTriggerRef.current = null;
      return;
    }

    drawerTriggerRef.current = document.activeElement as HTMLElement | null;
    const handleDrawerKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileDrawer('none');
      }
    };

    document.addEventListener('keydown', handleDrawerKeyDown);
    const focusTimer = window.setTimeout(() => {
      document.querySelector<HTMLElement>('#mobile-information-drawer button')?.focus({ preventScroll: true });
    }, 30);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleDrawerKeyDown);
    };
  }, [mobileDrawer]);

  const handleModeChange = (mode: WidgetViewMode) => {
    const patch = modeChangePatch(mode);
    setViewMode(mode);
    setScrubValue(patch.scrubValue);
    if (patch.clearSelection) setSelectedElementId(null);
  };

  useEffect(() => {
    emitWidgetEvent('abg3d:mode', { mode: viewMode });
  }, [viewMode]);
  useEffect(() => {
    const overlay = isCalcOpen ? 'calc' : isConsultOpen ? 'consult' : isComparisonOpen ? 'compare' : isAssemblyOpen ? 'assembly' : null;
    emitWidgetEvent('abg3d:overlay', { overlay, open: overlay !== null });
  }, [isCalcOpen, isConsultOpen, isComparisonOpen, isAssemblyOpen]);

  return (
    <div className="relative flex h-screen h-[100dvh] w-screen flex-col overflow-hidden bg-[#D8D3C9] text-[#181714] antialiased">
      <a href="#main-content" className="abg-skip-link">К модели панели</a>
      {!isEmbedded && <div inert={overlayOpen || mobileDrawer !== 'none' || undefined} aria-hidden={overlayOpen || mobileDrawer !== 'none' || undefined}><Header /></div>}
      <div inert={overlayOpen || mobileDrawer !== 'none' || undefined} aria-hidden={overlayOpen || mobileDrawer !== 'none' || undefined} className="relative min-h-0 flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-10 hidden min-[1180px]:block">
          <div className="pointer-events-auto absolute inset-y-6 left-6 w-[276px] overflow-hidden bg-[#F3F0E9]/95 shadow-[0_28px_90px_rgba(38,34,27,0.12)] ring-1 ring-black/[0.08] backdrop-blur-xl">
            <LeftAnatomyRail selectedId={selectedElementId} onSelect={setSelectedElementId} currentMode={viewMode} />
          </div>
          <div className="pointer-events-auto absolute inset-y-6 right-6 w-[276px] overflow-hidden bg-[#1B1A17]/96 text-[#F3F0E9] shadow-[0_28px_90px_rgba(38,34,27,0.18)] ring-1 ring-black/20 backdrop-blur-xl">
            <RightMetricsRail currentMode={viewMode} onModeChange={handleModeChange} onOpenCalculator={() => setIsCalcOpen(true)} onOpenConsult={() => setIsConsultOpen(true)} onOpenComparison={() => setIsComparisonOpen(true)} onOpenAssembly={() => setIsAssemblyOpen(true)} onToggle2D={() => setShow2DFallback((value) => !value)} is2DActive={show2DFallback} selectedId={selectedElementId} />
          </div>
        </div>
        <main id="main-content" tabIndex={-1} className="relative h-full w-full overflow-hidden">
          <div hidden={show2DFallback} className="pointer-events-none absolute left-1/2 top-4 z-30 max-w-[calc(100vw-1.5rem)] -translate-x-1/2 sm:top-6">
            <CenterModeCapsule currentMode={viewMode} onModeChange={handleModeChange} scrubValue={scrubValue} onScrubChange={setScrubValue} />
          </div>
          {show2DFallback ? (
            <div className="flex h-full w-full items-center justify-center px-3 pb-20 pt-3 min-[1180px]:px-[326px] min-[1180px]:py-6"><FallbackBlueprint onClose={() => setShow2DFallback(false)} onSelectLayer={(id) => { setSelectedElementId(id); setShow2DFallback(false); }} /></div>
          ) : (
            <Suspense fallback={<PanelSceneSkeleton />}><PanelScene mode={viewMode} scrubProgress={scrubPropFor(viewMode, scrubValue)} selectedId={selectedElementId} onSelect={setSelectedElementId} demoVariant={demoVariant} onDemoVariantChange={setDemoVariant} /></Suspense>
          )}
          <LayerDetailCard selectedId={selectedElementId} onClose={() => setSelectedElementId(null)} />
          <nav aria-label="Разделы модели" className="absolute inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex justify-center px-3 min-[1180px]:hidden">
            <div className="flex items-center gap-1 bg-[#F5F2EB]/95 p-1.5 text-[#1B1A17] shadow-[0_18px_54px_rgba(31,28,23,0.2)] ring-1 ring-black/10 backdrop-blur-xl">
              <button onClick={() => setMobileDrawer(mobileDrawer === 'anatomy' ? 'none' : 'anatomy')} aria-expanded={mobileDrawer === 'anatomy'} aria-controls="mobile-information-drawer" className={`flex min-h-11 items-center gap-2 px-3 text-[12px] transition-[background-color,color,transform] active:scale-[0.96] ${mobileDrawer === 'anatomy' ? 'bg-[#1B1A17] text-white' : 'text-[#5F5A51]'}`}><Layers3 className="h-4 w-4" /><span>Слои</span></button>
              <button onClick={() => setMobileDrawer(mobileDrawer === 'metrics' ? 'none' : 'metrics')} aria-expanded={mobileDrawer === 'metrics'} aria-controls="mobile-information-drawer" className={`flex min-h-11 items-center gap-2 px-3 text-[12px] transition-[background-color,color,transform] active:scale-[0.96] ${mobileDrawer === 'metrics' ? 'bg-[#1B1A17] text-white' : 'text-[#5F5A51]'}`}><SlidersHorizontal className="h-4 w-4" /><span>Проект</span></button>
              <button onClick={() => setIsCalcOpen(true)} className="flex min-h-11 items-center gap-2 bg-[#9B805B] px-4 text-[12px] font-medium text-white transition-[background-color,transform] hover:bg-[#856B4A] active:scale-[0.96]"><Calculator className="h-4 w-4" /><span>Расчёт</span></button>
            </div>
          </nav>
        </main>
      </div>
      {mobileDrawer !== 'none' && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-[#181714]/35 backdrop-blur-sm min-[1180px]:hidden" onClick={() => setMobileDrawer('none')}>
          <div id="mobile-information-drawer" role="dialog" aria-modal="true" aria-label={mobileDrawer === 'anatomy' ? 'Слои панели' : 'Параметры проекта'} onClick={(event) => event.stopPropagation()} className={`max-h-[68vh] overflow-hidden px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-28px_80px_rgba(28,25,21,0.2)] ${mobileDrawer === 'anatomy' ? 'bg-[#F3F0E9] text-[#181714]' : 'bg-[#1B1A17] text-[#F3F0E9]'}`}>
            <div className="mb-2 flex justify-end"><button onClick={() => setMobileDrawer('none')} aria-label="Закрыть панель" className="flex h-11 w-11 items-center justify-center text-current opacity-60 transition-[opacity,transform] hover:opacity-100 active:scale-[0.96]"><X className="h-5 w-5" /></button></div>
            <div className="max-h-[calc(68vh-4rem)] overflow-y-auto">
              {mobileDrawer === 'anatomy' ? <LeftAnatomyRail selectedId={selectedElementId} onSelect={(id) => { setSelectedElementId(id); setMobileDrawer('none'); }} currentMode={viewMode} /> : <RightMetricsRail currentMode={viewMode} onModeChange={handleModeChange} onOpenCalculator={() => { setMobileDrawer('none'); setIsCalcOpen(true); }} onOpenConsult={() => { setMobileDrawer('none'); setIsConsultOpen(true); }} onOpenComparison={() => { setMobileDrawer('none'); setIsComparisonOpen(true); }} onOpenAssembly={() => { setMobileDrawer('none'); setIsAssemblyOpen(true); }} onToggle2D={() => { setMobileDrawer('none'); setShow2DFallback((value) => !value); }} is2DActive={show2DFallback} selectedId={selectedElementId} />}
            </div>
          </div>
        </div>
      )}
      <ProjectCalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
      <EngineerConsultModal isOpen={isConsultOpen} onClose={() => setIsConsultOpen(false)} />
      <ComparisonDrawer isOpen={isComparisonOpen} onClose={() => setIsComparisonOpen(false)} onOpenCalculator={() => { setIsComparisonOpen(false); setIsCalcOpen(true); }} />
      <AssemblyStoryModal isOpen={isAssemblyOpen} onClose={() => setIsAssemblyOpen(false)} onOpenCalculator={() => { setIsAssemblyOpen(false); setIsCalcOpen(true); }} />
    </div>
  );
};

export default App;
