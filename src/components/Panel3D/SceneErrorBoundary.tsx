import React from 'react';
import { FallbackBlueprint } from '../UI/FallbackBlueprint';

interface SceneErrorBoundaryProps {
  children: React.ReactNode;
  /** Колбэк выбора слоя — прокидывается в 2D-чертёж, чтобы он остался интерактивным. */
  onSelectLayer?: (id: string) => void;
}

interface SceneErrorBoundaryState {
  hasError: boolean;
  message: string;
  blueprintDismissed: boolean;
}

/**
 * Страховка вокруг WebGL-сцены.
 *
 * Зачем: 3D-слой зависит от внешних вещей (сеть к CDN окружения, драйвер/WebGL-контекст,
 * компиляция шейдеров). Любая ошибка внутри <Canvas> без ErrorBoundary сносит всё дерево
 * React и виджет превращается в белый прямоугольник на сайте заказчика. Этот boundary
 * вместо белого экрана показывает 2D-архитектурный чертёж и короткое сообщение.
 *
 * Ловит ошибки рендера и асинхронные сбои, которые React перебрасывает в ближайший boundary.
 */
export class SceneErrorBoundary extends React.Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  constructor(props: SceneErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '', blueprintDismissed: false };
  }

  static getDerivedStateFromError(error: unknown): Partial<SceneErrorBoundaryState> {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error ?? 'unknown'),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    // Оставляем след в консоли: по нему ищут причину, когда виджет «не открылся».
    console.error('[ABG3d] 3D-сцена упала, включён 2D-фолбэк:', error, info?.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, message: '', blueprintDismissed: false });
  };

  render(): React.ReactNode {
    const { hasError, message, blueprintDismissed } = this.state;
    const { children, onSelectLayer } = this.props;

    if (!hasError) return children;

    if (!blueprintDismissed) {
      return (
        <div className="w-full h-full p-4 sm:p-8 flex flex-col items-center justify-center gap-3 overflow-auto">
          <div className="w-full max-w-3xl flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#71717A]">
            <span className="px-2.5 py-1 rounded-full bg-[#18181B] text-white">3D недоступно</span>
            <span>Показан 2D-разрез панели</span>
          </div>
          <FallbackBlueprint
            onClose={() => this.setState({ blueprintDismissed: true })}
            onSelectLayer={onSelectLayer ?? (() => {})}
          />
          <div className="max-w-3xl w-full flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-[#A1A1AA]">
            <span className="truncate max-w-full">{message}</span>
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-3 py-1 rounded-full border border-black/[0.08] bg-white/90 hover:bg-white text-[#3F3F46] hover:text-[#18181B] transition-colors cursor-pointer"
            >
              Повторить 3D
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="px-2.5 py-1 rounded-full bg-[#18181B] text-white font-mono text-[10px] uppercase tracking-[0.18em]">
          3D недоступно
        </span>
        <p className="max-w-sm text-sm text-[#52525B]">
          Интерактивная 3D-модель не запустилась на этом устройстве. Все характеристики панели
          доступны в разделах «Анатомия» и «Показатели».
        </p>
        <button
          type="button"
          onClick={this.handleRetry}
          className="px-3.5 py-1.5 rounded-full border border-black/[0.08] bg-white/90 hover:bg-white text-[#3F3F46] hover:text-[#18181B] text-[11px] font-mono uppercase tracking-[0.18em] transition-colors cursor-pointer"
        >
          Повторить 3D
        </button>
      </div>
    );
  }
}
