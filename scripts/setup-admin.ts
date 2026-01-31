#!/usr/bin/env tsx
/**
 * Admin Setup Script
 * 
 * Creates an admin user account in the database
 * Usage: tsx scripts/setup-admin.ts <email>
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Missing Supabase credentials')
  console.error('Required environment variables:')
  console.error('  - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function setupAdmin(email: string, role: string = 'super_admin') {
  console.log(`Setting up admin account for: ${email}`)
  console.log(`Role: ${role}`)
  console.log()

  try {
    // Find user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      throw new Error(`Failed to list users: ${userError.message}`)
    }
    
    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      throw new Error(`User with email ${email} not found. User must sign up first.`)
    }
    
    console.log(`Found user: ${user.id}`)
    
    // Check if already an admin
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (existingAdmin) {
      console.log('User is already an admin!')
      console.log(`Current role: ${existingAdmin.role}`)
      
      // Update role if different
      if (existingAdmin.role !== role) {
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({ role, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
        
        if (updateError) {
          throw new Error(`Failed to update role: ${updateError.message}`)
        }
        
        console.log(`Updated role from ${existingAdmin.role} to ${role}`)
      }
    } else {
      // Create new admin user
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          user_id: user.id,
          role,
          created_by: user.id
        })
      
      if (insertError) {
        throw new Error(`Failed to create admin: ${insertError.message}`)
      }
      
      console.log('Successfully created admin user!')
    }
    
    console.log()
    console.log('Admin setup complete. You can now access /admin')
    
  } catch (error) {
    console.error()
    console.error('Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log('Usage: tsx scripts/setup-admin.ts <email> [role]')
  console.log()
  console.log('Roles:')
  console.log('  - super_admin (default): Full system access')
  console.log('  - program_editor: Can edit program templates')
  console.log('  - course_editor: Can edit courses')
  console.log('  - viewer: Read-only access')
  console.log()
  console.log('Example: tsx scripts/setup-admin.ts jordan.leis@uwaterloo.ca super_admin')
  process.exit(1)
}

const email = args[0]
const role = args[1] || 'super_admin'

const validRoles = ['super_admin', 'program_editor', 'course_editor', 'viewer']
if (!validRoles.includes(role)) {
  console.error(`Invalid role: ${role}`)
  console.error(`Valid roles: ${validRoles.join(', ')}`)
  process.exit(1)
}

setupAdmin(email, role)
