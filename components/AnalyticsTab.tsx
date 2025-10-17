'use client';

export default function AnalyticsTab() {
  return (
    <div className="space-y-6">
      {/* Placeholder Content */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-12 text-center">
        <svg
          className="mx-auto h-24 w-24 text-gray-500 mb-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-white mb-3">
          Analytics Coming Soon
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Track campaign performance, lead engagement metrics, and conversion analytics.
          This feature is currently in development and will be available in a future update.
        </p>

        {/* Preview Feature List */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              <h3 className="text-white font-semibold">Campaign Performance</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Track QR scans, page views, and lead conversion rates per campaign
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              <h3 className="text-white font-semibold">Engagement Metrics</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Monitor time on page, photo views, and CTA click-through rates
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <h3 className="text-white font-semibold">Lead Scoring</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Automatically categorize leads as hot/cold based on engagement behavior
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
