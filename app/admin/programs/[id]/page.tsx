import { requirePermission } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Database } from '@/lib/supabase/types'

type ProgramTemplate = Database['public']['Tables']['program_templates']['Row']

export default async function ProgramEditPage({ params }: { params: { id: string } }) {
  await requirePermission(['super_admin', 'program_editor'])
  
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('program_templates')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (error || !data) {
    notFound()
  }

  const program = data as ProgramTemplate
  const requiredCourses = (program.required_courses || {}) as Record<string, string[]>
  const electiveReqs = (program.elective_requirements || {}) as Record<string, any>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/programs"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-2 inline-block"
          >
            ← Back to Programs
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{program.program_name}</h1>
          <p className="text-gray-600 mt-1">{program.program_code} • {program.degree_type}</p>
        </div>
      </div>

      {/* Program Info */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Program Information</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-600">Program Code</dt>
            <dd className="text-lg font-semibold text-gray-900 mt-1">{program.program_code}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600">Degree Type</dt>
            <dd className="text-lg font-semibold text-gray-900 mt-1">{program.degree_type}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-sm font-medium text-gray-600">Description</dt>
            <dd className="text-gray-900 mt-1">{program.description}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600">Minimum Units</dt>
            <dd className="text-lg font-semibold text-gray-900 mt-1">{program.minimum_units}</dd>
          </div>
        </dl>
      </div>

      {/* Required Courses */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Required Courses by Term</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(requiredCourses || {}).map(([term, courses]) => (
            <div key={term} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">{term}</h3>
              <ul className="space-y-1">
                {(courses as string[]).map((course) => (
                  <li key={course} className="text-sm text-gray-700">
                    {course}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Elective Requirements */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Elective Requirements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(electiveReqs || {}).map(([type, req]: [string, any]) => (
            <div key={type} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">{type}</h3>
                <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                  {req.required}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{req.description}</p>
              {req.rules && (
                <div className="text-xs text-gray-600 space-y-1">
                  {Object.entries(req.rules).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span> {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Direct editing of program templates is not yet implemented in the UI. 
          Please use SQL migrations to update program templates. Viewing and validation tools are available.
        </p>
      </div>
    </div>
  )
}
