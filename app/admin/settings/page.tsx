'use client'

import { requireAdmin } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const PROGRAMS = [
  'Biomedical Engineering',
  'Chemical Engineering',
  'Civil Engineering',
  'Computer Engineering',
  'Electrical Engineering',
  'Environmental Engineering',
  'Geological Engineering',
  'Management Engineering',
  'Mechanical Engineering',
  'Mechatronics Engineering',
  'Nanotechnology Engineering',
  'Software Engineering',
  'Systems Design Engineering',
]

export default function AdminSettingsPage() {
  const [currentProgram, setCurrentProgram] = useState<string>('')
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [adminRole, setAdminRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setEmail(user.email || '')

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('program')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setCurrentProgram(profile.program || 'Not set')
        setSelectedProgram(profile.program || '')
      }

      // Get admin role
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (adminUser) {
        setAdminRole(adminUser.role)
      }

    } catch (error) {
      console.error('Error loading user data:', error)
      setMessage({ type: 'error', text: 'Failed to load user data' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedProgram) {
      setMessage({ type: 'error', text: 'Please select a program' })
      return
    }

    try {
      setSaving(true)
      setMessage(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ program: selectedProgram })
        .eq('user_id', user.id)

      if (error) throw error

      setCurrentProgram(selectedProgram)
      setMessage({ 
        type: 'success', 
        text: `Program updated to ${selectedProgram}. You can now test this program's template!` 
      })

      // Reload after 2 seconds
      setTimeout(() => {
        router.refresh()
      }, 2000)

    } catch (error) {
      console.error('Error updating program:', error)
      setMessage({ type: 'error', text: 'Failed to update program' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600 mt-1">Manage your admin account settings</p>
      </div>

      {/* User Info Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <div className="text-lg text-gray-900 font-medium">{email}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Admin Role</label>
            <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-lg font-medium">
              {adminRole.replace('_', ' ').toUpperCase()}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Current Program</label>
            <div className="text-lg text-gray-900 font-medium">{currentProgram}</div>
          </div>
        </div>
      </div>

      {/* Program Switcher Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Switch Program</h2>
          <p className="text-sm text-gray-600">
            Change your program to test different program templates. This updates your profile
            so you can create plans with different program requirements.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-2">
              Select Program
            </label>
            <select
              id="program"
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">Select a program...</option>
              {PROGRAMS.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border-2 border-green-200 text-green-800'
                  : 'bg-red-50 border-2 border-red-200 text-red-800'
              }`}
            >
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !selectedProgram}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl"
          >
            {saving ? 'Saving...' : 'Update Program'}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">Testing Program Templates</p>
            <p className="text-xs text-blue-700 mt-1">
              After switching programs, go to the Dashboard and create a new plan. The plan will
              automatically populate with the required courses from your selected program template.
              This allows you to test EE, CE, and SE templates without creating new accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
