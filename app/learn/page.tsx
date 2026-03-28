import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learn | POTAL',
  description: 'POTAL learning resources: video tutorials, getting started guide, API reference, and certification program.',
};

const videos = [
  { title: 'Getting Started with POTAL API', duration: '5:30', description: 'Set up your API key and make your first landed cost calculation.', youtubeId: '', thumbnail: '/images/tutorials/getting-started.jpg' },
  { title: 'HS Code Classification', duration: '8:15', description: 'Learn how POTAL classifies products using AI and vector search.', youtubeId: '', thumbnail: '/images/tutorials/hs-classification.jpg' },
  { title: 'Reading Your Landed Cost', duration: '4:45', description: 'Understand the 15-item cost breakdown in API responses.', youtubeId: '', thumbnail: '/images/tutorials/landed-cost.jpg' },
  { title: 'Setting Up Webhooks', duration: '6:20', description: 'Configure webhooks for real-time calculation events.', youtubeId: '', thumbnail: '/images/tutorials/webhooks.jpg' },
  { title: 'Widget Installation', duration: '3:50', description: 'Add the POTAL widget to your Shopify, WooCommerce, or BigCommerce store.', youtubeId: '', thumbnail: '/images/tutorials/widget-install.jpg' },
  { title: 'Multi-Carrier Shipping Rates', duration: '4:20', description: 'Compare DHL, FedEx, UPS and more with landed cost integration.', youtubeId: '', thumbnail: '/images/tutorials/shipping-rates.jpg' },
  { title: 'Customs Documents Generation', duration: '5:10', description: 'Auto-generate commercial invoices, packing lists, and certificates.', youtubeId: '', thumbnail: '/images/tutorials/customs-docs.jpg' },
  { title: 'FTA Optimization', duration: '7:00', description: 'Reduce duty costs by leveraging Free Trade Agreements.', youtubeId: '', thumbnail: '/images/tutorials/fta-optimization.jpg' },
];

// Training modules for F136
const trainingModules = [
  {
    title: 'Fundamentals of Cross-Border Trade',
    lessons: [
      { title: 'What is Total Landed Cost?', duration: '10 min', type: 'article' as const },
      { title: 'HS Code System Explained', duration: '15 min', type: 'video' as const },
      { title: 'Import Duty vs VAT vs GST', duration: '12 min', type: 'article' as const },
      { title: 'Quiz: TLC Basics', type: 'quiz' as const, questions: 10 },
    ],
  },
  {
    title: 'POTAL API Integration',
    lessons: [
      { title: 'API Key Setup & Authentication', duration: '8 min', type: 'video' as const },
      { title: 'Your First API Call', duration: '10 min', type: 'article' as const },
      { title: 'Batch Processing', duration: '12 min', type: 'article' as const },
      { title: 'Webhook Configuration', duration: '15 min', type: 'video' as const },
      { title: 'Quiz: API Integration', type: 'quiz' as const, questions: 8 },
    ],
  },
  {
    title: 'Advanced Compliance',
    lessons: [
      { title: 'Rules of Origin Deep Dive', duration: '20 min', type: 'article' as const },
      { title: 'FTA Utilization Strategies', duration: '18 min', type: 'video' as const },
      { title: 'Trade Remedies (AD/CVD)', duration: '15 min', type: 'article' as const },
      { title: 'Sanctions Screening', duration: '12 min', type: 'article' as const },
      { title: 'Quiz: Advanced Compliance', type: 'quiz' as const, questions: 15 },
    ],
  },
  {
    title: 'Enterprise Integration Patterns',
    lessons: [
      { title: 'Widget Customization', duration: '10 min', type: 'video' as const },
      { title: 'ERP Integration Guide', duration: '20 min', type: 'article' as const },
      { title: 'Multi-Warehouse Optimization', duration: '15 min', type: 'article' as const },
      { title: 'Final Assessment', type: 'quiz' as const, questions: 20 },
    ],
  },
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

      {/* Video Tutorials — YouTube embed ready */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Video Tutorials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v, i) => (
            <div key={i} className="border rounded-lg overflow-hidden bg-white">
              {v.youtubeId ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${v.youtubeId}`}
                    title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="bg-gray-100 h-40 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    <span className="text-xs text-gray-500">{v.duration}</span>
                  </div>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{v.title}</h3>
                <p className="text-xs text-gray-500">{v.description}</p>
                <span className="text-xs text-gray-400 mt-1 block">{v.duration}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-400 mt-4">Video tutorials launching soon. YouTube embeds will appear once published.</p>
      </section>

      {/* Training Program — F136 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Training Program</h2>
        <p className="text-gray-600 mb-6">Structured learning paths from beginner to expert. Complete all modules to earn your POTAL certification.</p>
        <div className="space-y-4">
          {trainingModules.map((module, mi) => (
            <div key={mi} className="border rounded-lg bg-white overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase">Module {mi + 1}</span>
                  <h3 className="font-semibold text-gray-900">{module.title}</h3>
                </div>
                <span className="text-xs text-gray-500">{module.lessons.length} lessons</span>
              </div>
              <div className="divide-y">
                {module.lessons.map((lesson, li) => (
                  <div key={li} className="p-3 px-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${lesson.type === 'quiz' ? 'bg-purple-100 text-purple-700' : lesson.type === 'video' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {lesson.type === 'quiz' ? 'Q' : lesson.type === 'video' ? 'V' : 'A'}
                      </span>
                      <span className="text-sm text-gray-800">{lesson.title}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {lesson.type === 'quiz' ? `${(lesson as { questions: number }).questions} questions` : (lesson as { duration: string }).duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
