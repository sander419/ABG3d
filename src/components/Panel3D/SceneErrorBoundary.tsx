import React from 'react';
import { SceneFallback } from '../UI/SceneFallback';

interface SceneErrorBoundaryProps {
  children: React.ReactNode;
  /** Колбэк выбора слоя — прокидывается в 2D-чертёж, чтобы он остался интерактивным. */
  onSelectLayer?: (id: string) => void;
}

interface SceneErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Страховка вокруг WebGL-сцены.
 *
 * Зачем: 3D-слой зависит от внешних вещей (сеть к CDN окружения, драйвер/WebGL-контекст,
 * компиляция шейдеров). Любая ошибка внутри <Canvas> без ErrorBoundary сносит всё дерево
 * React и виджет превращается в белый прямоугольник на сайте заказчика. Этот boundary
 * вместо белого экрана показывает 2D-архитектурный чертёж и короткое сообщение (общий
 * `SceneFallback` — тот же, что и у пробы поддержки WebGL).
 *
 * Ловит ошибки рендера и асинхронные сбои, которые React перебрасывает в ближайший boundary.
 *
 * Чего boundary не ловит и что закрыто рядом:
 * - отказ создания `WebGLRenderer` внутри `<Canvas>` живёт в эффекте R3F, вне React-границы —
 *   поэтому перед монтированием сцены стоит `probeWebGLSupport` (`PanelScene`);
 * - потеря контекста на лету (`webglcontextlost`) — её ловит `WebGLContextGuard` в `PanelScene`.
 */
export class SceneErrorBoundary extends React.Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  constructor(props: SceneErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
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
    this.setState({ hasError: false, message: '' });
  };

  render(): React.ReactNode {
    const { hasError, message } = this.state;

    if (!hasError) return this.props.children;

    return (
      <SceneFallback
        detail={message}
        onRetry={this.handleRetry}
        onSelectLayer={this.props.onSelectLayer}
      />
    );
  }
}
