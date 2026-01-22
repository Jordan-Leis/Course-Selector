'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type Course = Database['public']['Tables']['courses']['Row']

interface CourseSearchProps {
  onSelectCourse: (course: Course) => void
  selectedTermIndex: number | null
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        Please select a term to add courses
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Search Courses</h3>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by course code or title..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
      />

      {loading && <div className="text-gray-600 text-sm">Searching...</div>}

      {!loading && results.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-2">
          {results.map((course) => (
            <button
              key={course.id}
              onClick={() => {
                onSelectCourse(course)
                setQuery('')
                setResults([])
              }}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="font-medium text-gray-900">{course.code || `${course.subject} ${course.catalog_number}`}</div>
              <div className="text-sm text-gray-600">{course.title}</div>
              {course.units && (
                <div className="text-xs text-gray-500 mt-1">{course.units} units</div>
              )}
            </button>
          ))}
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <div className="text-gray-500 text-sm">No courses found</div>
      )}
    </div>
  )
}
