import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin/auth'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is admin
  const admin = await isAdmin()
  
  if (!admin) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Admin Navigation */}
      <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                    Admin Panel
                  </h1>
                </div>
              </Link>
              
              <div className="hidden md:flex items-center gap-1">
                <NavLink href="/admin" label="Dashboard" />
                <NavLink href="/admin/programs" label="Programs" />
                <NavLink href="/admin/courses" label="Courses" />
                <NavLink href="/admin/users" label="Users" />
                <NavLink href="/admin/validation" label="Validation" />
                <NavLink href="/admin/audit" label="Audit Log" />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium hover:bg-gray-100 rounded-lg transition-all"
              >
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
    >
      {label}
    </Link>
  )
}
