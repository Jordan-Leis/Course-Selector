import { requireAdmin } from '@/lib/admin/auth'
import { getAuditLog } from '@/lib/admin/audit'

export default async function AuditLogPage() {
  await requireAdmin()
  
  const { entries, total } = await getAuditLog(100, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600 mt-1">Complete history of admin actions ({total} entries)</p>
      </div>

      {/* Audit Log */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      entry.action_type === 'insert' ? 'bg-green-100 text-green-800' :
                      entry.action_type === 'update' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {entry.action_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entry.table_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{entry.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {new Date(entry.created_at).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <p className="text-gray-500">No audit log entries yet</p>
        </div>
      )}
    </div>
  )
}
