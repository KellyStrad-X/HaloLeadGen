export default function ProductShowcase() {
  return (
    <section className="bg-gray-50 text-gray-900 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Your Command Center</h2>
          <p className="text-xl text-gray-600">
            Track campaigns, leads, and engagement - all in one place
          </p>
        </div>

        {/* Dashboard Preview Placeholder */}
        <div className="bg-white border-2 border-cyan-500/30 rounded-lg p-12 mb-12 shadow-xl">
          <div className="max-w-3xl mx-auto">
            {/* Mock Header */}
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg mr-4"></div>
              <div className="text-2xl font-bold">Halo Dashboard</div>
            </div>

            {/* Mock Table Rows */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-4 border-b border-gray-200 pb-3">
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-cyan-200 rounded"></div>
              </div>
              <div className="flex items-center gap-4 border-b border-gray-200 pb-3">
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-cyan-200 rounded"></div>
              </div>
              <div className="flex items-center gap-4 border-b border-gray-200 pb-3">
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-cyan-200 rounded"></div>
              </div>
            </div>

            {/* Description */}
            <div className="text-center pt-4">
              <p className="text-cyan-600 font-semibold mb-2">Dashboard Preview</p>
              <p className="text-gray-600 text-sm">
                Track all your campaigns with lead counts, status indicators, and engagement metrics
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="p-6">
            <div className="text-cyan-600 text-2xl mb-2">🔒</div>
            <h4 className="font-semibold mb-2">Secure authentication</h4>
            <p className="text-gray-600 text-sm">Your data is protected with industry-standard security</p>
          </div>
          <div className="p-6">
            <div className="text-cyan-600 text-2xl mb-2">📊</div>
            <h4 className="font-semibold mb-2">Your data stays yours</h4>
            <p className="text-gray-600 text-sm">Export your leads anytime, no lock-in</p>
          </div>
          <div className="p-6">
            <div className="text-cyan-600 text-2xl mb-2">✓</div>
            <h4 className="font-semibold mb-2">No long-term contracts</h4>
            <p className="text-gray-600 text-sm">Flexible plans that grow with your business</p>
          </div>
        </div>
      </div>
    </section>
  );
}
