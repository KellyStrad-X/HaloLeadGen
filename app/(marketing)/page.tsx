'use client';

import Hero from './components/Hero';
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

  return (
    <main className="min-h-screen">
      <Hero onSubmit={handleFormSubmit} />
      <HowItWorks />
      <VideoDemo />
      <ProductShowcase />
      <Footer />
    </main>
  );
}
