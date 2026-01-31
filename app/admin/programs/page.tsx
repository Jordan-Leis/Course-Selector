import { requirePermission } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Database } from '@/lib/supabase/types'

type ProgramTemplate = Database['public']['Tables']['program_templates']['Row']

export default async function ProgramsPage() {
  await requirePermission(['super_admin', 'program_editor'])
  
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('program_templates')
    .select('*')
    .order('program_name')
  
  if (error) {
    console.error('Error loading programs:', error)
  }

  const programs = (data || []) as ProgramTemplate[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Program Templates</h1>
          <p className="text-gray-600 mt-1">Manage engineering program requirements</p>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <ProgramCard key={program.id} program={program} />
        ))}
      </div>
    </div>
  )
}

function ProgramCard({ program }: { program: ProgramTemplate }) {
  const requiredCourses = program.required_courses as Record<string, string[]>
  const totalRequired = Object.values(requiredCourses || {}).flat().length
  const electiveReqs = program.elective_requirements as Record<string, any>
  const totalElectives = Object.values(electiveReqs || {}).reduce(
    (sum: number, req: any) => sum + (req.required || 0), 0
  )

  return (
    <Link
      href={`/admin/programs/${program.id}`}
      className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {program.program_name}
          </h3>
          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mt-2">
            {program.program_code}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {program.description || 'No description'}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900">{totalRequired}</div>
          <div className="text-xs text-gray-600">Required Courses</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900">{totalElectives}</div>
          <div className="text-xs text-gray-600">Electives</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-600">{program.degree_type}</span>
        <span className="text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
          Edit →
        </span>
      </div>
    </Link>
  )
}
