'use client'

import { Database } from '@/lib/supabase/types'

type Course = Database['public']['Tables']['courses']['Row']

interface CourseCardProps {
  course: Course
  onRemove: () => void
}

// Generate a consistent color based on subject code
function getSubjectColor(subject: string): string {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-indigo-500 to-indigo-600',
    'from-violet-500 to-violet-600',
    'from-cyan-500 to-cyan-600',
    'from-teal-500 to-teal-600',
    'from-sky-500 to-sky-600',
  ]
  const hash = subject.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export default function CourseCard({ course, onRemove }: CourseCardProps) {
  const gradientColor = getSubjectColor(course.subject)

  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientColor}`} />
      
      <div className="p-3.5">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            {/* Course code with gradient background */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-block px-2.5 py-0.5 rounded-md bg-gradient-to-r ${gradientColor} text-white text-xs font-semibold shadow-sm`}>
                {course.code || `${course.subject} ${course.catalog_number}`}
              </span>
              {course.units && (
                <span className="text-xs text-gray-500 font-medium">
                  {course.units} {course.units === 1 ? 'unit' : 'units'}
                </span>
              )}
            </div>
            
            {/* Course title */}
            <div className="text-sm text-gray-700 leading-snug font-medium line-clamp-2">
              {course.title}
            </div>
          </div>
          
          {/* Remove button with hover effect */}
          <button
            onClick={onRemove}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 opacity-70 group-hover:opacity-100"
            aria-label="Remove course"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
