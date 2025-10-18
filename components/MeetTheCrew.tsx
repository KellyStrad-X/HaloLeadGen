import type { CrewMember } from '@/lib/firestore-admin';

interface MeetTheCrewProps {
  members: CrewMember[];
  tagline?: string;
}

export default function MeetTheCrew({ members, tagline }: MeetTheCrewProps) {
  if (!members || members.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
          Meet Your Roofing Experts
        </h2>
        {tagline && (
          <p className="text-gray-600 text-center mb-10">
            {tagline}
          </p>
        )}

        <div className={`grid gap-8 ${members.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : 'md:grid-cols-2'}`}>
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                {member.photoUrl && (
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-blue-600 font-medium mb-2">{member.title}</p>
                  {member.yearsExperience && (
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>{member.yearsExperience}</strong> years experience
                    </p>
                  )}
                  {member.certifications && member.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.certifications.map((cert, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
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
