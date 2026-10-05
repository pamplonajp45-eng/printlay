import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

function localFeedbackApiPlugin() {
  return {
    name: 'local-feedback-api',
    configureServer(server) {
      const dataDir = path.resolve(process.cwd(), '.data')
      const dataFile = path.resolve(dataDir, 'feedback.json')

      function ensureStore() {
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true })
        }
        if (!fs.existsSync(dataFile)) {
          fs.writeFileSync(dataFile, JSON.stringify({ items: [] }, null, 2), 'utf8')
        }
        try {
          return JSON.parse(fs.readFileSync(dataFile, 'utf8'))
        } catch {
          return { items: [] }
        }
      }

      function saveStore(data) {
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8')
      }

      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : ''
        if (url !== '/api/feedback') {
          return next()
        }

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-feedback-key')

        if (req.method === 'OPTIONS') {
          res.statusCode = 200
          return res.end()
        }

        const ADMIN_KEY = process.env.FEEDBACK_ADMIN_KEY || 'admin123'
        const authHeader = req.headers['authorization'] || ''
        const headerKey = req.headers['x-feedback-key'] || (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '')

        let bodyStr = ''
        req.on('data', chunk => { bodyStr += chunk })
        req.on('end', () => {
          let body = {}
          try {
            if (bodyStr) body = JSON.parse(bodyStr)
          } catch {
            body = {}
          }

          if (req.method === 'POST') {
            const { rating, comment = '', action = 'print', hp_confirm = '', honeypot = '' } = body

            // Honeypot spam drop
            if (hp_confirm || honeypot) {
              res.statusCode = 200
              return res.end(JSON.stringify({ success: true }))
            }

            const numRating = parseInt(rating, 10)
            if (isNaN(numRating) || numRating < 1 || numRating > 5) {
              res.statusCode = 400
              return res.end(JSON.stringify({ error: 'Rating must be 1-5' }))
            }

            const store = ensureStore()
            const newItem = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              rating: numRating,
              comment: String(comment).slice(0, 500).trim(),
              action: ['pdf', 'png', 'print'].includes(String(action).toLowerCase()) ? String(action).toLowerCase() : 'print',
              createdAt: new Date().toISOString(),
              read: false
            }

            store.items.unshift(newItem)
            saveStore(store)

            res.statusCode = 200
            return res.end(JSON.stringify({ success: true }))
          }

          // Protected endpoints
          if (!headerKey || headerKey !== ADMIN_KEY) {
            res.statusCode = 401
            return res.end(JSON.stringify({ error: 'Unauthorized: Invalid access key' }))
          }

          if (req.method === 'GET') {
            const store = ensureStore()
            res.statusCode = 200
            return res.end(JSON.stringify({ success: true, items: store.items || [] }))
          }

          if (req.method === 'PATCH') {
            const store = ensureStore()
            if (body.markAllRead) {
              store.items = (store.items || []).map(i => ({ ...i, read: true }))
            } else if (body.id) {
              store.items = (store.items || []).map(i => i.id === body.id ? { ...i, read: true } : i)
            }
            saveStore(store)
            res.statusCode = 200
            return res.end(JSON.stringify({ success: true }))
          }

          res.statusCode = 405
          return res.end(JSON.stringify({ error: 'Method not allowed' }))
        })
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    localFeedbackApiPlugin()
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
