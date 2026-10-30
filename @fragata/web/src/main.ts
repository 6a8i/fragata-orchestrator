import { formValidationConfig } from '@/plugins/form-validation.config.ts'
import i18n, { setLocale } from '@core/i18n.ts'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'
import { RegleVuePlugin } from '@regle/core'
import { createPinia } from 'pinia'
import Cookies from 'universal-cookie'
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { handleHotUpdate, routes } from 'vue-router/auto-routes'
import App from './App.vue'
import '@fragata/web-core/assets/css/base.pcss'
import '@core/assets/css/_themes.pcss'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

async function init() {
  // Only English ships in the main bundle: load the persisted locale (if any)
  // before anything is rendered so the first paint is already translated.
  await setLocale(new Cookies().get<string | undefined>('lang'))

  const app = createApp(App)

  const router = createRouter({
    history: createWebHashHistory(),
    routes,
  })

  if (import.meta.hot) {
    handleHotUpdate(router)
  }

  app.use(i18n)
  app.use(createPinia())
  app.use(router)
  app.use(RegleVuePlugin, formValidationConfig)

  try {
    await router.isReady()
  } catch (error) {
    console.error('Initial navigation failed', error)
  }

  router.afterEach(() => useOverlayStore().abortAll())

  app.mount('#app')
}

init()
