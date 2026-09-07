import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  build: {
    // Disable CSS minification. Lightning CSS (Vite's default minifier) collapses
    // identical `backdrop-filter` + `-webkit-backdrop-filter` declarations down to
    // ONLY the -webkit- variant in the production build. Firefox ignores the
    // -webkit- alias and therefore renders the glass panels transparent/unblurred
    // in prod while they look correct in the local dev server. Keeping the CSS
    // unminified guarantees the standard unprefixed `backdrop-filter` property
    // ships to production (the CSS is only ~9 KB, so the size cost is negligible).
    cssMinify: false
  },
})
