/**
 * Program Template Utilities
 * 
 * Helper functions for working with program templates and requirements
 */

import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type ProgramTemplate = Database['public']['Tables']['program_templates']['Row']

/**
 * Get all available program templates
 */
export async function getProgramTemplates(): Promise<ProgramTemplate[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('program_templates')
    .select('*')
    .order('program_name')
  
  if (error) {
    console.error('Error fetching program templates:', error)
    return []
  }
  
  return data || []
}

/**
 * Get a specific program template by code
 */
export async function getProgramTemplate(programCode: string): Promise<ProgramTemplate | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('program_templates')
    .select('*')
    .eq('program_code', programCode)
    .single()
  
  if (error) {
    console.error('Error fetching program template:', error)
    return null
  }
  
  return data
}

/**
 * Get user's selected program
 */
export async function getUserProgram(userId: string): Promise<ProgramTemplate | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_programs')
    .select('program:program_templates(*)')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return (data as any).program as ProgramTemplate
}

/**
 * Set user's program selection
 */
export async function setUserProgram(userId: string, programId: string): Promise<boolean> {
  const supabase = createClient()
  
  // First, mark all existing programs as non-primary
  // @ts-ignore - Supabase type inference issue
  await supabase
    .from('user_programs')
    .update({ is_primary: false })
    .eq('user_id', userId)
  
  // Insert or update the selected program
  // @ts-ignore - Supabase type inference issue
  const { error } = await supabase
    .from('user_programs')
    .upsert({
      user_id: userId,
      program_id: programId,
      is_primary: true,
    })
  
  return !error
}

/**
 * Get required courses for a specific term in a program
 */
export function getRequiredCoursesForTerm(
  program: ProgramTemplate,
  term: string
): string[] {
  if (!program.required_courses || typeof program.required_courses !== 'object') {
    return []
  }
  
  const requiredCourses = program.required_courses as Record<string, string[]>
  return requiredCourses[term] || []
}

/**
 * Check if a plan meets program requirements
 */
export function validateProgramRequirements(
  program: ProgramTemplate,
  planCourses: Record<string, string[]> // term -> course codes
): {
  isValid: boolean
  missingCourses: Record<string, string[]> // term -> missing course codes
  extraInfo: string[]
} {
  const missingCourses: Record<string, string[]> = {}
  const extraInfo: string[] = []
  
  if (!program.required_courses || typeof program.required_courses !== 'object') {
    return { isValid: true, missingCourses, extraInfo }
  }
  
  const requiredCourses = program.required_courses as Record<string, string[]>
  
  // Check each term's requirements
  for (const [term, required] of Object.entries(requiredCourses)) {
    const planned = planCourses[term] || []
    const missing = required.filter(course => !planned.includes(course))
    
    if (missing.length > 0) {
      missingCourses[term] = missing
    }
  }
  
  // Check elective requirements if defined
  if (program.elective_requirements && typeof program.elective_requirements === 'object') {
    const electives = program.elective_requirements as Record<string, any>
    
    for (const [type, requirements] of Object.entries(electives)) {
      extraInfo.push(
        `${type}: ${requirements.required} required (${requirements.description})`
      )
    }
  }
  
  const isValid = Object.keys(missingCourses).length === 0
  
  return { isValid, missingCourses, extraInfo }
}

/**
 * Get program-specific course recommendations for a term
 */
export function getRecommendedCoursesForTerm(
  program: ProgramTemplate,
  term: string,
  completedCourses: string[]
): string[] {
  const required = getRequiredCoursesForTerm(program, term)
  
  // Filter out already completed courses
  return required.filter(course => !completedCourses.includes(course))
}
