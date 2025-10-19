'use client';

import { useRequireAuth } from '@/lib/use-require-auth';
import CampaignForm from '@/components/CampaignForm';
import Link from 'next/link';

export default function CreateCampaignPage() {
  const { loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d1117]">
      {/* Header */}
      <header className="border-b border-[#373e47]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            Halo <span className="text-cyan-400">Lead Gen</span>
          </h1>
          <Link
            href="/dashboard"
            className="text-gray-300 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Create New <span className="text-cyan-400">Campaign</span>
          </h2>
          <p className="text-xl text-gray-200 mb-2">
            Set up a campaign to capture roofing leads from your showcase property
          </p>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Upload photos of the completed or pending job and we'll generate a custom QR code you can distribute in the neighborhood.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <CampaignForm />
        </div>
      </section>
    </main>
  );
}
