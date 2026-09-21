import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': import.meta.dirname,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // three-vendor is ~740 kB by design and loads lazily with the 3D scene.
      chunkSizeWarningLimit: 800,
      // Keep the interactive 3D runtime out of the application shell. The widget
      // paints its rails and dialogs from the small shell chunks while Three.js is
      // fetched by the lazy PanelScene import, and repeat visits reuse the vendor
      // chunks. React gets its own group: left alone, the bundler parks it inside
      // the 3D chunk and the whole 1.2 MB is preloaded on first paint.
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'react-vendor', test: /node_modules[\/](react|react-dom|scheduler)[\/]/, priority: 30 },
              { name: 'three-vendor', test: /node_modules[\/]three[\/]/, priority: 20 },
              { name: 'r3f-vendor', test: /node_modules[\/](@react-three|maath|three-stdlib|meshline|troika-[^\/]+)[\/]/, priority: 10 },
            ],
          },
        },
      },
    },
  };
});
