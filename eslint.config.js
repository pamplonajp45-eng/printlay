import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // _base_* files are UTF-16 encoded reference snapshots, not build sources
  globalIgnores(['dist', '_base_*.jsx']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Node-backed files: serverless API handler and Vite config
    files: ['api/**/*.js', 'vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
