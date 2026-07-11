import { Sun, Moon } from 'lucide-react'
import useThemeStore from '../store/themeStore'

export default function ThemeToggle({ className = '' }) {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors duration-200
        border-gray-200 text-gray-500 hover:text-violet-600 hover:border-violet-300
        dark:border-white/10 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:border-violet-500/40 ${className}`}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
