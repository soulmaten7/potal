import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learn | POTAL',
  description: 'POTAL learning resources: video tutorials, getting started guide, API reference, and certification program.',
};

const videos = [
  { title: 'Getting Started with POTAL API', duration: '5:30', description: 'Set up your API key and make your first landed cost calculation.' },
  { title: 'HS Code Classification', duration: '8:15', description: 'Learn how POTAL classifies products using AI and vector search.' },
  { title: 'Reading Your Landed Cost', duration: '4:45', description: 'Understand the 15-item cost breakdown in API responses.' },
  { title: 'Setting Up Webhooks', duration: '6:20', description: 'Configure webhooks for real-time calculation events.' },
  { title: 'Widget Installation', duration: '3:50', description: 'Add the POTAL widget to your Shopify, WooCommerce, or BigCommerce store.' },
];

const guides = [
  { title: 'Quick Start Guide', href: '/developers/quickstart', description: 'Get up and running in under 5 minutes.' },
  { title: 'API Reference', href: '/developers/docs', description: 'Complete API documentation with examples.' },
  { title: 'SDK Documentation', href: '/developers', description: 'Python and JavaScript SDK guides.' },
  { title: 'Knowledge Base', href: '/faq', description: '50+ answers to common questions.' },
];

export default function LearnPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Learn POTAL</h1>
      <p className="text-gray-600 mb-10">Master cross-border trade compliance with our tutorials, guides, and resources.</p>

      {/* Getting Started */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Getting Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guides.map((g, i) => (
            <a key={i} href={g.href} className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow block">
              <h3 className="font-semibold text-gray-900 mb-1">{g.title}</h3>
              <p className="text-sm text-gray-500">{g.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Video Tutorials */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Video Tutorials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v, i) => (
            <div key={i} className="border rounded-lg overflow-hidden bg-white">
              <div className="bg-gray-100 h-40 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  <span className="text-xs text-gray-500">{v.duration}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{v.title}</h3>
                <p className="text-xs text-gray-500">{v.description}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-400 mt-4">Video content coming soon. Subscribe to our newsletter for updates.</p>
      </section>

      {/* Certification */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">POTAL Certified Trade Compliance Professional</h2>
        <p className="text-blue-100 mb-4">
          Demonstrate your expertise in cross-border trade compliance. Coming soon.
        </p>
        <a href="/certification" className="inline-block bg-white text-blue-700 px-6 py-2 rounded-lg font-medium hover:bg-blue-50">
          Join Waitlist
        </a>
      </section>
    </div>
  );
}
