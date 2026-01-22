'use client'

import { Database } from '@/lib/supabase/types'

type Course = Database['public']['Tables']['courses']['Row']

interface CourseCardProps {
  course: Course
  onRemove: () => void
}

export default function CourseCard({ course, onRemove }: CourseCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="font-medium text-gray-900 text-sm">
            {course.code || `${course.subject} ${course.catalog_number}`}
          </div>
          <div className="text-xs text-gray-600 mt-1">{course.title}</div>
          {course.units && (
            <div className="text-xs text-gray-500 mt-1">{course.units} units</div>
          )}
        </div>
        <button
          onClick={onRemove}
          className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
        >
          ×
        </button>
      </div>
    </div>
  )
}
