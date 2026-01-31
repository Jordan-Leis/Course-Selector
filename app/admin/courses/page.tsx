import { requireAdmin } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CoursesPage() {
  await requireAdmin()
  
  const supabase = await createClient()
  
  const { data: courses, count } = await supabase
    .from('courses')
    .select('*', { count: 'exact' })
    .eq('active', true)
    .order('subject')
    .order('catalog_number')
    .limit(100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
        <p className="text-gray-600 mt-1">View and manage course catalog ({count} courses)</p>
      </div>

      {/* Course List */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Units
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Prerequisites
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {courses?.map((course: any) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{course.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{course.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{course.units}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600 max-w-md truncate">
                      {course.has_prerequisites ? 
                        (course.prerequisites_raw || 'Yes') : 
                        'None'
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Course editing UI is not yet implemented. Use the course sync script 
          (<code className="bg-blue-100 px-1 rounded">npm run sync-courses</code>) to update course data from UW API.
        </p>
      </div>
    </div>
  )
}
