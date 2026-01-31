/**
 * Plan Initialization with Program Requirements
 * 
 * Functions to create plans pre-populated with program-required courses
 */

import { createClient } from '@/lib/supabase/client'
import { getProgramTemplate } from './program-templates'
import { Database } from '@/lib/supabase/types'

type Plan = Database['public']['Tables']['plans']['Row']

/**
 * Create a new plan with required courses auto-populated based on program
 */
export async function createPlanWithProgram(
  userId: string, 
  planName: string, 
  programCode: string
): Promise<Plan> {
  const supabase = createClient() as any
  
  // Get program template
  const program = await getProgramTemplate(programCode)
  if (!program) throw new Error('Program not found')
  
  // Create plan
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .insert({ user_id: userId, name: planName })
    .select()
    .single()
  
  if (planError || !plan) throw planError
  
  // Create 8 terms (1A through 4B)
  const terms = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B']
  const termRecords = terms.map((label, index) => ({
    plan_id: plan.id,
    term_index: index,
    label: label
  }))
  
  const { data: createdTerms, error: termsError } = await supabase
    .from('plan_terms')
    .insert(termRecords)
    .select()
  
  if (termsError || !createdTerms) throw termsError
  
  // Get required courses from program template
  const requiredCourses = (program.required_courses as Record<string, string[]>) || {}
  
  // For each term, add required courses
  for (const term of createdTerms) {
    const courseCodes = requiredCourses[term.label] || []
    
    if (courseCodes.length === 0) continue
    
    // Fetch course IDs for these course codes
    const { data: courses } = await supabase
      .from('courses')
      .select('id, code')
      .in('code', courseCodes)
    
    if (!courses || courses.length === 0) continue
    
    // Add courses to this term
    const courseRecords = courses.map((course: any, index: number) => ({
      plan_term_id: term.id,
      course_id: course.id,
      position: index
    }))
    
    await supabase
      .from('plan_term_courses')
      .insert(courseRecords)
  }
  
  // Link user to program
  await supabase
    .from('user_programs')
    .insert({
      user_id: userId,
      program_id: program.id,
      is_primary: true
    })
  
  return plan
}

/**
 * Create a basic plan without program requirements (legacy method)
 */
export async function createBasicPlan(
  userId: string,
  planName: string
): Promise<Plan> {
  const supabase = createClient() as any
  
  // Create plan
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .insert({ user_id: userId, name: planName })
    .select()
    .single()
  
  if (planError || !plan) throw planError
  
  // Create 8 empty terms
  const terms = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B']
  const termRecords = terms.map((label, index) => ({
    plan_id: plan.id,
    term_index: index,
    label: label
  }))
  
  await supabase
    .from('plan_terms')
    .insert(termRecords)
  
  return plan
}
