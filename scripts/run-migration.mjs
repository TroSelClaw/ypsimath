import { readFileSync } from 'fs'
import pg from 'pg'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/run-migration.mjs <sql-file>')
  process.exit(1)
}

const sql = readFileSync(file, 'utf-8')

// Use session mode pooler (port 5432) for DDL support
const client = new pg.Client({
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.kmjuuxqvfaspjsaauqgi',
  password: 'WBoDLCZeMM6eBr8N',
  ssl: { rejectUnauthorized: false },
})

try {
  console.log(`Connecting...`)
  await client.connect()
  console.log(`Connected! Running ${file}...`)
  await client.query(sql)
  console.log(`✅ Migration applied successfully: ${file}`)
} catch (err) {
  console.error(`❌ Migration failed:`, err.message)
  process.exit(1)
} finally {
  await client.end()
}
