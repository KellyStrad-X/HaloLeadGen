export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Upload job photos',
      description: 'Document the damage you found and the work you completed',
    },
    {
      number: '2',
      title: 'Get your QR code',
      description: 'Halo generates a landing page and printable QR placard',
    },
    {
      number: '3',
      title: 'Track leads',
      description: 'Secure dashboard shows engagement and new homeowner inquiries',
    },
  ];

  return (
    <section className="bg-slate-800 text-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-gray-300">
            Turn your completed jobs into neighborhood marketing campaigns in minutes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-slate-700/50 border border-slate-600 rounded-lg p-8 text-center hover:border-cyan-400 hover:shadow-lg transition-all"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-400 text-black text-2xl font-bold rounded-full mb-6 shadow-lg">
                {step.number}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-gray-300">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
