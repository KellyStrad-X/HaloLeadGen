'use client';

import { useState } from 'react';
import Image from 'next/image';
import MarketingHero from './components/MarketingHero';
import HowItWorks from './components/HowItWorks';
import VideoDemo from './components/VideoDemo';
import ProductShowcase from './components/ProductShowcase';
import Footer from './components/Footer';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        <div className="max-w-7xl mx-auto pl-1 pr-2 sm:px-4 lg:pl-4 lg:pr-6 py-0.5 md:py-1">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Image
                src="/halo-logo.png"
                alt="Halo Lead Gen"
                width={100}
                height={34}
                className="cursor-pointer"
                style={{ width: '100px', height: 'auto' }}
              />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-medium"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('demo-video')}
                className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-medium"
              >
                Demo Video
              </button>
              <button
                onClick={() => scrollToSection('dashboard-preview')}
                className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-medium"
              >
                Dashboard Preview
              </button>
            </nav>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-cyan-400 p-2"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`md:hidden bg-slate-800 border-t border-slate-700 overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="flex flex-col py-2">
            <button
              onClick={() => {
                scrollToSection('how-it-works');
                setMobileMenuOpen(false);
              }}
              className="text-gray-300 hover:text-cyan-400 hover:bg-slate-700 transition-colors px-4 py-3 text-left font-medium"
            >
              How It Works
            </button>
            <button
              onClick={() => {
                scrollToSection('demo-video');
                setMobileMenuOpen(false);
              }}
              className="text-gray-300 hover:text-cyan-400 hover:bg-slate-700 transition-colors px-4 py-3 text-left font-medium"
            >
              Demo Video
            </button>
            <button
              onClick={() => {
                scrollToSection('dashboard-preview');
                setMobileMenuOpen(false);
              }}
              className="text-gray-300 hover:text-cyan-400 hover:bg-slate-700 transition-colors px-4 py-3 text-left font-medium"
            >
              Dashboard Preview
            </button>
          </nav>
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
