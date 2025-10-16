'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface HeroProps {
  onSubmit: (data: { name: string; email: string; phone?: string }) => Promise<void>;
}

// Slideshow images - just add/remove/replace files in public/hero-slideshow/
const SLIDESHOW_IMAGES = [
  '/hero-slideshow/1.jpg',
  '/hero-slideshow/2.jpg',
  '/hero-slideshow/3.jpg',
  '/hero-slideshow/4.jpg',
  '/hero-slideshow/5.jpg',
];

export default function Hero({ onSubmit }: HeroProps) {
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

  if (success) {
    return (
      <section className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-cyan-400/20 border-2 border-cyan-400 rounded-lg px-6 py-8 shadow-lg">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-3xl font-bold text-cyan-400 mb-4">
              Thanks for your interest!
            </h2>
            <p className="text-gray-200 mb-6">
              We'll be in touch soon with early access details.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Submit another request
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Logo watermark - top left */}
      <div className="absolute top-6 left-6 z-20 opacity-80 hover:opacity-100 transition-opacity">
        <Image
          src="/halo-logo.png"
          alt="Halo Lead Gen"
          width={120}
          height={40}
          className="drop-shadow-lg"
        />
      </div>

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
              priority={index === 0}
              sizes="100vw"
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ))}
        {/* Lighter overlay for text readability - reduced from 70-90% to 50-65% */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/65 via-slate-900/55 to-slate-900/70" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Hero Content */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            Turn every finished roof into{' '}
            <span className="text-cyan-400">the next five jobs</span>
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Proof-first marketing via QR codes + localized landing pages that showcase
            your work to nearby homeowners.
          </p>
        </div>

        {/* CTA Form */}
        <div className="max-w-md mx-auto">
          <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-center mb-6">
              Get Early Access
            </h3>

            {error && (
              <div className="bg-red-500/20 border border-red-400 text-red-300 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-200 mb-2">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="(555) 123-4567"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-400 hover:bg-cyan-500 text-black font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Get Early Access'}
              </button>
            </form>
          </div>

          {/* Secondary CTA - Demo Link */}
          <div className="mt-6 text-center">
            <a
              href="/campaign/oprzMrbNiDP5NNw8YQXS"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium underline transition-colors"
            >
              View Live Demo Campaign →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
