/**
 * Audit Logging Utilities
 * 
 * Functions for logging admin actions to the audit log
 */

import { createClient } from '@/lib/supabase/server'

export type AuditAction = 'insert' | 'update' | 'delete'

export interface AuditLogEntry {
  id: string
  admin_user_id: string
  action_type: AuditAction
  table_name: string
  record_id: string
  old_data: any
  new_data: any
  description: string
  created_at: string
}

/**
 * Log an admin action to the audit log
 */
export async function logAuditAction(
  action: AuditAction,
  tableName: string,
  recordId: string,
  description: string,
  oldData?: any,
  newData?: any
): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  // Get admin user ID
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single()
  
  if (adminError || !adminUser) return
  
  const typedAdminUser = adminUser as { id: string }
  
  await supabase.from('audit_log').insert({
    admin_user_id: typedAdminUser.id,
    action_type: action,
    table_name: tableName,
    record_id: recordId,
    old_data: oldData || null,
    new_data: newData || null,
    description
  } as any)
}

/**
 * Get audit log entries with pagination
 */
export async function getAuditLog(
  limit: number = 50,
  offset: number = 0,
  filters?: {
    tableName?: string
    recordId?: string
    adminUserId?: string
    fromDate?: Date
    toDate?: Date
  }
): Promise<{ entries: AuditLogEntry[], total: number }> {
  const supabase = await createClient()
  
  let query = supabase
    .from('audit_log')
    .select('*, admin_user:admin_users(user_id)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (filters?.tableName) {
    query = query.eq('table_name', filters.tableName)
  }
  
  if (filters?.recordId) {
    query = query.eq('record_id', filters.recordId)
  }
  
  if (filters?.adminUserId) {
    query = query.eq('admin_user_id', filters.adminUserId)
  }
  
  if (filters?.fromDate) {
    query = query.gte('created_at', filters.fromDate.toISOString())
  }
  
  if (filters?.toDate) {
    query = query.lte('created_at', filters.toDate.toISOString())
  }
  
  const { data, count, error } = await query
  
  if (error) throw error
  
  return {
    entries: (data || []) as AuditLogEntry[],
    total: count || 0
  }
}

/**
 * Get audit history for a specific record
 */
export async function getRecordAuditHistory(
  tableName: string,
  recordId: string
): Promise<AuditLogEntry[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('audit_log')
    .select('*, admin_user:admin_users(user_id)')
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  return (data || []) as AuditLogEntry[]
}
