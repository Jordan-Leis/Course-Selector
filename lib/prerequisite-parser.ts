/**
 * Prerequisite Parser
 * 
 * Parses UW course prerequisite strings into structured data.
 * Handles patterns like:
 * - "Prereq: ECE 250"
 * - "Prereq: One of ECE 250, CS 240"
 * - "Level at least 2A Computer Engineering"
 * - "Antireq: SE 463"
 * - "Coreq: ECE 205"
 */

export interface ParsedPrerequisite {
  type: 'course' | 'level' | 'corequisite' | 'antirequisite'
  operator?: 'AND' | 'OR' | 'ONE_OF'
  courses?: string[] // e.g., ['ECE 250', 'CS 240']
  level?: string // e.g., '2A', '3B'
  program?: string // e.g., 'Computer Engineering'
  rawText: string
  groupId?: number
}

export interface ParseResult {
  prerequisites: ParsedPrerequisite[]
  rawText: string
  hasPrerequisites: boolean
}

/**
 * Parse a prerequisite string into structured data
 */
export function parsePrerequisites(requirementsText: string | null | undefined): ParseResult {
  if (!requirementsText || requirementsText.trim() === '') {
    return {
      prerequisites: [],
      rawText: '',
      hasPrerequisites: false,
    }
  }

  const prerequisites: ParsedPrerequisite[] = []
  const text = requirementsText.trim()

  // Split by common separators (.; or newlines)
  const sections = text.split(/[;.]/).map(s => s.trim()).filter(s => s)

  let groupId = 0

  for (const section of sections) {
    // Parse antirequisites
    const antireqMatch = section.match(/Antireq:?\s*(.+)/i)
    if (antireqMatch) {
      const courses = extractCourses(antireqMatch[1])
      prerequisites.push({
        type: 'antirequisite',
        courses,
        rawText: section,
        groupId: groupId++,
      })
      continue
    }

    // Parse corequisites
    const coreqMatch = section.match(/Coreq:?\s*(.+)/i)
    if (coreqMatch) {
      const courses = extractCourses(coreqMatch[1])
      prerequisites.push({
        type: 'corequisite',
        courses,
        rawText: section,
        groupId: groupId++,
      })
      continue
    }

    // Parse level requirements
    const levelMatch = section.match(/Level\s+at\s+least\s+(\d+[AB])\s+(.+)/i)
    if (levelMatch) {
      prerequisites.push({
        type: 'level',
        level: levelMatch[1],
        program: levelMatch[2].trim(),
        rawText: section,
        groupId: groupId++,
      })
      continue
    }

    // Parse prerequisites
    const prereqMatch = section.match(/Prereq:?\s*(.+)/i)
    if (prereqMatch) {
      const prereqText = prereqMatch[1]

      // Check for "One of" pattern
      if (/one\s+of/i.test(prereqText)) {
        const courses = extractCourses(prereqText)
        prerequisites.push({
          type: 'course',
          operator: 'ONE_OF',
          courses,
          rawText: section,
          groupId: groupId++,
        })
        continue
      }

      // Check for OR pattern (explicit "or" in text)
      if (/\bor\b/i.test(prereqText) && !prereqText.includes(',')) {
        const courses = extractCourses(prereqText)
        prerequisites.push({
          type: 'course',
          operator: 'OR',
          courses,
          rawText: section,
          groupId: groupId++,
        })
        continue
      }

      // Check for AND pattern (commas or "and")
      const courses = extractCourses(prereqText)
      if (courses.length > 1) {
        prerequisites.push({
          type: 'course',
          operator: 'AND',
          courses,
          rawText: section,
          groupId: groupId++,
        })
      } else if (courses.length === 1) {
        prerequisites.push({
          type: 'course',
          courses,
          rawText: section,
          groupId: groupId++,
        })
      }
      continue
    }

    // If we didn't match any pattern but text exists, store it as a course requirement
    const courses = extractCourses(section)
    if (courses.length > 0) {
      prerequisites.push({
        type: 'course',
        courses,
        rawText: section,
        groupId: groupId++,
      })
    }
  }

  return {
    prerequisites,
    rawText: text,
    hasPrerequisites: prerequisites.length > 0,
  }
}

