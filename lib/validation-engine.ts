/**
 * Course Validation Engine
 * 
 * Validates course prerequisites, antirequisites, and program requirements
 * when building academic plans.
 */

import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'
import { parsePrerequisites, isPrerequisiteSatisfied, getPrerequisiteDescription } from './prerequisite-parser'

type Course = Database['public']['Tables']['courses']['Row']
type PlanTerm = Database['public']['Tables']['plan_terms']['Row']
type PlanTermCourse = Database['public']['Tables']['plan_term_courses']['Row']

export interface ValidationWarning {
  type: 'prerequisite' | 'antirequisite' | 'corequisite' | 'level' | 'duplicate' | 'overload'
  severity: 'error' | 'warning' | 'info'
  courseCode: string
  message: string
  details?: string
}

export interface ValidationResult {
  isValid: boolean
  warnings: ValidationWarning[]
  errors: ValidationWarning[]
}

/**
 * Validate a course being added to a specific term in a plan
 */
export async function validateCourseAddition(
  planId: string,
  termIndex: number,
  courseToAdd: Course,
  currentPlanTerms?: Array<PlanTerm & { courses: Array<PlanTermCourse & { course: Course }> }>
): Promise<ValidationResult> {
  const warnings: ValidationWarning[] = []
  const errors: ValidationWarning[] = []

  // If no plan terms provided, fetch them
  let planTerms = currentPlanTerms
  if (!planTerms) {
    planTerms = await fetchPlanTerms(planId)
  }

  // 1. Check for duplicates (course already in another term)
  const duplicateCheck = checkDuplicates(courseToAdd, planTerms, termIndex)
  if (duplicateCheck) {
    warnings.push(duplicateCheck)
  }

  // 2. Check prerequisites
  const prereqChecks = await checkPrerequisites(courseToAdd, planTerms, termIndex)
  errors.push(...prereqChecks.errors)
  warnings.push(...prereqChecks.warnings)

  // 3. Check antirequisites
  const antireqChecks = await checkAntirequisites(courseToAdd, planTerms)
  errors.push(...antireqChecks)

  // 4. Check term overload (too many units)
  const overloadCheck = checkTermOverload(planTerms, termIndex, courseToAdd)
  if (overloadCheck) {
    warnings.push(overloadCheck)
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  }
}

/**
 * Fetch plan terms with courses
 */
async function fetchPlanTerms(planId: string) {
  const supabase = createClient()
  
  const { data: terms } = await supabase
    .from('plan_terms')
    .select(`
      *,
      courses:plan_term_courses(
        *,
        course:courses(*)
      )
    `)
    .eq('plan_id', planId)
    .order('term_index', { ascending: true })

  return (terms || []) as Array<PlanTerm & { courses: Array<PlanTermCourse & { course: Course }> }>
}

/**
 * Check if course is already in the plan
 */
function checkDuplicates(
  course: Course,
  planTerms: Array<PlanTerm & { courses: Array<PlanTermCourse & { course: Course }> }>,
  currentTermIndex: number
): ValidationWarning | null {
  for (const term of planTerms) {
    if (term.term_index === currentTermIndex) continue
    
    for (const ptc of term.courses) {
      if (ptc.course.id === course.id) {
        return {
          type: 'duplicate',
          severity: 'warning',
          courseCode: course.code || '',
          message: `Course already exists in ${term.label}`,
          details: 'You may want to remove the duplicate course from one of the terms.',
        }
      }
    }
  }

  return null
}

/**
 * Check if prerequisites are satisfied
 */
