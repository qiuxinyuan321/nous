/**
 * 主题目录
 * --------
 * 每个主题是一组 CSS 变量 override,应用时写入 document.documentElement.style。
 * preview 里三色用于 ThemePicker 缩略图。
 */

export type ThemeKind = 'light' | 'dark'

export interface ThemeDef {
  id: string
  name: { 'zh-CN': string; 'en-US': string }
  description: { 'zh-CN': string; 'en-US': string }
  author: string
  kind: ThemeKind
  preview: { paper: string; ink: string; accent: string }
  /** CSS 变量覆盖 (只写需要与默认不同的) */
  vars: Record<string, string>
}

export const THEME_CATALOG: ThemeDef[] = [
  {
    id: 'rice',
    name: { 'zh-CN': '宣纸', 'en-US': 'Rice Paper' },
    description: {
      'zh-CN': '默认亮色 · 宣纸米白 + 浓墨 + 朱砂',
      'en-US': 'Default light — ivory paper + deep ink + cinnabar',
    },
    author: 'Nous',
    kind: 'light',
    preview: { paper: '#FAF7EF', ink: '#1C1B19', accent: '#B8372F' },
    vars: {
      '--paper-rice': '#FAF7EF',
      '--paper-aged': '#F2EBD8',
      '--ink-heavy': '#1C1B19',
      '--ink-medium': '#4A4842',
      '--ink-light': '#8B8880',
      '--cinnabar': '#B8372F',
      '--celadon': '#6B8E7A',
      '--indigo-stone': '#3E5871',
      '--gold-leaf': '#B8955A',
    },
  },
  {
    id: 'ink',
    name: { 'zh-CN': '深墨', 'en-US': 'Deep Ink' },
    description: {
      'zh-CN': '默认暗色 · 夜墨底 + 月白字',
      'en-US': 'Default dark — ink night + moonlight letters',
    },
    author: 'Nous',
    kind: 'dark',
    preview: { paper: '#1A1814', ink: '#E8E3D5', accent: '#D0554D' },
    vars: {
      '--paper-rice': '#1A1814',
      '--paper-aged': '#24211C',
      '--ink-heavy': '#E8E3D5',
      '--ink-medium': '#B9B4A6',
      '--ink-light': '#7A7669',
      '--cinnabar': '#D0554D',
      '--celadon': '#89AE9B',
      '--indigo-stone': '#6F8AA8',
      '--gold-leaf': '#D7B580',
    },
  },
  {
    id: 'celadon',
    name: { 'zh-CN': '青瓷', 'en-US': 'Celadon' },
    description: {
      'zh-CN': '宋代青釉 · 冷静理性,适合深度思考',
      'en-US': 'Song-era celadon — calm, for deep focus',
    },
    author: 'Nous',
    kind: 'light',
    preview: { paper: '#EEF1EC', ink: '#243028', accent: '#6B8E7A' },
    vars: {
      '--paper-rice': '#EEF1EC',
      '--paper-aged': '#DDE4DC',
      '--ink-heavy': '#243028',
      '--ink-medium': '#48574E',
      '--ink-light': '#8A988F',
      '--cinnabar': '#B8372F',
      '--celadon': '#5A7E68',
      '--indigo-stone': '#3E5871',
      '--gold-leaf': '#A68B52',
    },
  },
  {
    id: 'cinnabar-gold',
    name: { 'zh-CN': '朱金', 'en-US': 'Cinnabar Gold' },
    description: {
      'zh-CN': '朱砂底 + 泥金字 · 浓烈暖调,创作型专用',
      'en-US': 'Cinnabar ground + gold script — warm, for creative flow',
    },
    author: 'Nous',
    kind: 'light',
    preview: { paper: '#F7EDD8', ink: '#3E2411', accent: '#B8372F' },
    vars: {
      '--paper-rice': '#F7EDD8',
      '--paper-aged': '#EEDEB8',
      '--ink-heavy': '#3E2411',
      '--ink-medium': '#6A4425',
      '--ink-light': '#9C7A52',
      '--cinnabar': '#AE2E26',
      '--celadon': '#7A8E5B',
      '--indigo-stone': '#4A5871',
      '--gold-leaf': '#B8955A',
    },
  },
  {
    id: 'bamboo-smoke',
    name: { 'zh-CN': '烟竹', 'en-US': 'Bamboo Smoke' },
    description: {
      'zh-CN': '烟灰 + 竹青 · 中性淡雅,长时间阅读友好',
      'en-US': 'Smoky gray + bamboo green — gentle on the eyes',
    },
    author: 'Nous',
    kind: 'light',
    preview: { paper: '#F3F1EB', ink: '#2A2A28', accent: '#7A8D6A' },
    vars: {
      '--paper-rice': '#F3F1EB',
      '--paper-aged': '#E4E2DA',
      '--ink-heavy': '#2A2A28',
      '--ink-medium': '#4F4F4A',
      '--ink-light': '#8F8D85',
      '--cinnabar': '#A8473E',
      '--celadon': '#7A8D6A',
      '--indigo-stone': '#506375',
      '--gold-leaf': '#A88B5E',
    },
  },
]

export const DEFAULT_THEME_ID = 'rice'

export function getTheme(id: string): ThemeDef {
  return THEME_CATALOG.find((t) => t.id === id) ?? THEME_CATALOG[0]
}

/** 生成用于 inline script 的极简 apply 代码 (避免首帧闪白) */
export function applyThemeScript(): string {
  const json = JSON.stringify(
    THEME_CATALOG.reduce<Record<string, Record<string, string>>>((acc, t) => {
      acc[t.id] = t.vars
      return acc
    }, {}),
  )
  // 从 localStorage 读 themeId,没有则用 rice
  return `
(function() {
  try {
    var catalog = ${json};
    var id = localStorage.getItem('nous-theme') || '${DEFAULT_THEME_ID}';
    var vars = catalog[id] || catalog['${DEFAULT_THEME_ID}'];
    var root = document.documentElement;
    for (var k in vars) root.style.setProperty(k, vars[k]);
    root.dataset.theme = id;
  } catch (e) {}
})();
`.trim()
}
