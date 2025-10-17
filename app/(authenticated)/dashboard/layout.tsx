'use client';

import { useRequireAuth } from '@/lib/use-require-auth';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useRequireAuth();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      // Explicitly redirect after logout
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Navigation */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center">
                <img
                  src="/halo-logo.png"
                  alt="Halo Lead Gen"
                  className="h-16 w-auto"
                />
              </Link>

              {/* Main Navigation */}
              <nav className="hidden md:flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                    pathname === '/dashboard'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                    pathname === '/dashboard/analytics'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  Analytics
                </Link>
              </nav>
            </div>

            {/* Quick Actions & User Menu */}
            <div className="flex items-center space-x-3">
              {/* Quick Actions - Only show on dashboard pages */}
              {pathname?.startsWith('/dashboard') && (
                <>
                  <Link
                    href="/create-campaign"
                    className="hidden lg:flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-black px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Campaign
                  </Link>
                  <Link
                    href="/dashboard/campaigns"
                    className="hidden lg:flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    All Campaigns
                  </Link>
                </>
              )}

              <span className="text-gray-200 text-sm hidden sm:block">
                {user?.displayName || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-slate-700">
          <nav className="px-4 py-3 space-y-2">
            <Link
              href="/dashboard"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-slate-700 text-cyan-400'
                  : 'text-gray-200 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/analytics"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/dashboard/analytics'
                  ? 'bg-slate-700 text-cyan-400'
                  : 'text-gray-200 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Analytics
            </Link>
            <Link
              href="/create-campaign"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Create Campaign
            </Link>
            <Link
              href="/dashboard/campaigns"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              All Campaigns
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
