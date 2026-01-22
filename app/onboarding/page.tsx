'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Database } from '@/lib/supabase/types'

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

export default function OnboardingPage() {
  const [program, setProgram] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  const getSupabaseClient = () => {
    try {
      return createClient()
    } catch (error) {
      return null
    }
  }
  
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (!supabase) return
    
    // Check if user is already onboarded
    const checkProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('program')
          .eq('user_id', user.id)
          .maybeSingle()

        // Type assertion needed because TypeScript can't infer partial select types
        const profileData = profile as { program: string | null } | null

        if (profileData?.program) {
          router.push('/dashboard')
        } else {
          // Create profile if it doesn't exist
          if (!profileData) {
            const { data: userData } = await supabase.auth.getUser()
            if (userData.user?.email) {
              type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
              // @ts-ignore - Supabase type inference issue with inserts
              await supabase.from('profiles').insert({
                user_id: user.id,
                email: userData.user.email,
              } as ProfileInsert)
            }
          }
        }
      }
    }
    checkProfile()
  }, [router, supabase])
  
  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: Supabase configuration missing. Please check environment variables.</div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!program) {
      setError('Please select a program')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in')
        router.push('/login')
        return
      }

      // Update or insert profile
      type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
      const { error: updateError } = await supabase
        .from('profiles')
        // @ts-ignore - Supabase type inference issue with upserts
        .upsert({
          user_id: user.id,
          email: user.email!,
          program,
        } as ProfileInsert)

      if (updateError) {
        setError(updateError.message)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Coursify!</h1>
        <p className="text-gray-600 mb-6">Let&apos;s get started by selecting your engineering program</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-2">
              Engineering Program
            </label>
            <select
              id="program"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select your program...</option>
              {PROGRAMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