/**
 * Extract course codes from text
 * Matches patterns like: ECE 250, MATH 117, CS 240
 */
function extractCourses(text: string): string[] {
  const courses: string[] = []
  
  // Match course codes: WORD NUMBER (e.g., ECE 250, MATH 117)
  // Also handles ranges like ECE 250/251
  const coursePattern = /\b([A-Z]{2,10})\s+(\d{3}[A-Z]?(?:\/\d{3}[A-Z]?)?)\b/g
  
  let match
  while ((match = coursePattern.exec(text)) !== null) {
    const courseCode = `${match[1]} ${match[2]}`
    if (!courses.includes(courseCode)) {
      courses.push(courseCode)
    }
  }

  return courses
}

/**
 * Check if a prerequisite is satisfied given a list of completed courses
 */
export function isPrerequisiteSatisfied(
  prereq: ParsedPrerequisite,
  completedCourses: string[],
  currentLevel?: string
): boolean {
  switch (prereq.type) {
    case 'course':
      if (!prereq.courses || prereq.courses.length === 0) return true

      switch (prereq.operator) {
        case 'ONE_OF':
        case 'OR':
          // At least one course must be completed
          return prereq.courses.some(course => completedCourses.includes(course))
        
        case 'AND':
          // All courses must be completed
          return prereq.courses.every(course => completedCourses.includes(course))
        
        default:
          // Single course requirement
          return prereq.courses.every(course => completedCourses.includes(course))
      }

    case 'level':
      // Check if current level >= required level
      if (!currentLevel || !prereq.level) return false
      return compareLevels(currentLevel, prereq.level) >= 0

    case 'corequisite':
      // Corequisites can be taken in same term or earlier
      if (!prereq.courses || prereq.courses.length === 0) return true
      return prereq.courses.some(course => completedCourses.includes(course))

    case 'antirequisite':
      // Antirequisites must NOT be completed
      if (!prereq.courses || prereq.courses.length === 0) return true
      return !prereq.courses.some(course => completedCourses.includes(course))

    default:
      return false
  }
}

/**
 * Compare two academic levels (e.g., '2A' vs '3B')
 * Returns: -1 if level1 < level2, 0 if equal, 1 if level1 > level2
 */
function compareLevels(level1: string, level2: string): number {
  const parseLevel = (level: string) => {
    const match = level.match(/(\d+)([AB])/)
    if (!match) return null
    const year = parseInt(match[1])
    const term = match[2] === 'A' ? 0 : 1
    return year * 2 + term
  }

  const l1 = parseLevel(level1)
  const l2 = parseLevel(level2)

  if (l1 === null || l2 === null) return 0
  
  if (l1 < l2) return -1
  if (l1 > l2) return 1
  return 0
}

/**
 * Get human-readable description of a prerequisite
 */
export function getPrerequisiteDescription(prereq: ParsedPrerequisite): string {
  switch (prereq.type) {
    case 'course':
      if (!prereq.courses || prereq.courses.length === 0) return prereq.rawText

      if (prereq.operator === 'ONE_OF' || prereq.operator === 'OR') {
        return `One of: ${prereq.courses.join(', ')}`
      } else if (prereq.operator === 'AND') {
        return `All of: ${prereq.courses.join(', ')}`
      } else {
        return prereq.courses.join(', ')
      }

    case 'level':
      return `Level ${prereq.level} or higher${prereq.program ? ` in ${prereq.program}` : ''}`

    case 'corequisite':
      return `Corequisite: ${prereq.courses?.join(', ') || prereq.rawText}`

    case 'antirequisite':
      return `Cannot take with: ${prereq.courses?.join(', ') || prereq.rawText}`

    default:
      return prereq.rawText
  }
}
