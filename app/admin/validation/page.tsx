import { requireAdmin } from '@/lib/admin/auth'
import { validateEntirePlan } from '@/lib/validation-engine'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ValidationPage() {
  await requireAdmin()
  
  const supabase = await createClient()
  
  // Get all plans
  const { data: plans } = await supabase
    .from('plans')
    .select('*, user:profiles(email)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Plan Validation</h1>
        <p className="text-gray-600 mt-1">Test and validate student plans</p>
      </div>

      {/* Validation Tools */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Validation Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all text-left">
            <h3 className="font-semibold text-gray-900 mb-1">Test Single Plan</h3>
            <p className="text-sm text-gray-600">Validate a specific plan</p>
          </button>
          <button className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-all text-left">
            <h3 className="font-semibold text-gray-900 mb-1">Batch Validate</h3>
            <p className="text-sm text-gray-600">Test all plans at once</p>
          </button>
          <button className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:from-purple-100 hover:to-pink-100 transition-all text-left">
            <h3 className="font-semibold text-gray-900 mb-1">Mock Plan Builder</h3>
            <p className="text-sm text-gray-600">Create test plan</p>
          </button>
        </div>
      </div>

      {/* Recent Plans */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Plans</h2>
        {plans && plans.length > 0 ? (
          <div className="space-y-3">
            {plans.map((plan: any) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600">
                    {plan.user?.email || 'Unknown user'} • Created {new Date(plan.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/plan/${plan.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
                >
                  View Plan
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No plans found</p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> The validation engine checks for prerequisite violations, 
          antirequisite conflicts, duplicate courses, and term overload warnings. All validation 
          rules are automatically applied when students add courses to their plans.
        </p>
      </div>
    </div>
  )
}
