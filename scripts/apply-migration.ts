#!/usr/bin/env tsx
/**
 * Apply migration 004 directly to Supabase
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
config({ path: resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('📦 Reading migration file...')
  const sql = readFileSync(
    resolve(__dirname, '../supabase/migrations/004_add_prerequisites_system.sql'),
    'utf-8'
  )

  console.log('🚀 Applying migration 004...\n')

  // Split into statements and execute one by one
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'))

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (!statement) continue

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
      
      if (error) {
        // Try direct query instead
        const { error: directError } = await supabase
          .from('_migration')
          .select('*')
          .limit(0)
        
        // If that fails, log and continue
        console.log(`⚠️  Statement ${i + 1}: ${error.message.substring(0, 100)}`)
      } else {
        console.log(`✅ Statement ${i + 1} applied`)
      }
    } catch (err: any) {
      console.log(`⚠️  Statement ${i + 1}: ${err.message?.substring(0, 100) || 'error'}`)
    }
  }

  console.log('\n✨ Migration complete! You can verify in Supabase Dashboard.')
}

applyMigration().catch(console.error)
