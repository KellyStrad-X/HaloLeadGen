'use client';

import { useRequireAuth } from '@/lib/use-require-auth';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, createContext, useContext } from 'react';

type DashboardTab = 'overview' | 'analytics' | 'campaigns';

interface DashboardContextType {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboardTab() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardTab must be used within DashboardLayout');
  }
  return context;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useRequireAuth();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

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

  // Only show tabs on dashboard page (not on create-campaign or campaign details)
  const showTabs = pathname === '/dashboard';

  return (
    <DashboardContext.Provider value={{ activeTab, setActiveTab }}>
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

                {/* Tab Navigation - Only show on dashboard */}
                {showTabs && (
                  <nav className="hidden md:flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                        activeTab === 'overview'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                        activeTab === 'analytics'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      Analytics
                    </button>
                    <button
                      onClick={() => setActiveTab('campaigns')}
                      className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                        activeTab === 'campaigns'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      All Campaigns
                    </button>
                  </nav>
                )}
              </div>

            {/* Quick Actions & User Menu */}
            <div className="flex items-center space-x-3">
              {/* Quick Actions - Only show on dashboard */}
              {showTabs && (
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
        {showTabs && (
          <div className="md:hidden border-t border-slate-700">
            <nav className="px-4 py-3 space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-slate-700 text-cyan-400'
                    : 'text-gray-200 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full text-left block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-slate-700 text-cyan-400'
                    : 'text-gray-200 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`w-full text-left block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'campaigns'
                    ? 'bg-slate-700 text-cyan-400'
                    : 'text-gray-200 hover:bg-slate-700 hover:text-white'
                }`}
              >
                All Campaigns
              </button>
              <Link
                href="/create-campaign"
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Create Campaign
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
    </DashboardContext.Provider>
  );
}
