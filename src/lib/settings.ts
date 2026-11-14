import type { Settings } from '../types'

const DEFAULTS: Settings = { theme: 'system', dailyCount: 10 }

export function loadSettings(): Settings {
  try {
    const theme = localStorage.getItem('theme')
    const dailyCount = Number(localStorage.getItem('dailyCount'))
    return {
      theme: theme === 'light' || theme === 'dark' ? theme : 'system',
      dailyCount: Number.isInteger(dailyCount) && dailyCount >= 3 && dailyCount <= 30 ? dailyCount : DEFAULTS.dailyCount,
    }
  } catch {
    return DEFAULTS
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem('theme', s.theme)
    localStorage.setItem('dailyCount', String(s.dailyCount))
  } catch {
    // 保存できなくても既定値で動く
  }
  applyTheme(s.theme)
}

export function applyTheme(theme: Settings['theme']): void {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}
