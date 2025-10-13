'use client';

import { useState } from 'react';
import CampaignForm from '@/components/CampaignForm';

export default function CreateCampaignPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-halo-dark-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-white">
            Halo <span className="text-halo-ice">Lead Gen</span>
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-halo-dark to-black py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Create Your <span className="text-halo-ice">Halo Campaign</span>
          </h2>
          <p className="text-xl text-halo-light mb-2">
            Set up a neighborhood-specific page to capture roofing leads
          </p>
          <p className="text-halo-medium max-w-2xl mx-auto">
            Fill out your information and upload photos of local roof damage.
            We'll generate a custom QR code you can distribute in the area.
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
