/**
 * Проба поддержки WebGL — ДО монтирования <Canvas>.
 *
 * Зачем: если браузер не отдаёт WebGL-контекст (старый Android, корпоративная
 * политика с отключённым аппаратным рендером, выключенное GPU-ускорение), three
 * внутри <Canvas> не может создать `WebGLRenderer`. Момент создания рендерера живёт
 * в эффекте R3F, то есть вне React-границы ошибок: пользователь видел живые кнопки
 * и режимы, но пустую сцену — без сообщения, без 2D-чертежа и без «Повторить 3D».
 *
 * Теперь мы спрашиваем браузер сами и, если WebGL нет, сразу показываем 2D-фолбэк
 * (`SceneFallback`), а <Canvas> вообще не монтируем.
 */

export type WebGLAvailability = 'available' | 'unsupported';

export interface WebGLProbeOptions {
  /** Инъекция для тестов: как создать пробный канвас. */
  createCanvas?: () => HTMLCanvasElement | null;
}

/** Порядок тот же, что и у three: сначала WebGL2, затем WebGL1 и его legacy-алиас. */
export const PROBE_CONTEXT_IDS = ['webgl2', 'webgl', 'experimental-webgl'] as const;

export function createProbeCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  try {
    return document.createElement('canvas');
  } catch {
    return null;
  }
}

/**
 * Освобождает пробный контекст. Браузер держит ~16 живых WebGL-контекстов на
 * страницу, и брошенный пробный канвас отнимал бы один слот у настоящей сцены.
 */
function releaseProbeContext(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
  try {
    const lose = gl.getExtension('WEBGL_lose_context');
    lose?.loseContext();
  } catch {
    /* не критично: канвас всё равно уйдёт в сборщик мусора */
  }
}

export function probeWebGLSupport(options: WebGLProbeOptions = {}): WebGLAvailability {
  const createCanvas = options.createCanvas ?? createProbeCanvas;

  let canvas: HTMLCanvasElement | null = null;
  try {
    canvas = createCanvas();
  } catch {
    return 'unsupported';
  }

  // Нет DOM (SSR, юнит-тесты без браузера) — судить о поддержке нельзя.
  // Не глушим 3D из-за отсутствия document, этим занимается реальная проба в браузере.
  if (!canvas) return 'available';

  for (const id of PROBE_CONTEXT_IDS) {
    try {
      const gl = canvas.getContext(id) as WebGLRenderingContext | WebGL2RenderingContext | null;
      if (gl) {
        releaseProbeContext(gl);
        return 'available';
      }
    } catch {
      /* некоторые браузеры кидают на неизвестном context id — пробуем следующий */
    }
  }

  return 'unsupported';
}
