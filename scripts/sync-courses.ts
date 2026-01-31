#!/usr/bin/env tsx
/**
 * Sync courses from UW Open Data API
 * 
 * This script fetches course data from UW's Open Data API for recent terms
 * and marks courses as active/inactive based on whether they appear in recent offerings.
 * 
 * Usage:
 *   tsx scripts/sync-courses.ts
 * 
 * Environment variables required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (for admin operations)
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'
import { parsePrerequisites } from '../lib/prerequisite-parser'

// UW Open Data API base URL
const UW_API_BASE = 'https://openapi.data.uwaterloo.ca/v3'

// Terms to check (format: 1YYT where YY is last 2 digits of year, T is term)
// e.g., 1251 = Winter 2025, 1249 = Fall 2024
// Term codes: 1=Winter, 5=Spring, 9=Fall
function getRecentTerms(): string[] {
  const terms: string[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-12
  
  // Calculate current term
  let term: number
  if (currentMonth >= 1 && currentMonth < 5) {
    term = 1 // Winter
  } else if (currentMonth >= 5 && currentMonth < 9) {
    term = 5 // Spring
  } else {
    term = 9 // Fall
  }
  
  // Generate last 3 terms
  let year = currentYear
  let termCode = term
  
  for (let i = 0; i < 3; i++) {
    // Format: 1 + last 2 digits of year + term digit
    const yearSuffix = String(year).slice(-2)
    const termStr = `1${yearSuffix}${termCode}`
    terms.push(termStr)
    
    // Move to previous term
    termCode -= 4
    if (termCode < 1) {
      termCode = 9
      year -= 1
    }
  }
  
  return terms
}

interface UWCourse {
  subjectCode: string
  catalogNumber: string
  title: string
  description?: string
  requirementsDescription?: string
  units?: number
  unit?: number  // Alternative field name
}

async function fetchCoursesForTerm(term: string): Promise<UWCourse[]> {
  // UW Open Data API endpoint for courses by term
  // Format: /v3/courses/{term}
  const url = `${UW_API_BASE}/courses/${term}`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  // Add API key if provided
  if (process.env.UW_API_KEY) {
    headers['X-API-KEY'] = process.env.UW_API_KEY
  }
  
  try {
    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  Term ${term} not found (may not be available yet)`)
        return []
      }
      const errorText = await response.text()
      console.log(`  HTTP ${response.status} for term ${term}: ${errorText}`)
      return []
    }
    
    const data = await response.json()
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data
    } else if (data && Array.isArray(data.data)) {
      return data.data
    } else if (data && data.courses && Array.isArray(data.courses)) {
      return data.courses
    }
    
    return []
  } catch (error) {
    console.error(`  Error fetching term ${term}:`, error)
    return []
  }
}

async function syncCourses() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('🔄 Starting course sync from UW Open Data API...\n')
  
  // Get recent terms
  const terms = getRecentTerms()
  console.log(`📅 Checking ${terms.length} recent terms: ${terms.join(', ')}\n`)
  
  // Track courses seen in recent terms
  const seenCourses = new Map<string, { course: UWCourse; lastTerm: string }>()
  
  // Fetch courses for each term
  for (const term of terms) {
    console.log(`📚 Fetching courses for term ${term}...`)
    const courses = await fetchCoursesForTerm(term)
    
    if (courses.length > 0) {
      console.log(`  Found ${courses.length} courses`)
      
      // Track each course with the most recent term it appeared in
      for (const course of courses) {
        const catalogNum = course.catalogNumber || ''
        const subject = course.subjectCode || ''
        
        if (!subject || !catalogNum) {
          console.warn(`  Skipping course with missing subject/catalog:`, course)
          continue
        }
        
        const key = `${subject} ${catalogNum}`.toUpperCase()
        const existing = seenCourses.get(key)
        
        // Normalize course data
        const normalizedCourse: UWCourse = {
          subjectCode: subject,
          catalogNumber: catalogNum,
          title: course.title || '',
          description: course.description,
          requirementsDescription: course.requirementsDescription,
          units: course.units || course.unit,
        }
        
        // Keep the most recent term
        if (!existing || term > existing.lastTerm) {
          seenCourses.set(key, {
            course: normalizedCourse,
            lastTerm: term,
          })
        }
      }
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log(`\n✅ Found ${seenCourses.size} unique courses across recent terms\n`)
  
  // Update database
  console.log('💾 Updating database...')
  
  let updated = 0
  let markedInactive = 0
  let inserted = 0
  
  // Mark all courses as inactive first
  const { error: inactiveError } = await supabase
    .from('courses')
    .update({ active: false })
    .neq('id', '00000000-0000-0000-0000-000000000000') // Dummy condition to satisfy WHERE requirement
  
  if (inactiveError) {
    throw new Error(`Failed to mark courses inactive: ${inactiveError.message}`)
  }
  
  // Process each seen course
  let prerequisitesProcessed = 0
  
  for (const [key, { course, lastTerm }] of seenCourses.entries()) {
    const code = `${course.subjectCode} ${course.catalogNumber}`
    
    // Parse prerequisites
    const prereqData = parsePrerequisites(course.requirementsDescription)
    
    // Check if course exists
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('subject', course.subjectCode)
      .eq('catalog_number', course.catalogNumber)
      .single()
    
    let courseId: string | null = null
    
    if (existing) {
      courseId = existing.id
      // Update existing course
      const { error } = await supabase
        .from('courses')
        .update({
          active: true,
          last_seen_term: lastTerm,
          title: course.title,
          description: course.description || null,
          units: course.units || null,
          code: code,
          prerequisites_raw: course.requirementsDescription || null,
          has_prerequisites: prereqData.hasPrerequisites,
        })
        .eq('id', existing.id)
      
      if (error) {
        console.error(`  Error updating ${code}:`, error.message)
      } else {
        updated++
      }
    } else {
      // Insert new course
      const { data: newCourse, error } = await supabase
        .from('courses')
        .insert({
          subject: course.subjectCode,
          catalog_number: course.catalogNumber,
          code: code,
          title: course.title,
          description: course.description || null,
          units: course.units || null,
          active: true,
          last_seen_term: lastTerm,
          prerequisites_raw: course.requirementsDescription || null,
          has_prerequisites: prereqData.hasPrerequisites,
        })
        .select('id')
        .single()
      
      if (error) {
        console.error(`  Error inserting ${code}:`, error.message)
      } else {
        inserted++
        courseId = newCourse?.id || null
      }
    }
    
    // Store parsed prerequisites if we have a course ID
    if (courseId && prereqData.hasPrerequisites) {
      // Delete existing prerequisites for this course
      await supabase
        .from('course_prerequisites')
        .delete()
        .eq('course_id', courseId)
      
      // Insert new prerequisites
      for (const prereq of prereqData.prerequisites) {
        const prereqRecord: any = {
          course_id: courseId,
          prerequisite_type: prereq.type,
          operator: prereq.operator || null,
          required_level: prereq.level || null,
          raw_text: prereq.rawText,
          group_id: prereq.groupId || 0,
        }
        
        // For course prerequisites, store course codes
        if (prereq.type === 'course' && prereq.courses && prereq.courses.length > 0) {
          // Store the first course as required_course_code
          // For multiple courses (OR/AND), we'll create multiple records
          for (const courseCode of prereq.courses) {
            await supabase
              .from('course_prerequisites')
              .insert({
                ...prereqRecord,
                required_course_code: courseCode,
              })
          }
        } else {
          await supabase
            .from('course_prerequisites')
            .insert(prereqRecord)
        }
      }
      
      prerequisitesProcessed++
    }
  }
  
  // Count inactive courses
  const { count } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('active', false)
  
  markedInactive = count || 0
  
  console.log(`\n✨ Sync complete!`)
  console.log(`   📝 Updated: ${updated} courses`)
  console.log(`   ➕ Inserted: ${inserted} new courses`)
  console.log(`   ❌ Marked inactive: ${markedInactive} courses`)
  console.log(`   ✅ Active courses: ${seenCourses.size}`)
  console.log(`   🔗 Prerequisites processed: ${prerequisitesProcessed} courses`)
}

// Run the sync
syncCourses().catch((error) => {
  console.error('❌ Sync failed:', error)
  process.exit(1)
})
