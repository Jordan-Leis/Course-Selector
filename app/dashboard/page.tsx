'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Database } from '@/lib/supabase/types'

interface Plan {
  id: string
  name: string
  created_at: string
  course_count: number
}

const TERMS = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B']

export default function DashboardPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const loadPlans = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Fetch plans with course counts
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('id, name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (plansError) throw plansError

      // Type assertion needed because TypeScript can't infer partial select types
      type PlanPartial = Pick<Database['public']['Tables']['plans']['Row'], 'id' | 'name' | 'created_at'>
      const typedPlansData = (plansData || []) as PlanPartial[]

      // Get course counts for each plan
      const plansWithCounts = await Promise.all(
        typedPlansData.map(async (plan) => {
          // First get plan_term_ids for this plan
          const { data: planTerms } = await supabase
            .from('plan_terms')
            .select('id')
            .eq('plan_id', plan.id)

          const planTermIds = planTerms?.map((pt) => pt.id) || []

          // Then count courses in those terms
          const { count } = await supabase
            .from('plan_term_courses')
            .select('*', { count: 'exact', head: true })
            .in('plan_term_id', planTermIds)

          return {
            ...plan,
            course_count: count || 0,
          }
        })
      )

      setPlans(plansWithCounts as Plan[])
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlanName.trim()) return

    setCreating(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Create plan
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .insert({
          user_id: user.id,
          name: newPlanName.trim(),
        })
        .select()
        .single()

      if (planError) throw planError

      // Create 8 plan terms
      const planTerms = TERMS.map((label, index) => ({
        plan_id: plan.id,
        term_index: index,
        label,
      }))

      const { error: termsError } = await supabase
        .from('plan_terms')
        .insert(planTerms)

      if (termsError) throw termsError

      setNewPlanName('')
      setShowCreateForm(false)
      loadPlans()
      router.push(`/plan/${plan.id}`)
    } catch (error) {
      console.error('Error creating plan:', error)
      alert('Failed to create plan. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase.from('plans').delete().eq('id', planId)

      if (error) throw error

      loadPlans()
    } catch (error) {
      console.error('Error deleting plan:', error)
      alert('Failed to delete plan. Please try again.')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Coursify</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">My Plans</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {showCreateForm ? 'Cancel' : '+ New Plan'}
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <form onSubmit={handleCreatePlan} className="flex gap-4">
              <input
                type="text"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="Plan name (e.g., My 4-Year Plan)"
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </form>
          </div>
        )}

        {plans.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">You don&apos;t have any plans yet.</p>
            <p className="text-gray-500">Create your first plan to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <Link
                    href={`/plan/${plan.id}`}
                    className="text-xl font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {plan.name}
                  </Link>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    Created: {new Date(plan.created_at).toLocaleDateString()}
                  </p>
                  <p>{plan.course_count} course{plan.course_count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
