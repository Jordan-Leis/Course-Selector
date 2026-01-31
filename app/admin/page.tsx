import { getAdminUser, getRoleDisplayName } from '@/lib/admin/auth'
import { getAuditLog } from '@/lib/admin/audit'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const adminUser = await getAdminUser()
  const { entries: recentActivity } = await getAuditLog(10, 0)
  
  const supabase = await createClient()
  
  // Get quick stats
  const [programsResult, coursesResult, usersResult, plansResult] = await Promise.all([
    supabase.from('program_templates').select('id', { count: 'exact', head: true }),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
    supabase.from('plans').select('id', { count: 'exact', head: true })
  ])

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! You are logged in as <span className="font-semibold">{getRoleDisplayName(adminUser!.role)}</span>
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Programs"
          value={programsResult.count || 0}
          icon="📚"
          href="/admin/programs"
          description="Program templates"
        />
        <StatCard
          title="Courses"
          value={coursesResult.count || 0}
          icon="📖"
          href="/admin/courses"
          description="Course catalog"
        />
        <StatCard
          title="Users"
          value={usersResult.count || 0}
          icon="👥"
          href="/admin/users"
          description="Registered users"
        />
        <StatCard
          title="Plans"
          value={plansResult.count || 0}
          icon="📅"
          href="/admin/validation"
          description="Student plans"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionButton
            href="/admin/programs"
            icon="📝"
            title="Edit Programs"
            description="Manage program templates"
          />
          <ActionButton
            href="/admin/courses"
            icon="✏️"
            title="Edit Courses"
            description="Update course data"
          />
          <ActionButton
            href="/admin/validation"
            icon="✅"
            title="Validate Plans"
            description="Test plan validation"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <Link
            href="/admin/audit"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </Link>
        </div>
        
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {entry.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  entry.action_type === 'insert' ? 'bg-green-100 text-green-800' :
                  entry.action_type === 'update' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {entry.action_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, href, description }: {
  title: string
  value: number
  icon: string
  href: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  )
}

function ActionButton({ href, icon, title, description }: {
  href: string
  icon: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all border border-blue-200"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  )
}
