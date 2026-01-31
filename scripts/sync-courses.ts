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
  
  // Mark all courses as inactive first
  const { error: inactiveError } = await supabase
    .from('courses')
    .update({ active: false })
    .neq('id', '00000000-0000-0000-0000-000000000000') // Dummy condition to satisfy WHERE requirement
  
  if (inactiveError) {
    throw new Error(`Failed to mark courses inactive: ${inactiveError.message}`)
  }
  
  // Process each seen course
  console.log(`📝 Preparing ${seenCourses.size} courses for upsert...`)
  
  // Build array of courses to upsert
  const coursesToUpsert = Array.from(seenCourses.entries()).map(([key, { course, lastTerm }]) => {
    const code = `${course.subjectCode} ${course.catalogNumber}`
    const prereqData = parsePrerequisites(course.requirementsDescription)
    
    return {
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
    }
  })
  
  // Batch upsert all courses at once
  console.log('💾 Upserting courses in batches...')
  const BATCH_SIZE = 500
  let totalUpserted = 0
  
  for (let i = 0; i < coursesToUpsert.length; i += BATCH_SIZE) {
    const batch = coursesToUpsert.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(coursesToUpsert.length / BATCH_SIZE)
    
    console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} courses)...`)
    
    const { error } = await supabase
      .from('courses')
      .upsert(batch, { 
        onConflict: 'subject,catalog_number',
        ignoreDuplicates: false 
      })
    
    if (error) {
      console.error(`   ❌ Batch ${batchNum} failed:`, error.message)
    } else {
      totalUpserted += batch.length
      console.log(`   ✅ Batch ${batchNum} complete`)
    }
  }
  
  console.log(`✅ Upserted ${totalUpserted} courses\n`)
  
  // Now handle prerequisites in batches
  console.log('🔗 Processing prerequisites...')
  
  // First, get all course IDs for courses that have prerequisites
  const coursesWithPrereqs = Array.from(seenCourses.entries())
    .filter(([_, { course }]) => course.requirementsDescription)
    .map(([_, { course }]) => ({
      subject: course.subjectCode,
      catalog_number: course.catalogNumber,
      requirements: course.requirementsDescription
    }))
  
  console.log(`   Found ${coursesWithPrereqs.length} courses with prerequisites`)
  
  // Get course IDs from database
  const { data: courseIds } = await supabase
    .from('courses')
    .select('id, subject, catalog_number')
    .in('subject', [...new Set(coursesWithPrereqs.map(c => c.subject))])
  
  if (!courseIds) {
    console.log('   ⚠️  Could not fetch course IDs, skipping prerequisites')
    return
  }
  
  // Create a map for fast lookup
  const courseIdMap = new Map(
    courseIds.map(c => [`${c.subject}|${c.catalog_number}`, c.id])
  )
  
  // Build all prerequisite records
  console.log('   Parsing and building prerequisite records...')
  const allPrereqRecords: any[] = []
  let prerequisitesProcessed = 0
  
  for (const course of coursesWithPrereqs) {
    const courseId = courseIdMap.get(`${course.subject}|${course.catalog_number}`)
    if (!courseId) continue
    
    const prereqData = parsePrerequisites(course.requirements)
    if (!prereqData.hasPrerequisites) continue
    
    for (const prereq of prereqData.prerequisites) {
      const prereqRecord: any = {
        course_id: courseId,
        prerequisite_type: prereq.type,
        operator: prereq.operator || null,
        required_level: prereq.level || null,
        raw_text: prereq.rawText,
        group_id: prereq.groupId || 0,
      }
      
      // For course prerequisites, create a record for each course
      if (prereq.type === 'course' && prereq.courses && prereq.courses.length > 0) {
        for (const courseCode of prereq.courses) {
          allPrereqRecords.push({
            ...prereqRecord,
            required_course_code: courseCode,
          })
        }
      } else {
        allPrereqRecords.push(prereqRecord)
      }
    }
    
    prerequisitesProcessed++
    if (prerequisitesProcessed % 1000 === 0) {
      console.log(`   Processed ${prerequisitesProcessed}/${coursesWithPrereqs.length} courses...`)
    }
  }
  
  console.log(`   Built ${allPrereqRecords.length} prerequisite records`)
  
  // Delete all existing prerequisites for courses we're updating
  console.log('   Clearing old prerequisites...')
  const courseIdsToUpdate = Array.from(courseIdMap.values())
  
  // Delete in batches to avoid query limits
  for (let i = 0; i < courseIdsToUpdate.length; i += BATCH_SIZE) {
    const batch = courseIdsToUpdate.slice(i, i + BATCH_SIZE)
    await supabase
      .from('course_prerequisites')
      .delete()
      .in('course_id', batch)
  }
  
  console.log('   ✅ Old prerequisites cleared')
  
  // Insert all prerequisites in batches
  console.log('   Inserting new prerequisites...')
  let totalPrereqsInserted = 0
  
  for (let i = 0; i < allPrereqRecords.length; i += BATCH_SIZE) {
    const batch = allPrereqRecords.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(allPrereqRecords.length / BATCH_SIZE)
    
    console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} prerequisites)...`)
    
    const { error } = await supabase
      .from('course_prerequisites')
      .insert(batch)
    
    if (error) {
      console.error(`   ❌ Batch ${batchNum} failed:`, error.message)
    } else {
      totalPrereqsInserted += batch.length
      console.log(`   ✅ Batch ${batchNum} complete`)
    }
  }
  
  console.log(`✅ Inserted ${totalPrereqsInserted} prerequisite records\n`)
  
  // Count inactive courses for final report
  const { count } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('active', false)
  
  const markedInactive = count || 0
  
  console.log(`\n✨ Sync complete!`)
  console.log(`   📝 Upserted: ${totalUpserted} courses`)
  console.log(`   ❌ Marked inactive: ${markedInactive} courses`)
  console.log(`   ✅ Active courses: ${seenCourses.size}`)
  console.log(`   🔗 Prerequisites processed: ${prerequisitesProcessed} courses`)
  console.log(`   📊 Total prerequisite records: ${totalPrereqsInserted}`)
}

// Run the sync
syncCourses().catch((error) => {
  console.error('❌ Sync failed:', error)
  process.exit(1)
})
