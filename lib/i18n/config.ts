export const locales = ['zh-CN', 'en-US'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'zh-CN'

export const localeLabels: Record<Locale, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English',
}

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale)
}
