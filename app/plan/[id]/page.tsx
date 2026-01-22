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
  const supabase = createClient()

  const [plan, setPlan] = useState<PlanData | null>(null)
  const [planName, setPlanName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedTermIndex, setSelectedTermIndex] = useState<number | null>(null)
  const [warnings, setWarnings] = useState<{ type: string; message: string }[]>([])

  const loadPlan = useCallback(async () => {
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
    if (!planName.trim()) return

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
    if (selectedTermIndex === null) return

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
                ← Back to Dashboard
              </Link>
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
                    className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <h1
                  className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
                  onClick={() => setEditingName(true)}
                >
                  {plan.name}
                </h1>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {warnings.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Warnings</h3>
            <ul className="list-disc list-inside space-y-1 text-yellow-800">
              {warnings.map((warning, idx) => (
                <li key={idx}>{warning.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-6">
          <CourseSearch
            onSelectCourse={handleAddCourse}
            selectedTermIndex={selectedTermIndex}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
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
      </main>
    </div>
  )
}
