import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-700">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Left Column */}
          <div>
            <Image
              src="/halo-logo.png"
              alt="Halo Lead Gen"
              width={150}
              height={50}
              className="mb-4"
            />
            <p className="text-gray-300 mb-4">
              Turn every finished roof into neighborhood marketing campaigns
            </p>
            <p className="text-sm text-gray-400">
              © 2025 Halo Lead Generation. All rights reserved.
            </p>
          </div>

          {/* Right Column */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <p className="text-gray-300 mb-2">
              <a
                href="mailto:kelly@haloleadgen.com"
                className="hover:text-cyan-400 transition-colors"
              >
                kelly@haloleadgen.com
              </a>
            </p>
            <p className="text-sm text-gray-400 mt-6">
              We respect your inbox. No spam, ever.
            </p>
          </div>
        </div>

        {/* Bottom Links */}
        <div className="border-t border-slate-700 pt-8 text-center">
          <p className="text-sm text-gray-400">
            <a href="#" className="hover:text-cyan-400 transition-colors">
              Privacy Policy
            </a>
            {' • '}
            <a href="#" className="hover:text-cyan-400 transition-colors">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
