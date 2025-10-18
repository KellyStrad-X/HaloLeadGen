interface TrustBadgesProps {
  badges: string[];
}

export default function TrustBadges({ badges }: TrustBadgesProps) {
  if (!badges || badges.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-gray-50 border-y border-gray-200">
      <div className="max-w-4xl mx-auto px-4">
        <h3 className="text-center text-sm font-semibold text-gray-600 mb-6 tracking-wide">
          TRUSTED & CERTIFIED
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-8">
          {badges.map((badgeId) => (
            <div key={badgeId} className="h-16 w-24 flex-shrink-0">
              <img
                src={`/trust-badges/${badgeId}.png`}
                alt={badgeId.replace(/-/g, ' ')}
                className="h-full w-full object-contain opacity-80 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                onError={(e) => {
                  // Hide badge if image doesn't exist
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
