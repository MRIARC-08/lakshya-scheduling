import { createCorsair } from 'corsair'
import postgres from 'postgres'
import { gmail } from '@corsair-dev/gmail'
import { googlecalendar } from '@corsair-dev/googlecalendar'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

export const corsair = createCorsair({
  multiTenancy: false,
  kek: process.env.CORSAIR_KEK || 'd29yZHBhc3N3b3JkcGFzc3dvcmRwYXNzd29yZHBhc3M=',
  database: sql,
  plugins: [
    gmail({
      // open mode — automated business system
      // no human approval needed for sending confirmations
      defaultMode: 'open',
    }),
    googlecalendar({
      defaultMode: 'open',
    }),
  ],
})

export type CorsairInstance = typeof corsair
