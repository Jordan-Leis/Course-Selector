'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { Database } from '@/lib/supabase/types'
import CourseSearch from '@/components/CourseSearch'
import TermColumn from '@/components/TermColumn'
import Link from 'next/link'

type Course = Database['public']['Tables']['courses']['Row']
type PlanTerm = Database['public']['Tables']['plan_terms']['Row']
type PlanTermCourse = Database['public']['Tables']['plan_term_courses']['Row'] & {
  course: Course
}

const TERMS = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B']

interface PlanData {
  id: string
  name: string
  terms: (PlanTerm & {
    courses: PlanTermCourse[]
  })[]
}

export default function PlanBuilderPage() {
  const params = useParams()
  const planId = params.id as string
  const router = useRouter()
  
  const getSupabaseClient = () => {
    try {
      return createClient()
    } catch (error) {
      return null
    }
  }
  
  const supabase = getSupabaseClient()

  const [plan, setPlan] = useState<PlanData | null>(null)
  const [planName, setPlanName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedTermIndex, setSelectedTermIndex] = useState<number | null>(null)
  const [warnings, setWarnings] = useState<{ type: string; message: string }[]>([])

  const loadPlan = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Load plan
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (planError) throw planError
      if (!planData) {
        router.push('/dashboard')
        return
      }

      // Type assertion needed because TypeScript can't infer types from select('*')
      type PlanRow = Database['public']['Tables']['plans']['Row']
      const typedPlanData = planData as PlanRow

      setPlanName(typedPlanData.name)

      // Load plan terms
      const { data: termsData, error: termsError } = await supabase
        .from('plan_terms')
        .select('*')
        .eq('plan_id', planId)
        .order('term_index')

      if (termsError) throw termsError

      // Type assertion for plan terms
      type PlanTermRow = Database['public']['Tables']['plan_terms']['Row']
      const typedTermsData = (termsData || []) as PlanTermRow[]

      // Load courses for each term
      const termsWithCourses = await Promise.all(
        typedTermsData.map(async (term) => {
          const { data: termCourses, error: coursesError } = await supabase
            .from('plan_term_courses')
            .select('*, course:courses(*)')
            .eq('plan_term_id', term.id)
            .order('position')

          if (coursesError) throw coursesError

          return {
            ...term,
            courses: (termCourses || []) as PlanTermCourse[],
          }
        })
      )

      setPlan({
        id: typedPlanData.id,
        name: typedPlanData.name,
        terms: termsWithCourses,
      })
    } catch (error) {
      console.error('Error loading plan:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [planId, supabase, router])

  const calculateWarnings = useCallback(() => {
    if (!plan) return

    const warningsList: { type: string; message: string }[] = []
    const courseCounts = new Map<string, number[]>() // course_id -> term indices

    // Check for duplicate courses
    plan.terms.forEach((term) => {
      term.courses.forEach((termCourse) => {
        const courseId = termCourse.course_id
        if (!courseCounts.has(courseId)) {
          courseCounts.set(courseId, [])
        }
        courseCounts.get(courseId)!.push(term.term_index)
      })
    })

    courseCounts.forEach((termIndices, courseId) => {
      if (termIndices.length > 1) {
        const course = plan.terms
          .flatMap((t) => t.courses)
          .find((tc) => tc.course_id === courseId)?.course
        if (course) {
          warningsList.push({
            type: 'duplicate',
            message: `${course.code || `${course.subject} ${course.catalog_number}`} appears in multiple terms`,
          })
        }
      }
    })

    // Check for unit overload (>6 units per term)
    plan.terms.forEach((term) => {
      const totalUnits = term.courses.reduce((sum, tc) => sum + (tc.course.units || 0), 0)
      if (totalUnits > 6) {
        warningsList.push({
          type: 'overload',
          message: `${term.label} has ${totalUnits} units (overload warning: >6 units)`,
        })
      }
    })

    setWarnings(warningsList)
  }, [plan])

  useEffect(() => {
    loadPlan()
  }, [loadPlan])

  useEffect(() => {
    if (plan) {
      calculateWarnings()
    }
  }, [plan, calculateWarnings])

  const handleUpdatePlanName = async () => {
    if (!planName.trim() || !supabase) return

    try {
      type PlanUpdate = Database['public']['Tables']['plans']['Update']
      const { error } = await supabase
        .from('plans')
        // @ts-ignore - Supabase type inference issue with updates
        .update({ name: planName.trim() } as PlanUpdate)
        .eq('id', planId)

      if (error) throw error

      setPlan((prev) => (prev ? { ...prev, name: planName.trim() } : null))
      setEditingName(false)
    } catch (error) {
      console.error('Error updating plan name:', error)
      alert('Failed to update plan name')
    }
  }

  const handleAddCourse = async (course: Course) => {
    if (selectedTermIndex === null || !supabase) return

    try {
      const term = plan?.terms.find((t) => t.term_index === selectedTermIndex)
      if (!term) return

      // Get max position for this term
      const maxPosition =
        term.courses.length > 0
          ? Math.max(...term.courses.map((tc) => tc.position))
          : -1

      type PlanTermCourseInsert = Database['public']['Tables']['plan_term_courses']['Insert']
      // @ts-ignore - Supabase type inference issue with inserts
      const { error } = await supabase.from('plan_term_courses').insert({
        plan_term_id: term.id,
        course_id: course.id,
        position: maxPosition + 1,
      } as PlanTermCourseInsert)

      if (error) throw error

      loadPlan()
    } catch (error) {
      console.error('Error adding course:', error)
      alert('Failed to add course. It may already be in this term.')
    }
  }

  const handleRemoveCourse = async (planTermCourseId: string) => {
    if (!supabase) return
    
    try {
      const { error } = await supabase
        .from('plan_term_courses')
        .delete()
        .eq('id', planTermCourseId)

      if (error) throw error

      loadPlan()
    } catch (error) {
      console.error('Error removing course:', error)
      alert('Failed to remove course')
    }
  }

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: Supabase configuration missing. Please check environment variables.</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading plan...</div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Plan not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Enhanced Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    onBlur={handleUpdatePlanName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdatePlanName()
                      } else if (e.key === 'Escape') {
                        setPlanName(plan.name)
                        setEditingName(false)
                      }
                    }}
                    autoFocus
                    className="px-3 py-2 border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                  <button
                    onClick={handleUpdatePlanName}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                    title="Save"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  className="group flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-all"
                  onClick={() => setEditingName(true)}
                  title="Click to edit plan name"
                >
                  <h1 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {plan.name}
                  </h1>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warnings Section */}
        {warnings.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-5 shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 mb-2 text-lg">Plan Warnings</h3>
                <ul className="space-y-2">
                  {warnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-amber-800">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{warning.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Course Search Section */}
        <div className="mb-8">
          <CourseSearch
            onSelectCourse={handleAddCourse}
            selectedTermIndex={selectedTermIndex}
          />
        </div>

        {/* Instructions */}
        <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-200">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p><span className="font-semibold">Tip:</span> Click on a term column to select it, then use the search above to add courses. Each term typically holds 5-6 courses.</p>
          </div>
        </div>

        {/* Terms Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-4">
          {plan.terms.map((term) => (
            <TermColumn
              key={term.id}
              label={term.label}
              termIndex={term.term_index}
              courses={term.courses.map((tc) => ({
                id: tc.id,
                course: tc.course as Course,
              }))}
              onRemoveCourse={handleRemoveCourse}
              isSelected={selectedTermIndex === term.term_index}
              onSelect={() =>
                setSelectedTermIndex(
                  selectedTermIndex === term.term_index ? null : term.term_index
                )
              }
            />
          ))}
        </div>

        {/* Summary Footer */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Plan Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-900">
                {plan.terms.reduce((sum, term) => sum + term.courses.length, 0)}
              </div>
              <div className="text-sm text-blue-700 font-medium">Total Courses</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
              <div className="text-2xl font-bold text-indigo-900">
                {plan.terms.reduce((sum, term) => sum + term.courses.reduce((s, tc) => s + (tc.course.units || 0), 0), 0)}
              </div>
              <div className="text-sm text-indigo-700 font-medium">Total Units</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="text-2xl font-bold text-purple-900">
                {plan.terms.filter(term => term.courses.length > 0).length}
              </div>
              <div className="text-sm text-purple-700 font-medium">Terms Planned</div>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
              <div className="text-2xl font-bold text-pink-900">
                {warnings.length}
              </div>
              <div className="text-sm text-pink-700 font-medium">Warnings</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
