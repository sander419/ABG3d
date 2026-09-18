import React, { useState } from 'react';
import { FallbackBlueprint } from './FallbackBlueprint';

interface SceneFallbackProps {
  /** Причина простым языком (строка в плашке сверху). */
  reason?: string;
  /** Техническая деталь для разработчика: мелкий моноширинный текст снизу. */
  detail?: string;
  /** Что доступно пользователю вместо 3D. */
  availableHint?: string;
  onRetry: () => void;
  /** Колбэк выбора слоя — прокидывается в 2D-чертёж, чтобы он остался интерактивным. */
  onSelectLayer?: (id: string) => void;
}

/**
 * Единый 2D-фолбэк сцены. Используется всеми тремя исходами «3D не работает»:
 * пробой поддержки WebGL до монтирования `<Canvas>`, границей ошибок рендера
 * (`SceneErrorBoundary`) и сторожем потери контекста (`WebGLContextGuard`).
 *
 * Раскладка подчинена оверлеям сцены, которые остаются поверх: сверху капсула
 * режимов (`top-4/top-6`, низ ~101 px), снизу пилюли-подсказки (последние ~45 px).
 * Поэтому у корня жёсткие вертикальные отступы: сообщение и «Повторить 3D» не
 * уезжают под оверлеи и остаются кликабельными.
 */
export const SceneFallback: React.FC<SceneFallbackProps> = ({
  reason = 'Показан 2D-разрез панели',
  detail,
  availableHint = 'Интерактивная 3D-модель не запустилась на этом устройстве. Все характеристики панели доступны в разделах «Анатомия» и «Показатели».',
  onRetry,
  onSelectLayer,
}) => {
  const [blueprintDismissed, setBlueprintDismissed] = useState(false);

  return (
    <div
      data-scene-fallback
      className="absolute inset-0 flex flex-col gap-2 px-3 sm:px-5 pt-[6.75rem] sm:pt-[7.25rem] pb-[5.5rem] lg:pb-12 overflow-y-auto"
    >
      {!blueprintDismissed ? (
        <>
          <div className="shrink-0 w-full flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#71717A]">
            <span className="px-2.5 py-1 rounded-full bg-[#18181B] text-white">3D недоступно</span>
            <span>{reason}</span>
          </div>

          {/* Чертёж забирает всю свободную высоту, но не навязывает минимум:
              на низком вьюпорте (≈480 px) карточка сжимается и скроллится внутри
              себя, а строка с «Повторить 3D» остаётся видимой. */}
          <div className="flex-1 min-h-0 w-full flex items-stretch justify-center">
            <FallbackBlueprint
              onClose={() => setBlueprintDismissed(true)}
              onSelectLayer={onSelectLayer ?? (() => {})}
            />
          </div>
        </>
      ) : (
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-3 text-center">
          <span className="px-2.5 py-1 rounded-full bg-[#18181B] text-white font-mono text-[10px] uppercase tracking-[0.18em]">
            3D недоступно
          </span>
          <p className="max-w-sm text-sm text-[#52525B]">{availableHint}</p>
        </div>
      )}

      <div className="shrink-0 w-full flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-mono text-[#A1A1AA]">
        {detail ? <span className="max-w-full truncate">{detail}</span> : null}
        <button
          type="button"
          onClick={onRetry}
          className="px-3 py-1 rounded-full border border-black/[0.08] bg-white/90 hover:bg-white text-[#3F3F46] hover:text-[#18181B] transition-colors cursor-pointer"
        >
          Повторить 3D
        </button>
      </div>
    </div>
  );
};
