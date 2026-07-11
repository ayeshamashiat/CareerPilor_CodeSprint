import { create } from 'zustand'

const applyTheme = (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

const getInitialTheme = () => {
  const stored = localStorage.getItem('theme')
  return stored === 'dark' ? 'dark' : 'light'
}

const initialTheme = getInitialTheme()
applyTheme(initialTheme)

const useThemeStore = create((set, get) => ({
  theme: initialTheme,

  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    applyTheme(theme)
    set({ theme })
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
}))

export default useThemeStore
