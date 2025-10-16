'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    const trimmedName = name.trim();
    const trimmedCompany = company.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedName) {
      setError('Full name is required');
      return;
    }

    if (!trimmedCompany) {
      setError('Company is required');
      return;
    }

    if (!trimmedPhone) {
      setError('Phone number is required');
      return;
    }

    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('Phone number must include at least 10 digits');
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = trimmedEmail.toLowerCase();
      const userCredential = await signUp(normalizedEmail, trimmedPassword, trimmedName);

      const userId = userCredential.user?.uid;
      if (!userId) {
        throw new Error('Failed to create account. Please try again.');
      }

      await setDoc(doc(db, 'contractors', userId), {
        name: trimmedName,
        company: trimmedCompany,
        email: normalizedEmail,
        phone: trimmedPhone,
        license: license.trim() ? license.trim() : null,
        createdAt: Timestamp.now(),
      });

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Halo Lead Gen
          </h1>
          <p className="text-gray-300">Create your contractor account</p>
        </div>

        {/* Signup Form */}
        <div className="bg-slate-800/80 rounded-lg shadow-xl p-8 border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-400 text-red-300 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                placeholder="John Smith"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
                Company <span className="text-red-400">*</span>
              </label>
              <input
                id="company"
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                placeholder="Halo Roofing"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                placeholder="(555) 123-4567"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                placeholder="contractor@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="license" className="block text-sm font-medium text-gray-300 mb-2">
                Contractor License # (Optional)
              </label>
              <input
                id="license"
                type="text"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                placeholder="e.g., TX-12345"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-400">
                Helps build trust with homeowners (recommended)
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-300">
          Already have an account?{' '}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
