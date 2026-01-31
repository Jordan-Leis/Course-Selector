'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'
import { parsePrerequisites, getPrerequisiteDescription } from '@/lib/prerequisite-parser'

type Course = Database['public']['Tables']['courses']['Row']

interface CourseSearchProps {
  onSelectCourse: (course: Course) => void
  selectedTermIndex: number | null
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

export default function CourseSearch({ onSelectCourse, selectedTermIndex }: CourseSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const searchCourses = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('active', true)
          .or(`code.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`)
          .limit(20)

        if (error) throw error
        setResults(data || [])
      } catch (error) {
        console.error('Error searching courses:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCourses(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, searchCourses])

  if (selectedTermIndex === null) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-amber-900 text-sm">Select a Term First</h4>
            <p className="text-amber-700 text-sm mt-0.5">Click on a term column below to start adding courses</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search Courses
        </h3>
      </div>
      
      <div className="p-6">
        {/* Search input with icon */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by course code or title..."
            className="w-full pl-11 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm placeholder-gray-400"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setResults([])
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="mt-4 flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-gray-600">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium">Searching courses...</span>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="mt-4 max-h-80 overflow-y-auto space-y-2 pr-1">
            {results.map((course) => {
              const gradientColor = getSubjectColor(course.subject)
              const prereqData = course.has_prerequisites && course.prerequisites_raw
                ? parsePrerequisites(course.prerequisites_raw)
                : null
              
              return (
                <button
                  key={course.id}
                  onClick={() => {
                    onSelectCourse(course)
                    setQuery('')
                    setResults([])
                  }}
                  className="w-full text-left p-4 border-2 border-gray-100 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${gradientColor} rounded-lg flex items-center justify-center shadow-sm`}>
                      <span className="text-white font-bold text-xs">
                        {course.subject.substring(0, 3)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {course.code || `${course.subject} ${course.catalog_number}`}
                        </span>
                        {prereqData && prereqData.hasPrerequisites && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            Has Prereqs
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1 line-clamp-2">{course.title}</div>
                      {prereqData && prereqData.hasPrerequisites && (
                        <div className="text-xs text-gray-500 mt-1.5 space-y-0.5">
                          {prereqData.prerequisites.slice(0, 2).map((prereq, idx) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span className="text-blue-600">•</span>
                              <span className="line-clamp-1">{getPrerequisiteDescription(prereq)}</span>
                            </div>
                          ))}
                          {prereqData.prerequisites.length > 2 && (
                            <div className="text-blue-600">+{prereqData.prerequisites.length - 2} more...</div>
                          )}
                        </div>
                      )}
                      {course.units && (
                        <div className="text-xs text-gray-500 mt-1.5 font-medium">
                          {course.units} {course.units === 1 ? 'unit' : 'units'}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && query.length >= 2 && results.length === 0 && (
          <div className="mt-4 py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No courses found</p>
            <p className="text-gray-500 text-sm mt-1">Try a different search term</p>
          </div>
        )}

        {/* Initial state hint */}
        {!loading && query.length < 2 && results.length === 0 && (
          <div className="mt-4 py-8 text-center text-gray-500 text-sm">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p>Type at least 2 characters to search</p>
          </div>
        )}
      </div>
    </div>
  )
}
