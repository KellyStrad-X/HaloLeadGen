'use client';

import type { CrewMember } from '@/lib/firestore-admin';

interface MeetTheCrewProps {
  members: CrewMember[];
  tagline?: string;
}

const DEFAULT_BIO = "Dedicated to providing exceptional roofing services with integrity and professionalism. Your home is in expert hands.";

export default function MeetTheCrew({ members, tagline }: MeetTheCrewProps) {
  if (!members || members.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
          Meet Your Roofing Experts
        </h2>
        {tagline && (
          <p className="text-gray-600 text-center mb-10">
            {tagline}
          </p>
        )}

        {/* Grid: 2 columns on desktop if 2 members, stacked on mobile */}
        <div className={`grid gap-6 ${members.length === 2 ? 'md:grid-cols-2' : ''}`}>
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
            >
              {/* DESKTOP LAYOUT: Photo | Info | Bio (side by side) */}
              <div className="hidden md:flex md:items-start md:gap-6">
                {/* Photo - Left */}
                {member.photoUrl && (
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 flex-shrink-0 shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}

                {/* Info - Middle (compact) */}
                <div className="flex-shrink-0 w-48">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-sm text-cyan-600 font-semibold mb-2">{member.title}</p>

                  {/* Phone */}
                  {member.phone && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">{member.phone}</span>
                    </p>
                  )}

                  {/* Experience & Certifications */}
                  {member.yearsExperience && (
                    <p className="text-xs text-gray-600 mb-2">
                      <span className="font-semibold">{member.yearsExperience}</span> experience
                    </p>
                  )}

                  {member.certifications && member.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {member.certifications.map((cert, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full font-medium"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bio - Right (flexible, takes remaining space) */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {member.bio || DEFAULT_BIO}
                  </p>
                </div>
              </div>

              {/* MOBILE LAYOUT: Photo top-left, info underneath/beside, bio below */}
              <div className="md:hidden">
                <div className="flex items-start gap-3 mb-3">
                  {/* Photo - Top Left (smaller) */}
                  {member.photoUrl && (
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="w-20 h-20 rounded-full object-cover border-3 border-gray-200 flex-shrink-0 shadow-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}

                  {/* Info - Right of photo */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-0.5 leading-tight">{member.name}</h3>
                    <p className="text-sm text-cyan-600 font-semibold mb-1.5">{member.title}</p>

                    {/* Phone with tap to call (mobile only) */}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="inline-flex items-center gap-1.5 text-gray-700 hover:text-cyan-600 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="font-medium">{member.phone}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Bio - Full width below */}
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  {member.bio || DEFAULT_BIO}
                </p>

                {/* Experience and Certs - Bottom */}
                <div className="space-y-2">
                  {member.yearsExperience && (
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">{member.yearsExperience}</span> experience
                    </p>
                  )}

                  {member.certifications && member.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {member.certifications.map((cert, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full font-medium"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