async function checkPrerequisites(
  course: Course,
  planTerms: Array<PlanTerm & { courses: Array<PlanTermCourse & { course: Course }> }>,
  currentTermIndex: number
): Promise<{ errors: ValidationWarning[], warnings: ValidationWarning[] }> {
  const errors: ValidationWarning[] = []
  const warnings: ValidationWarning[] = []

  if (!course.has_prerequisites || !course.prerequisites_raw) {
    return { errors, warnings }
  }

  // Get courses completed before this term
  const completedCourses: string[] = []
  for (const term of planTerms) {
    if (term.term_index < currentTermIndex) {
      for (const ptc of term.courses) {
        if (ptc.course.code) {
          completedCourses.push(ptc.course.code)
        }
      }
    }
  }

  // Parse prerequisites
  const prereqData = parsePrerequisites(course.prerequisites_raw)

  // Check each prerequisite
  for (const prereq of prereqData.prerequisites) {
    if (prereq.type === 'antirequisite') continue // Handle separately

    const satisfied = isPrerequisiteSatisfied(prereq, completedCourses)
    
    if (!satisfied) {
      const description = getPrerequisiteDescription(prereq)
      
      if (prereq.type === 'course') {
        errors.push({
          type: 'prerequisite',
          severity: 'error',
          courseCode: course.code || '',
          message: `Missing prerequisite: ${description}`,
          details: 'You must complete the required courses in an earlier term.',
        })
      } else if (prereq.type === 'level') {
        warnings.push({
          type: 'level',
          severity: 'warning',
          courseCode: course.code || '',
          message: `Level requirement: ${description}`,
          details: 'Make sure you meet the level requirement for this course.',
        })
      } else if (prereq.type === 'corequisite') {
        warnings.push({
          type: 'corequisite',
          severity: 'warning',
          courseCode: course.code || '',
          message: `Corequisite: ${description}`,
          details: 'This course should be taken in the same term or after its corequisites.',
        })
      }
    }
  }

  return { errors, warnings }
}

/**
 * Check for antirequisite conflicts
 */
async function checkAntirequisites(
  course: Course,
  planTerms: Array<PlanTerm & { courses: Array<PlanTermCourse & { course: Course }> }>
): Promise<ValidationWarning[]> {
  const errors: ValidationWarning[] = []

  if (!course.has_prerequisites || !course.prerequisites_raw) {
    return errors
  }

  // Get all courses in the plan
  const allPlanCourses: string[] = []
  for (const term of planTerms) {
    for (const ptc of term.courses) {
      if (ptc.course.code) {
        allPlanCourses.push(ptc.course.code)
      }
    }
  }

  // Parse prerequisites to find antirequisites
  const prereqData = parsePrerequisites(course.prerequisites_raw)

  for (const prereq of prereqData.prerequisites) {
    if (prereq.type === 'antirequisite' && prereq.courses) {
      for (const antireqCourse of prereq.courses) {
        if (allPlanCourses.includes(antireqCourse)) {
          errors.push({
            type: 'antirequisite',
            severity: 'error',
            courseCode: course.code || '',
            message: `Cannot take with ${antireqCourse}`,
            details: `${course.code} and ${antireqCourse} are antirequisites and cannot both be in your plan.`,
          })
        }
      }
    }
  }

  return errors
}

/**
 * Check if term has too many units
 */
function checkTermOverload(
  planTerms: Array<PlanTerm & { courses: Array<PlanTermCourse & { course: Course }> }>,
  termIndex: number,
  newCourse: Course
): ValidationWarning | null {
  const term = planTerms.find(t => t.term_index === termIndex)
  if (!term) return null

  let totalUnits = Number(newCourse.units) || 0.5
  for (const ptc of term.courses) {
    totalUnits += Number(ptc.course.units) || 0.5
  }

  // Typical term is 5-6 courses = 2.5-3.0 units
  if (totalUnits > 3.0) {
    return {
      type: 'overload',
      severity: 'warning',
      courseCode: newCourse.code || '',
      message: `Term overload: ${totalUnits.toFixed(1)} units`,
      details: 'This term has more than the typical 3.0 units (6 courses). Consider redistributing courses.',
    }
  }

  return null
}

/**
 * Validate an entire plan
 */
export async function validateEntirePlan(
  planId: string
): Promise<ValidationResult> {
  const warnings: ValidationWarning[] = []
  const errors: ValidationWarning[] = []

  const planTerms = await fetchPlanTerms(planId)

  // Check each course in each term
  for (const term of planTerms) {
    for (const ptc of term.courses) {
      const result = await validateCourseAddition(
        planId,
        term.term_index,
        ptc.course,
        planTerms
      )
      errors.push(...result.errors)
      warnings.push(...result.warnings)
    }
  }

  // Remove duplicate warnings
  const uniqueWarnings = Array.from(
    new Map(warnings.map(w => [`${w.courseCode}-${w.type}-${w.message}`, w])).values()
  )

  const uniqueErrors = Array.from(
    new Map(errors.map(e => [`${e.courseCode}-${e.type}-${e.message}`, e])).values()
  )

  return {
    isValid: uniqueErrors.length === 0,
    warnings: uniqueWarnings,
    errors: uniqueErrors,
  }
}
