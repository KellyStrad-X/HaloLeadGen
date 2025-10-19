'use client';

import type { CrewMember } from '@/lib/firestore-admin';

interface MeetTheCrewProps {
  members: CrewMember[];
  tagline?: string;
  companyLogo?: string;
}

export default function MeetTheCrew({ members, tagline, companyLogo }: MeetTheCrewProps) {
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
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
            >
              {/* Horizontal Business Card Layout - Always horizontal */}
              <div className="flex items-start gap-4">
                {/* Photo - Left Side */}
                {member.photoUrl && (
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-gray-200 flex-shrink-0 shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}

                {/* Info - Middle */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-base text-cyan-600 font-semibold mb-3">{member.title}</p>

                  {/* Contact Info */}
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="inline-flex items-center gap-2 text-gray-700 hover:text-cyan-600 transition-colors mb-3 md:pointer-events-none md:cursor-default"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-medium">{member.phone}</span>
                      <span className="md:hidden text-xs text-gray-500">(tap to call)</span>
                    </a>
                  )}

                  {/* Experience */}
                  {member.yearsExperience && (
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-semibold">{member.yearsExperience}</span> experience
                    </p>
                  )}

                  {/* Certifications */}
                  {member.certifications && member.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {member.certifications.map((cert, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full font-medium"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Company Logo - Right Side (Desktop only) */}
                {companyLogo && (
                  <img
                    src={companyLogo}
                    alt="Company logo"
                    className="hidden md:block w-24 h-24 lg:w-28 lg:h-28 rounded-full object-cover border-4 border-gray-200 flex-shrink-0 shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
