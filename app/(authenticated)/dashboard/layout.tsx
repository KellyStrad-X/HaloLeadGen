'use client';

import { useRequireAuth } from '@/lib/use-require-auth';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, createContext, useContext } from 'react';
import SettingsModal from '@/components/SettingsModal';

type DashboardTab = 'overview' | 'analytics' | 'campaigns' | 'leads';

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
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#24292e] flex items-center justify-center">
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
      <div className="min-h-screen bg-[#24292e]">
        {/* Header */}
        <header className="bg-[#1e2227] border-b border-[#373e47]">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo & Navigation */}
              <div className="flex items-center gap-8">
                <Link href="/dashboard" className="flex items-center">
                  <img
                    src="/halo-logo.png"
                    alt="Halo Lead Gen"
                    className="h-14 w-auto"
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
                          : 'text-gray-300 hover:bg-[#2d333b] hover:text-white'
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                        activeTab === 'analytics'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-gray-300 hover:bg-[#2d333b] hover:text-white'
                      }`}
                    >
                      Analytics
                    </button>
                    <button
                      onClick={() => setActiveTab('campaigns')}
                      className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                        activeTab === 'campaigns'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-gray-300 hover:bg-[#2d333b] hover:text-white'
                      }`}
                    >
                      Campaigns
                    </button>
                    <button
                      onClick={() => setActiveTab('leads')}
                      className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                        activeTab === 'leads'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-gray-300 hover:bg-[#2d333b] hover:text-white'
                      }`}
                    >
                      Leads
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
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-black px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden lg:inline">New Campaign</span>
                  </Link>
                </>
              )}

              <span className="text-gray-200 text-sm hidden sm:block">
                {user?.displayName || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-[#2d333b] hover:bg-[#373e47] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
              {showTabs && (
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="hidden sm:flex items-center justify-center border border-[#373e47] hover:bg-[#2d333b] text-gray-200 p-2 rounded-lg transition-colors"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showTabs && (
          <div className="md:hidden border-t border-[#373e47]">
            <nav className="px-4 py-3 space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-[#2d333b] text-cyan-400'
                    : 'text-gray-200 hover:bg-[#2d333b] hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full text-left block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-[#2d333b] text-cyan-400'
                    : 'text-gray-200 hover:bg-[#2d333b] hover:text-white'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`w-full text-left block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'campaigns'
                    ? 'bg-[#2d333b] text-cyan-400'
                    : 'text-gray-200 hover:bg-[#2d333b] hover:text-white'
                }`}
              >
                Campaigns
              </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`w-full text-left block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'leads'
                    ? 'bg-[#2d333b] text-cyan-400'
                    : 'text-gray-200 hover:bg-[#2d333b] hover:text-white'
                }`}
              >
                Leads
              </button>
              <Link
                href="/create-campaign"
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-[#2d333b] hover:text-white transition-colors"
              >
                Create Campaign
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1e2227] text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-[#373e47] mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Left Column */}
            <div>
              <img
                src="/halo-logo.png"
                alt="Halo Lead Gen"
                className="h-12 w-auto mb-4"
              />
              <p className="text-gray-300 mb-4">
                Turn every finished roof into neighborhood marketing campaigns
              </p>
              <p className="text-sm text-gray-400">
                © 2025 Halo Lead Generation. All rights reserved.
              </p>
            </div>

            {/* Right Column */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-300 mb-2">
                <a
                  href="mailto:kelly@haloleadgen.com"
                  className="hover:text-cyan-400 transition-colors"
                >
                  kelly@haloleadgen.com
                </a>
              </p>
              <p className="text-sm text-gray-400 mt-6">
                Questions or feedback? We'd love to hear from you.
              </p>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="border-t border-[#373e47] pt-8 text-center">
            <p className="text-sm text-gray-400">
              <a href="#" className="hover:text-cyan-400 transition-colors">
                Privacy Policy
              </a>
              {' • '}
              <a href="#" className="hover:text-cyan-400 transition-colors">
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
    </DashboardContext.Provider>
  );
}
