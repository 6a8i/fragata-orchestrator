import en from './locales/en.json'
import type { WritableComputedRef } from 'vue'
import { createI18n } from 'vue-i18n'

interface Locales {
  [key: string]: {
    code: string
    name: string
  }
}

export const DEFAULT_LOCALE = 'en'

export const locales: Locales = {
  en: {
    code: 'en',
    name: 'English',
  },
  es: {
    code: 'es',
    name: 'Español',
  },
  fr: {
    code: 'fr',
    name: 'Français',
  },
  de: {
    code: 'de',
    name: 'Deutsch',
  },
  fa: {
    code: 'fa',
    name: 'Persian',
  },
  cs: {
    code: 'cs',
    name: 'čeština',
  },
  sv: {
    code: 'sv',
    name: 'Svenska',
  },
  it: {
    code: 'it',
    name: 'Italiano',
  },
  ru: {
    code: 'ru',
    name: 'Русский',
  },
  uk: {
    code: 'uk',
    name: 'Українська',
  },
  nl: {
    code: 'nl',
    name: 'Nederlands',
  },
  'pt-BR': {
    code: 'pt-BR',
    name: 'Português (Brasil)',
  },
  da: {
    code: 'da',
    name: 'Danish',
  },
  ko: {
    code: 'ko',
    name: '한국어',
  },
  'nb-NO': {
    code: 'nb-NO',
    name: 'Norsk (Bokmål)',
  },
  ja: {
    code: 'ja',
    name: '日本語',
  },
  fi: {
    code: 'fi',
    name: 'Suomi',
  },
  pl: {
    code: 'pl',
    name: 'Polski',
  },
  'zh-Hans': {
    code: 'zh-Hans',
    name: '中文（简体）',
  },
  sk: {
    code: 'sk',
    name: 'Slovenčina',
  },
  pt: {
    code: 'pt',
    name: 'Português',
  },
  ar: {
    code: 'ar',
    name: 'العربية',
  },
  tr: {
    code: 'tr',
    name: 'Türkçe',
  },
}

/** Every locale the UI can be switched to, loaded or not */
export const availableLocales = Object.keys(locales)

const PERCENT_FORMAT = {
  percent: {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
} as const

const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  // Only the default locale ships in the main bundle: the others are loaded
  // on demand by `loadLocale`, each as its own chunk.
  messages: { [DEFAULT_LOCALE]: en },
  missing: (locale, key, vm) => {
    if (!import.meta.env.DEV) {
      return key
    }

    console.warn(`i18n key not found: ${key}`, `Used in ${vm?.type.__name ?? 'unknown component'}`)

    return `🌎❗⟨${key}⟩`
  },
  numberFormats: {
    en: PERCENT_FORMAT,
    es: PERCENT_FORMAT,
    fr: PERCENT_FORMAT,
    de: PERCENT_FORMAT,
    fa: PERCENT_FORMAT,
  },
})

export default i18n

// `createI18n` narrows the locale type to the keys of `numberFormats`; the UI
// supports every key of `locales`.
const currentLocale = i18n.global.locale as WritableComputedRef<string>

type LocaleModule = { default: typeof en }

// `./locales/en.json` is already imported statically, so Vite only emits a
// chunk for each of the other files.
const localeLoaders = import.meta.glob<LocaleModule>('./locales/*.json')

const loadedLocales = new Set<string>([DEFAULT_LOCALE])
const pendingLoads = new Map<string, Promise<void>>()

export function isSupportedLocale(code: string | undefined | null): code is keyof typeof locales & string {
  return code != null && Object.prototype.hasOwnProperty.call(locales, code)
}

/**
 * Fetch the messages of `code` (once) and register them in the i18n instance.
 *
 * Resolves immediately for the default locale and for locales already loaded.
 */
export function loadLocale(code: string): Promise<void> {
  if (loadedLocales.has(code)) {
    return Promise.resolve()
  }

  const pending = pendingLoads.get(code)

  if (pending !== undefined) {
    return pending
  }

  const loader = localeLoaders[`./locales/${code}.json`]

  if (loader === undefined) {
    return Promise.reject(new Error(`Unknown locale: ${code}`))
  }

  const promise = loader()
    .then(module => {
      i18n.global.setLocaleMessage(code, module.default)
      loadedLocales.add(code)
    })
    .finally(() => pendingLoads.delete(code))

  pendingLoads.set(code, promise)

  return promise
}

/**
 * Switch the UI to `code`, loading its messages first when needed.
 *
 * Unknown or missing codes fall back to the default locale.
 */
export async function setLocale(code: string | undefined | null): Promise<void> {
  const target = isSupportedLocale(code) ? code : DEFAULT_LOCALE

  try {
    await loadLocale(target)
  } catch (error) {
    console.error(`Unable to load locale "${target}", falling back to "${DEFAULT_LOCALE}"`, error)
    currentLocale.value = DEFAULT_LOCALE
    return
  }

  currentLocale.value = target
}
