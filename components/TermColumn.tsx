'use client'

import { Database } from '@/lib/supabase/types'
import CourseCard from './CourseCard'

type Course = Database['public']['Tables']['courses']['Row']

interface TermCourse {
  id: string
  course: Course
}

interface TermColumnProps {
  label: string
  termIndex: number
  courses: TermCourse[]
  onRemoveCourse: (planTermCourseId: string) => void
  isSelected: boolean
  onSelect: () => void
}

export default function TermColumn({
  label,
  termIndex,
  courses,
  onRemoveCourse,
  isSelected,
  onSelect,
}: TermColumnProps) {
  const totalUnits = courses.reduce((sum, tc) => sum + (tc.course.units || 0), 0)

  return (
    <div
      className={`flex flex-col h-full min-h-[400px] ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div
        onClick={onSelect}
        className={`p-3 rounded-t-lg cursor-pointer ${
          isSelected
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
        } transition-colors`}
      >
        <div className="font-semibold text-center">{label}</div>
        <div className="text-xs text-center mt-1">
          {courses.length} course{courses.length !== 1 ? 's' : ''}
          {totalUnits > 0 && ` • ${totalUnits} units`}
        </div>
      </div>
      <div className="flex-1 bg-gray-50 rounded-b-lg p-2 space-y-2 overflow-y-auto border border-t-0 border-gray-200">
        {courses.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">
            No courses yet
          </div>
        ) : (
          courses.map((termCourse) => (
            <CourseCard
              key={termCourse.id}
              course={termCourse.course}
              onRemove={() => onRemoveCourse(termCourse.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
