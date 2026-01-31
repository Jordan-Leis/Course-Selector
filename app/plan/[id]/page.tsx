'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { Database } from '@/lib/supabase/types'
import CourseSearch from '@/components/CourseSearch'
import TermColumn from '@/components/TermColumn'
import Link from 'next/link'
import { validateCourseAddition, validateEntirePlan, ValidationWarning } from '@/lib/validation-engine'

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
  const [warnings, setWarnings] = useState<ValidationWarning[]>([])
  const [validating, setValidating] = useState(false)

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

  const calculateWarnings = useCallback(async () => {
    if (!plan) return

    setValidating(true)
    try {
      // Use the new validation engine
      const result = await validateEntirePlan(planId)
      
      // Combine errors and warnings
      const allWarnings: ValidationWarning[] = [
        ...result.errors,
        ...result.warnings,
      ]
      
      setWarnings(allWarnings)
    } catch (error) {
      console.error('Error validating plan:', error)
    } finally {
      setValidating(false)
    }
  }, [plan, planId])

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
      // First, validate if this course can be added
      const validation = await validateCourseAddition(planId, selectedTermIndex, course)
      
      // Show errors if any
      if (!validation.isValid && validation.errors.length > 0) {
        const errorMessages = validation.errors.map(e => e.message).join('\n')
        alert(`Cannot add course:\n\n${errorMessages}`)
        return
      }
      
      // Show warnings but allow adding
      if (validation.warnings.length > 0) {
        const warningMessages = validation.warnings.map(w => w.message).join('\n')
        const confirmed = confirm(`Warning:\n\n${warningMessages}\n\nDo you want to add this course anyway?`)
        if (!confirmed) return
      }
      
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
          <div className="mb-6 space-y-3">
            {/* Errors */}
            {warnings.filter(w => w.severity === 'error').length > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-5 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-900 mb-2 text-lg">Errors Found</h3>
                    <p className="text-red-700 text-sm mb-3">These issues must be resolved before your plan is valid.</p>
                    <ul className="space-y-2">
                      {warnings.filter(w => w.severity === 'error').map((warning, idx) => (
                        <li key={idx} className="bg-white/50 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <span className="text-red-600 font-mono text-sm font-semibold">{warning.courseCode}</span>
                            <span className="text-red-800 text-sm flex-1">{warning.message}</span>
                          </div>
                          {warning.details && (
                            <p className="text-red-600 text-xs mt-1 ml-2 pl-2 border-l-2 border-red-300">{warning.details}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Warnings */}
            {warnings.filter(w => w.severity === 'warning').length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-5 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-900 mb-2 text-lg">Warnings</h3>
                    <p className="text-amber-700 text-sm mb-3">These issues should be reviewed but won't prevent plan submission.</p>
                    <ul className="space-y-2">
                      {warnings.filter(w => w.severity === 'warning').map((warning, idx) => (
                        <li key={idx} className="bg-white/50 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <span className="text-amber-600 font-mono text-sm font-semibold">{warning.courseCode}</span>
                            <span className="text-amber-800 text-sm flex-1">{warning.message}</span>
                          </div>
                          {warning.details && (
                            <p className="text-amber-600 text-xs mt-1 ml-2 pl-2 border-l-2 border-amber-300">{warning.details}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {validating && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 text-blue-700 text-sm">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Validating prerequisites...</span>
              </div>
            )}
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
