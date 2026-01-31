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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Q0EzQUYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCA0LTRzNCUyIDQgNC0yIDQtNCA0LTQtMi00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full">
          {/* Welcome header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl mb-6 animate-in zoom-in duration-500">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-3 animate-in slide-in-from-bottom duration-700">
              Welcome to Coursify!
            </h1>
            <p className="text-lg text-gray-600 animate-in slide-in-from-bottom duration-700 delay-100">
              Let&apos;s get you set up
            </p>
          </div>

          {/* Onboarding card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100 animate-in slide-in-from-bottom duration-700 delay-200">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Select Your Program</h2>
              </div>
              <p className="text-gray-600 text-sm ml-13">
                Choose your engineering program to get started planning your courses
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="program" className="block text-sm font-semibold text-gray-700 mb-3">
                  Engineering Program
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <select
                    id="program"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer"
                  >
                    <option value="">Select your program...</option>
                    {PROGRAMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-800">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Dashboard</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Info box */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">Your program selection helps us</p>
                  <p className="text-xs text-blue-700 mt-1">Provide relevant course recommendations and track your degree requirements</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
