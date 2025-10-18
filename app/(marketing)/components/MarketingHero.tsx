'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface HeroProps {
  onSubmit: (data: { name: string; email: string; phone?: string }) => Promise<void>;
}

// Slideshow images - just add/remove/replace files in public/hero-slideshow/
const SLIDESHOW_IMAGES = [
  '/hero-slideshow/1.JPG',
  '/hero-slideshow/2.JPG',
  '/hero-slideshow/3.JPG',
  '/hero-slideshow/4.JPG',
  '/hero-slideshow/5.JPG',
];

export default function MarketingHero({ onSubmit }: HeroProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slideshow every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({ name, email, phone: phone || undefined });
      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success state content (rendered within same section structure below)
  const successContent = success ? (
    <div className="max-w-md mx-auto">
      <div className="bg-white/90 backdrop-blur-sm border-2 border-cyan-600 rounded-lg p-8 shadow-xl text-center">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="text-3xl font-bold text-cyan-600 mb-4">
          Thanks for your interest!
        </h2>
        <p className="text-gray-700 mb-6">
          We'll be in touch soon with early access details.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-cyan-600 hover:text-cyan-700 underline font-medium"
        >
          Submit another request
        </button>
      </div>
    </div>
  ) : null;

  return (
    <section className="relative bg-white text-gray-900 py-12 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[600px] sm:min-h-[700px]">
      {/* Background Slideshow */}
      <div className="absolute inset-0 z-0">
        {SLIDESHOW_IMAGES.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image}
              alt={`Roofing project ${index + 1}`}
              fill
              className="object-cover"
              style={{ objectPosition: 'center center' }}
              priority={index === 0}
              sizes="100vw"
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ))}
        {/* Light white overlay for text readability - reduced opacity */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/40 to-white/55" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Hero Content */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
            Turn every finished roof into{' '}
            <span className="text-cyan-600">the next five jobs</span>
          </h1>
          <p className="text-2xl font-bold text-gray-900 mb-8 max-w-2xl mx-auto drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">
            Proof-first marketing via QR codes + localized landing pages that showcase
            your work to nearby homeowners.
          </p>
        </div>

        {/* CTA Form or Success Message */}
        {success ? successContent : (
          <div className="max-w-md mx-auto">
            <div className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900">
                Get Early Access
              </h3>

              {error && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="(555) 123-4567"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Get Early Access'}
              </button>
            </form>
          </div>

          {/* Secondary CTA - Demo Button */}
          <div className="mt-6 text-center">
            <a
              href="/c/demo-campaign"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white/90 hover:bg-white border-2 border-cyan-600 text-cyan-600 font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              View Live Demo Campaign →
            </a>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
