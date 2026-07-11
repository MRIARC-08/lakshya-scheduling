/**
 * Custom OAuth flow for Corsair — uses port 3001 to match
 * the redirect URI registered in Google Cloud Console:
 *   http://localhost:3001/oauth/callback
 */
import http from 'http'
import https from 'https'
import querystring from 'querystring'
import dotenv from 'dotenv'
import postgres from 'postgres'

dotenv.config()

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = 'http://localhost:3001/oauth/callback'
const PORT = 3001

const SCOPES: Record<string, string[]> = {
  gmail: [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
  ],
  googlecalendar: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
}

function buildAuthUrl(plugin: string): string {
  const params = querystring.stringify({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES[plugin].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: plugin, // pass plugin name as state so we know which plugin the callback is for
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

function exchangeCode(code: string): Promise<{ access_token: string; refresh_token: string }> {
  return new Promise((resolve, reject) => {
    const body = querystring.stringify({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    })

    const req = https.request(
      {
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Token exchange failed (${res.statusCode}): ${data}`))
            return
          }
          resolve(JSON.parse(data))
        })
      }
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function saveTokensToCorsair(plugin: string, accessToken: string, refreshToken: string) {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

  try {
    // Get the integration
    const [integration] = await sql`
      SELECT id, dek FROM corsair_integrations WHERE name = ${plugin}
    `
    if (!integration) throw new Error(`Integration '${plugin}' not found`)

    // Get the account
    const [account] = await sql`
      SELECT id, dek, config FROM corsair_accounts 
      WHERE integration_id = ${integration.id} AND tenant_id = 'default'
    `
    if (!account) throw new Error(`Account for '${plugin}' not found`)

    // We need to encrypt tokens the same way corsair does.
    // Instead, let's use corsair setup CLI to inject them.
    console.log(`\n✅ Tokens received for ${plugin}!`)
    console.log(`\nRun this command to store them in Corsair:\n`)
    console.log(
      `pnpm corsair setup --${plugin} access_token=${accessToken} refresh_token=${refreshToken}`
    )
    return { accessToken, refreshToken }
  } finally {
    await sql.end()
  }
}

// Track which plugins we've completed
const completed = new Set<string>()
const plugins = Object.keys(SCOPES)
const tokens: Record<string, { access_token: string; refresh_token: string }> = {}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`)

  if (url.pathname === '/oauth/callback') {
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // plugin name
    const error = url.searchParams.get('error')

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end(`<h1>❌ OAuth Error</h1><p>${error}</p>`)
      return
    }

    if (!code || !state) {
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end('<h1>❌ Missing code or state</h1>')
      return
    }

    try {
      console.log(`\n🔄 Exchanging code for ${state} tokens...`)
      const tokenData = await exchangeCode(code)
      tokens[state] = tokenData
      completed.add(state)

      await saveTokensToCorsair(state, tokenData.access_token, tokenData.refresh_token)

      const remaining = plugins.filter((p) => !completed.has(p))

      if (remaining.length > 0) {
        const nextPlugin = remaining[0]
        const nextUrl = buildAuthUrl(nextPlugin)
        res.writeHead(302, { Location: nextUrl })
        res.end()
        console.log(`\n🔄 Redirecting to ${nextPlugin} OAuth...`)
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(`
          <html>
            <body style="background:#111;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
              <div style="text-align:center">
                <h1>✅ All OAuth flows complete!</h1>
                <p>Gmail and Google Calendar tokens received.</p>
                <p>You can close this tab now.</p>
              </div>
            </body>
          </html>
        `)
        console.log('\n✅ All OAuth flows complete! Shutting down...')

        // Print the setup commands
        console.log('\n' + '='.repeat(60))
        console.log('Run these commands to store the tokens in Corsair:')
        console.log('='.repeat(60))
        for (const [plugin, t] of Object.entries(tokens)) {
          console.log(
            `\npnpm corsair setup --${plugin} access_token=${t.access_token} refresh_token=${t.refresh_token}`
          )
        }
        console.log('\n' + '='.repeat(60))

        setTimeout(() => {
          server.close()
          process.exit(0)
        }, 1000)
      }
    } catch (err) {
      console.error(`❌ Token exchange error:`, err)
      res.writeHead(500, { 'Content-Type': 'text/html' })
      res.end(`<h1>❌ Token Exchange Failed</h1><pre>${err}</pre>`)
    }
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

server.listen(PORT, () => {
  const firstPlugin = plugins[0]
  const authUrl = buildAuthUrl(firstPlugin)

  console.log('🚀 OAuth server listening on port', PORT)
  console.log(`\n📋 Open this URL in your browser to authorize ${firstPlugin}:\n`)
  console.log(`   ${authUrl}\n`)
  console.log('After Gmail, it will automatically redirect to Google Calendar.')
  console.log('Waiting for callback...')
})
