/**
 * Course Type Classification
 * 
 * Determines course types (Core, TE, CSE, NSE) based on program templates
 */

export type CourseType = 'core' | 'te' | 'cse' | 'nse' | 'free' | 'elective'

export interface CourseTypeInfo {
  type: CourseType
  label: string
  colorClasses: string
}

const COURSE_TYPE_COLORS: Record<CourseType, { label: string; colorClasses: string }> = {
  core: {
    label: 'Core',
    colorClasses: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  te: {
    label: 'TE',
    colorClasses: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  cse: {
    label: 'CSE',
    colorClasses: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  nse: {
    label: 'NSE',
    colorClasses: 'bg-green-100 text-green-800 border-green-300',
  },
  free: {
    label: 'Free',
    colorClasses: 'bg-pink-100 text-pink-800 border-pink-300',
  },
  elective: {
    label: 'Elective',
    colorClasses: 'bg-gray-100 text-gray-700 border-gray-300',
  },
}

/**
 * Technical Elective course codes from EE/CE/SE curriculum
 */
const TE_COURSES = new Set([
  // List 1 (EE TEs)
  'ECE 311', 'ECE 313', 'ECE 331', 'ECE 360', 'ECE 373',
  // List 2 (EE TEs)
  'ECE 320', 'ECE 351', 'ECE 356', 'ECE 358',
  // List 3 (EE TEs)
  'ECE 406', 'ECE 409', 'ECE 414', 'ECE 416', 'ECE 417', 'ECE 423', 'ECE 432', 'ECE 433',
  'ECE 444', 'ECE 445', 'ECE 451', 'ECE 452', 'ECE 453', 'ECE 454', 'ECE 455', 'ECE 457A',
  'ECE 457B', 'ECE 457C', 'ECE 458', 'ECE 459', 'ECE 462', 'ECE 463', 'ECE 464', 'ECE 467',
  'ECE 474', 'ECE 475', 'ECE 481', 'ECE 486', 'ECE 488', 'ECE 493', 'ECE 495', 'ECE 499',
  // List 4 & 5 (EE TEs)
  'ECE 224', 'ECE 252', 'ECE 327', 'ECE 350',
  'STAT 340', 'STAT 341', 'STAT 440', 'STAT 441', 'STAT 444',
  // SE TEs
  'CS 341', 'CS 343', 'CS 348', 'CS 349', 'CS 370', 'CS 444', 'CS 445', 'CS 446', 'CS 447',
  'CS 448', 'CS 449', 'CS 450', 'CS 451', 'CS 454', 'CS 456', 'CS 457', 'CS 458', 'CS 486',
  'SE 463', 'SE 464', 'SE 465', 'SE 490', 'SE 491', 'SE 499',
])

/**
 * NSE course codes (Natural Science Electives)
 */
const NSE_COURSES = new Set([
  'BIOL 130', 'BIOL 140', 'BIOL 201', 'BIOL 208', 'BIOL 211', 'BIOL 240', 'BIOL 241',
  'BIOL 301', 'BIOL 303', 'BIOL 308', 'BIOL 309', 'BIOL 330', 'BIOL 331', 'BIOL 335',
  'BIOL 341', 'BIOL 342', 'BIOL 350', 'BIOL 354', 'BIOL 359', 'BIOL 361', 'BIOL 364',
  'BIOL 373', 'BIOL 376', 'BIOL 432', 'BIOL 434', 'BIOL 439', 'BIOL 441', 'BIOL 442',
  'BIOL 444', 'BIOL 449', 'BIOL 469', 'BIOL 473',
  'CHEM 120', 'CHEM 123', 'CHEM 125', 'CHEM 220', 'CHEM 221', 'CHEM 237', 'CHEM 250',
  'CHEM 254', 'CHEM 262', 'CHEM 264', 'CHEM 266', 'CHEM 350', 'CHEM 356', 'CHEM 430',
  'EARTH 121', 'EARTH 122', 'EARTH 123', 'EARTH 153', 'EARTH 221', 'EARTH 223', 'EARTH 231',
  'EARTH 232', 'EARTH 233', 'EARTH 235', 'EARTH 238', 'EARTH 260', 'EARTH 270', 'EARTH 281',
  'EARTH 342', 'EARTH 390', 'EARTH 423', 'EARTH 434', 'EARTH 436', 'EARTH 437', 'EARTH 438',
  'EARTH 439', 'EARTH 440', 'EARTH 442', 'EARTH 444', 'EARTH 447', 'EARTH 454', 'EARTH 455',
  'EARTH 456', 'EARTH 458', 'EARTH 459', 'EARTH 460', 'EARTH 470', 'EARTH 471', 'EARTH 473',
  'PHYS 121', 'PHYS 122', 'PHYS 124', 'PHYS 125', 'PHYS 221', 'PHYS 224', 'PHYS 225', 'PHYS 230',
  'PHYS 233', 'PHYS 236', 'PHYS 242', 'PHYS 243', 'PHYS 256', 'PHYS 275', 'PHYS 334', 'PHYS 358',
  'PHYS 359', 'PHYS 360', 'PHYS 363', 'PHYS 364', 'PHYS 365', 'PHYS 375', 'PHYS 380', 'PHYS 437',
  'PHYS 438', 'PHYS 440', 'PHYS 445', 'PHYS 454', 'PHYS 460', 'PHYS 470', 'PHYS 475', 'PHYS 480',
  'SCI 206', 'SCI 207', 'SCI 238',
])

/**
 * CSE course prefixes (Complementary Studies Electives)
 */
const CSE_PREFIXES = ['AFM', 'ANTH', 'ARBUS', 'BUS', 'COMM', 'ECON', 'ENGL', 'FINE', 'FR', 'GER', 
                       'HIST', 'HRM', 'ITALSTUD', 'JAPAN', 'MUSIC', 'PHIL', 'POLI', 'PSYCH', 'RS', 
                       'SOCIOL', 'SOC', 'SPAN', 'SPCOM', 'PD']

/**
 * Free Elective courses (SE-specific)
 */
const FREE_ELECTIVE_COURSES = new Set([
  'CS 115', 'CS 116', 'CS 135', 'CS 136', 'CS 137', 'CS 138', 'CS 145', 'CS 146',
  // Add more as needed from SE curriculum
])

/**
 * Get term label from index (0=1A, 1=1B, 2=2A, etc.)
 */
function getTermLabel(termIndex: number): string {
  const year = Math.floor(termIndex / 2) + 1
  const semester = termIndex % 2 === 0 ? 'A' : 'B'
  return `${year}${semester}`
}

/**
 * Determine course type based on program template and course code
 */
export function getCourseType(
  courseCode: string,
  programTemplate: any | null,
  termIndex: number
): CourseTypeInfo {
  // Default to elective if no program template
  if (!programTemplate) {
    return {
      type: 'elective',
      ...COURSE_TYPE_COLORS.elective,
    }
  }

  const termLabel = getTermLabel(termIndex)
  const requiredCourses = programTemplate.required_courses || {}
  
  // Check if it's a required core course for this term
  if (requiredCourses[termLabel]?.includes(courseCode)) {
    return {
      type: 'core',
      ...COURSE_TYPE_COLORS.core,
    }
  }

  // Check if it's in any required courses list (core but different term)
  for (const term of Object.values(requiredCourses) as string[][]) {
    if (term.includes(courseCode)) {
      return {
        type: 'core',
        ...COURSE_TYPE_COLORS.core,
      }
    }
  }

  // Check if it's a TE
  if (TE_COURSES.has(courseCode)) {
    return {
      type: 'te',
      ...COURSE_TYPE_COLORS.te,
    }
  }

  // Check if it's an NSE
  if (NSE_COURSES.has(courseCode)) {
    return {
      type: 'nse',
      ...COURSE_TYPE_COLORS.nse,
    }
  }

  // Check if it's a CSE by prefix
  const coursePrefix = courseCode.split(' ')[0]
  if (CSE_PREFIXES.includes(coursePrefix)) {
    return {
      type: 'cse',
      ...COURSE_TYPE_COLORS.cse,
    }
  }

  // Check if it's a Free Elective
  if (FREE_ELECTIVE_COURSES.has(courseCode)) {
    return {
      type: 'free',
      ...COURSE_TYPE_COLORS.free,
    }
  }

  // Default to elective (white/gray background)
  return {
    type: 'elective',
    ...COURSE_TYPE_COLORS.elective,
  }
}
