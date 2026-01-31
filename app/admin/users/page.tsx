import { requireAdmin } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'

export default async function UsersPage() {
  await requireAdmin()
  
  const supabase = await createClient()
  
  const { data: users } = await supabase
    .from('profiles')
    .select('*, plans:plans(count)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">View and manage registered users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{users?.length || 0}</div>
          <div className="text-sm text-gray-600 mt-1">Total Users</div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">
            {users?.reduce((sum: number, u: any) => sum + (u.plans?.[0]?.count || 0), 0) || 0}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Plans</div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">
            {users?.filter((u: any) => (u.plans?.[0]?.count || 0) > 0).length || 0}
          </div>
          <div className="text-sm text-gray-600 mt-1">Active Users</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Plans
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users?.map((user: any) => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.program || 'Not set'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.plans?.[0]?.count || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
