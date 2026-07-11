import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import calendarRoutes from './routes/calendar'
import emailRoutes from './routes/email'
import { log } from './utils/logger'

const app = express()
const PORT = process.env.PORT ?? 3001

// ── Middleware ───────────────────────────────────────────────

app.use(express.json())
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:8000',
    methods: ['POST', 'GET'],
    allowedHeaders: ['Content-Type', 'x-api-key'],
  })
)

// ── API Key Guard ────────────────────────────────────────────
// Simple internal security between python agent and bridge

app.use((req, res, next) => {
  // Skip health check
  if (req.path === '/health') return next()

  const apiKey = req.headers['x-api-key']
  const expectedKey = process.env.BRIDGE_API_KEY

  if (!expectedKey || apiKey !== expectedKey) {
    log('WARN', `Unauthorized request to ${req.path}`)
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    })
  }

  next()
})

// ── Routes ───────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Lakshya IAS — Corsair Bridge',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/calendar', calendarRoutes)
app.use('/api/email', emailRoutes)

// ── 404 handler ──────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  })
})

// ── Start ────────────────────────────────────────────────────

app.listen(PORT, () => {
  log('SUCCESS', `Corsair Bridge running on port ${PORT}`)
  log('INFO', 'Lakshya IAS Academy — Scheduling Integration Layer')
  log('INFO', `Environment: ${process.env.NODE_ENV ?? 'development'}`)
})

export default app
