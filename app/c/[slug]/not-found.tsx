import Link from 'next/link';

export default function CampaignNotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="text-halo-ice text-6xl mb-4">🔍</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Campaign Not Found
          </h1>
          <p className="text-halo-light mb-6">
            This campaign doesn't exist or is no longer active.
          </p>
        </div>

        <div className="bg-halo-dark border border-halo-medium/30 rounded-lg p-6 mb-6">
          <h2 className="text-white font-semibold mb-2">Possible reasons:</h2>
          <ul className="text-halo-medium text-sm space-y-1 text-left">
            <li>• The QR code link may be incorrect</li>
            <li>• The campaign may have ended</li>
            <li>• The URL may have been mistyped</li>
          </ul>
        </div>

        <Link
          href="/"
          className="inline-block bg-halo-ice hover:bg-halo-ice/90 text-black font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
