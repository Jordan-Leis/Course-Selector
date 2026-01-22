'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()
  
  const getSupabaseClient = () => {
    try {
      return createClient()
    } catch (error) {
      return null
    }
  }
  
  const supabase = getSupabaseClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase) {
      setMessage({ type: 'error', text: 'Supabase configuration error. Please check environment variables.' })
      return
    }
    
    setLoading(true)
    setMessage(null)

    // Validate UW email
    if (!email.endsWith('@uwaterloo.ca')) {
      setMessage({ type: 'error', text: 'Please use a @uwaterloo.ca email address' })
      setLoading(false)
      return
    }

    try {
      if (usePassword) {
        // Password login (for development/testing)
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else {
          router.push('/dashboard')
        }
      } else {
        // Magic link login
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        })

        if (error) {
          // Handle rate limiting specifically
          if (error.message.includes('rate limit') || error.message.includes('too many')) {
            setMessage({
              type: 'error',
              text: 'Too many emails sent. Try password login below, or wait a few minutes and check your email inbox for a previous magic link.',
            })
          } else {
            setMessage({ type: 'error', text: error.message })
          }
        } else {
          setMessage({
            type: 'success',
            text: 'Check your email for the magic link!',
          })
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Coursify</h1>
        <p className="text-gray-600 mb-6">Sign in with your UW email to get started</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@uwaterloo.ca"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {usePassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required={usePassword}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {message && (
            <div
              className={`p-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (usePassword ? 'Signing in...' : 'Sending...') : (usePassword ? 'Sign In' : 'Send Magic Link')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setUsePassword(!usePassword)
              setPassword('')
              setMessage(null)
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {usePassword ? 'Use magic link instead' : 'Use password login (for testing)'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
