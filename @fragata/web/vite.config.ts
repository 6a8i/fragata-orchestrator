import { fileURLToPath, URL } from 'node:url'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, PluginOption } from 'vite'
import vueRouter from 'vue-router/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_XO_REST_HOST } = loadEnv(mode, process.cwd())
  const isDevMode = mode === 'development'

  return {
    base: './',
    plugins: [
      vueRouter({
        dts: isDevMode ? './src/route-map.d.ts' : false,
        exclude: isDevMode ? [] : ['src/pages/dev/**'],
      }),
      vue(),
      vueI18n({
        // The locale JSON files are imported as plain JSON (lazily, see
        // `@core/i18n.ts`), so vue-i18n needs its message compiler at runtime:
        // pre-compiling them here would clash with Vite's own JSON plugin.
        runtimeOnly: false,
      }),
    ] as PluginOption[],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@core': fileURLToPath(new URL('../web-core/lib', import.meta.url)),
        // `@fragata/cron` pulls moment-timezone, whose default entry embeds the
        // full tz database (~700 KB). Schedules only need current rules.
        'moment-timezone': 'moment-timezone/builds/moment-timezone-with-data-1970-2030.js',
      },
    },
    server: {
      proxy: {
        '/api': {
          target: `ws://${VITE_XO_REST_HOST}`,
          ws: true,
        },
        '/rest': {
          target: `http://${VITE_XO_REST_HOST}`,
        },
      },
    },
    optimizeDeps: {
      include: ['value-matcher', 'complex-matcher', 'fragata-remote-parser', '@fragata/cron'],
    },
    test: {
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      alias: {
        // `placement.js` only declares a `module` entry, which the Node-style resolution used by Vitest ignores
        'placement.js': fileURLToPath(new URL('../../node_modules/placement.js/dist/index.es.js', import.meta.url)),
      },
      projects: [
        {
          extends: true,
          test: {
            include: ['**/*.unit.{test,spec}.ts'],
            name: 'unit',
            environment: 'happy-dom',
          },
        },
      ],
    },
  }
})
