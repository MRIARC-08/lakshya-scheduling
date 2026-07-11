import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

async function migrate() {
  console.log('[migrate] Connecting to Neon DB...')

  // Create corsair tables
  await sql`
    CREATE TABLE IF NOT EXISTS corsair_integrations (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      name TEXT NOT NULL UNIQUE,
      config JSONB NOT NULL DEFAULT '{}',
      dek TEXT
    )
  `
  console.log('[migrate] ✓ corsair_integrations')

  await sql`
    CREATE TABLE IF NOT EXISTS corsair_accounts (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      tenant_id TEXT NOT NULL,
      integration_id TEXT NOT NULL REFERENCES corsair_integrations(id),
      config JSONB NOT NULL DEFAULT '{}',
      dek TEXT
    )
  `
  console.log('[migrate] ✓ corsair_accounts')

  await sql`
    CREATE TABLE IF NOT EXISTS corsair_entities (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      account_id TEXT NOT NULL REFERENCES corsair_accounts(id),
      entity_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      version TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'
    )
  `
  console.log('[migrate] ✓ corsair_entities')

  await sql`
    CREATE TABLE IF NOT EXISTS corsair_events (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      account_id TEXT NOT NULL REFERENCES corsair_accounts(id),
      event_type TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}',
      status TEXT DEFAULT 'pending'
    )
  `
  console.log('[migrate] ✓ corsair_events')

  await sql`
    CREATE TABLE IF NOT EXISTS corsair_permissions (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      tenant_id TEXT,
      plugin TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      args JSONB,
      status TEXT NOT NULL DEFAULT 'pending',
      token TEXT UNIQUE,
      expires_at TEXT,
      error TEXT
    )
  `
  console.log('[migrate] ✓ corsair_permissions')

  // Add indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_accounts_tenant ON corsair_accounts(tenant_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_entities_account ON corsair_entities(account_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_entities_type ON corsair_entities(entity_type)`
  await sql`CREATE INDEX IF NOT EXISTS idx_events_account ON corsair_events(account_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_events_status ON corsair_events(status)`
  console.log('[migrate] ✓ indexes')

  await sql.end()
  console.log('[migrate] ✅ All Corsair tables created successfully!')
}

migrate().catch((err) => {
  console.error('[migrate] ❌ Migration failed:', err)
  process.exit(1)
})
