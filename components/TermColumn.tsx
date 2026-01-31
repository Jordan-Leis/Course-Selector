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
  programTemplate?: any | null
}

export default function TermColumn({
  label,
  termIndex,
  courses,
  onRemoveCourse,
  isSelected,
  onSelect,
  programTemplate = null,
}: TermColumnProps) {
  const totalUnits = courses.reduce((sum, tc) => sum + (tc.course.units || 0), 0)
  const isOverloaded = totalUnits > 6

  return (
    <div className="flex flex-col h-full min-h-[500px] animate-in fade-in duration-300">
      {/* Header with gradient */}
      <div
        onClick={onSelect}
        className={`relative p-4 rounded-t-xl cursor-pointer transition-all duration-300 ${
          isSelected
            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.02] ring-2 ring-blue-400 ring-offset-2'
            : 'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-900 shadow-sm hover:shadow-md'
        }`}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        <div className="font-bold text-center text-lg mb-1">{label}</div>
        
        {/* Course and unit count */}
        <div className={`text-xs text-center flex items-center justify-center gap-2 ${
          isSelected ? 'text-blue-100' : 'text-gray-600'
        }`}>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            {courses.length}
          </span>
          {totalUnits > 0 && (
            <>
              <span className={isSelected ? 'text-blue-200' : 'text-gray-400'}>•</span>
              <span className={`flex items-center gap-1 font-semibold ${
                isOverloaded ? (isSelected ? 'text-yellow-200' : 'text-red-600') : ''
              }`}>
                {totalUnits} {totalUnits === 1 ? 'unit' : 'units'}
                {isOverloaded && (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
            </>
          )}
        </div>
        
        {/* Click to add hint */}
        {!isSelected && (
          <div className="text-[10px] text-center mt-1.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to add courses
          </div>
        )}
      </div>
      
      {/* Course list area */}
      <div className={`flex-1 rounded-b-xl p-3 space-y-2.5 overflow-y-auto border-2 border-t-0 transition-all duration-300 ${
        isSelected
          ? 'bg-gradient-to-b from-blue-50/50 to-white border-blue-200 shadow-inner'
          : 'bg-white border-gray-200'
      }`}>
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-xs font-medium">No courses yet</p>
            <p className="text-[10px] mt-1">{isSelected ? 'Search above to add' : 'Click to start'}</p>
          </div>
        ) : (
          courses.map((termCourse) => (
            <CourseCard
              key={termCourse.id}
              course={termCourse.course}
              onRemove={() => onRemoveCourse(termCourse.id)}
              programTemplate={programTemplate}
              termIndex={termIndex}
            />
          ))
        )}
      </div>
      
      {/* Overload warning badge at bottom */}
      {isOverloaded && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-t-2 border-red-200 px-3 py-2 rounded-b-xl">
          <div className="flex items-center gap-2 text-red-700 text-xs">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Overload: {totalUnits} units</span>
          </div>
        </div>
      )}
    </div>
  )
}
