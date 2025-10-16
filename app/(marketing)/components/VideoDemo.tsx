export default function VideoDemo() {
  return (
    <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">See It In Action</h2>
          <p className="text-xl text-gray-300">
            Watch how easy it is to create campaigns and capture leads
          </p>
        </div>

        {/* Video placeholder */}
        <div className="relative bg-slate-700/50 border-2 border-cyan-400/40 rounded-lg overflow-hidden aspect-video shadow-xl">
          {/* Placeholder content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <div className="text-cyan-400 text-6xl mb-6">▶️</div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Product Demo Video
            </h3>
            <p className="text-gray-300 text-center max-w-md mb-6">
              Full walkthrough coming soon: Creating campaigns, uploading photos, generating QR codes, and viewing your custom landing pages
            </p>
            <div className="text-sm text-gray-400 bg-slate-800/80 px-4 py-2 rounded-full">
              Video placeholder - Ready for your recording
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-4 left-4 w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="absolute top-4 left-10 w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="absolute top-4 left-16 w-3 h-3 bg-green-500 rounded-full"></div>
        </div>

        {/* Quick feature highlights below video */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="text-cyan-400 text-3xl mb-2">⚡</div>
            <h4 className="font-semibold mb-1">Quick Setup</h4>
            <p className="text-gray-300 text-sm">Create a campaign in under 5 minutes</p>
          </div>
          <div className="text-center">
            <div className="text-cyan-400 text-3xl mb-2">📱</div>
            <h4 className="font-semibold mb-1">Instant QR Codes</h4>
            <p className="text-gray-300 text-sm">Automatically generated for each campaign</p>
          </div>
          <div className="text-center">
            <div className="text-cyan-400 text-3xl mb-2">📊</div>
            <h4 className="font-semibold mb-1">Track Everything</h4>
            <p className="text-gray-300 text-sm">Monitor leads and engagement in real-time</p>
          </div>
        </div>

        {/* Instructions for replacing placeholder */}
        <div className="mt-8 p-4 bg-slate-800/50 border border-slate-600 rounded-lg">
          <p className="text-xs text-gray-400 text-center">
            <strong className="text-gray-300">To add your video:</strong> Replace the placeholder content above with an iframe embed (YouTube, Loom, Vimeo, etc.)
          </p>
        </div>
      </div>
    </section>
  );
}
