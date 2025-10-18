'use client';

import Image from 'next/image';
import MarketingHero from './components/MarketingHero';
import HowItWorks from './components/HowItWorks';
import VideoDemo from './components/VideoDemo';
import ProductShowcase from './components/ProductShowcase';
import Footer from './components/Footer';

export default function LandingPage() {
  const handleFormSubmit = async (data: {
    name: string;
    email: string;
    phone?: string;
  }) => {
    const response = await fetch('/api/marketing-leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        source: 'hero-cta',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit form');
    }

    return response.json();
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 60; // Height of sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <main className="min-h-screen">
      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Image
                src="/halo-logo.png"
                alt="Halo Lead Gen"
                width={140}
                height={47}
                className="cursor-pointer"
                style={{ width: '140px', height: 'auto' }}
              />
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-gray-300 hover:text-cyan-400 transition-colors font-medium"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('demo-video')}
                className="text-gray-300 hover:text-cyan-400 transition-colors font-medium"
              >
                Demo Video
              </button>
              <button
                onClick={() => scrollToSection('dashboard-preview')}
                className="text-gray-300 hover:text-cyan-400 transition-colors font-medium"
              >
                Dashboard Preview
              </button>
            </nav>
          </div>
        </div>
      </header>

      <MarketingHero onSubmit={handleFormSubmit} />
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <div id="demo-video">
        <VideoDemo />
      </div>
      <div id="dashboard-preview">
        <ProductShowcase />
      </div>
      <Footer />
    </main>
  );
}
