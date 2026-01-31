/**
 * Admin Authentication Utilities
 * 
 * Helper functions for checking admin status and permissions
 */

import { createClient } from '@/lib/supabase/server'

export type AdminRole = 'super_admin' | 'program_editor' | 'course_editor' | 'viewer'

export interface AdminUser {
  id: string
  user_id: string
  role: AdminRole
  created_at: string
  updated_at: string
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single()
  
  return !!data
}

/**
 * Get the current user's admin role
 */
export async function getAdminRole(): Promise<AdminRole | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (error || !data) return null
  
  return (data as { role: AdminRole }).role
}

/**
 * Get the current admin user's full details
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  if (error || !data) return null
  
  return data as AdminUser
}

/**
 * Check if user has a specific permission level
 */
export async function hasPermission(requiredRole: AdminRole | AdminRole[]): Promise<boolean> {
  const role = await getAdminRole()
  if (!role) return false
  
  // Super admin has all permissions
  if (role === 'super_admin') return true
  
  // Check if role matches required role(s)
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  return requiredRoles.includes(role)
}

/**
 * Throw error if user is not authenticated as admin
 */
export async function requireAdmin(): Promise<AdminUser> {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    throw new Error('Unauthorized: Admin access required')
  }
  return adminUser
}

/**
 * Throw error if user doesn't have required permission
 */
export async function requirePermission(requiredRole: AdminRole | AdminRole[]): Promise<AdminUser> {
  const adminUser = await requireAdmin()
  
  const hasAccess = await hasPermission(requiredRole)
  if (!hasAccess) {
    const roles = Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole
    throw new Error(`Unauthorized: Required role(s): ${roles}`)
  }
  
  return adminUser
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: AdminRole): string {
  const names: Record<AdminRole, string> = {
    super_admin: 'Super Admin',
    program_editor: 'Program Editor',
    course_editor: 'Course Editor',
    viewer: 'Viewer'
  }
  return names[role]
}

/**
 * Get role description
 */
export function getRoleDescription(role: AdminRole): string {
  const descriptions: Record<AdminRole, string> = {
    super_admin: 'Full access to all admin features including user management',
    program_editor: 'Can edit program templates and requirements',
    course_editor: 'Can edit course data and prerequisites',
    viewer: 'Read-only access to admin features'
  }
  return descriptions[role]
}

/**
 * Check if role can perform action
 */
export function canPerformAction(role: AdminRole, action: 'view' | 'edit' | 'delete' | 'manage_users'): boolean {
  const permissions: Record<AdminRole, Set<string>> = {
    super_admin: new Set(['view', 'edit', 'delete', 'manage_users']),
    program_editor: new Set(['view', 'edit']),
    course_editor: new Set(['view', 'edit']),
    viewer: new Set(['view'])
  }
  
  return permissions[role]?.has(action) || false
}
