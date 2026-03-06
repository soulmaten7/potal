import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts } from './posts';

export const metadata: Metadata = {
  title: 'POTAL Blog - Cross-Border Commerce Guides for Sellers',
  description: 'Learn about total landed cost, HS Code classification, import duties, and strategies for selling internationally. Expert guides for e-commerce sellers.',
  keywords: [
    'total landed cost',
    'HS code classification',
    'import duties guide',
    'cross-border commerce',
    'e-commerce seller guide',
    'international trade',
  ],
  openGraph: {
    type: 'website',
    url: 'https://potal.app/blog',
    title: 'POTAL Blog - Cross-Border Commerce Guides for Sellers',
    description: 'Expert guides on total landed cost, HS Code classification, and international trade strategies for e-commerce sellers.',
    siteName: 'POTAL',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'POTAL Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POTAL Blog - Cross-Border Commerce Guides for Sellers',
    description: 'Expert guides on total landed cost, HS Code classification, and international trade strategies for e-commerce sellers.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://potal.app/blog',
  },
};

export default function BlogPage() {
  const sortedPosts = [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div style={{ backgroundColor: '#ffffff' }} className="w-full min-h-screen pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'POTAL Blog',
            url: 'https://potal.app/blog',
            description:
              'Cross-border commerce guides, HS Code classification tips, and total landed cost strategies for e-commerce sellers.',
            publisher: {
              '@type': 'Organization',
              name: 'POTAL',
              url: 'https://potal.app',
              logo: {
                '@type': 'ImageObject',
                url: 'https://potal.app/og-image.png',
                width: 1200,
                height: 630,
              },
            },
          }),
        }}
      />

      <div className="max-w-[1440px] mx-auto px-3 sm:px-6">
      {/* Hero Section */}
      <div style={{ padding: '80px 0 48px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            marginBottom: '16px',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '9999px',
            background: 'rgba(245,158,11,0.1)',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#F59E0B',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
            }}
          >
            Blog
          </span>
        </div>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#02122c',
            marginBottom: '16px',
            lineHeight: '1.2',
          }}
        >
          Cross-Border Commerce<br />Made Simple
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: '#64748b',
            lineHeight: '1.7',
            maxWidth: '480px',
            margin: '0 auto',
          }}
        >
          Expert guides on total landed cost, HS Code classification, import duties, and strategies for selling internationally.
        </p>
      </div>

      {/* Featured Post */}
      {sortedPosts.length > 0 && (
        <div style={{ padding: '0 40px' }}>
          <Link href={`/blog/${sortedPosts[0].slug}`} style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: '16px',
                padding: '28px',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  background: 'rgba(245,158,11,0.15)',
                  borderRadius: '6px',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#F59E0B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Latest
                </span>
              </div>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#02122c',
                  marginBottom: '12px',
                  lineHeight: '1.3',
                }}
              >
                {sortedPosts[0].title}
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: '#64748b',
                  lineHeight: '1.6',
                  marginBottom: '16px',
                }}
              >
                {sortedPosts[0].description}
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  fontSize: '13px',
                  color: '#94a3b8',
                }}
              >
                <span>{sortedPosts[0].date}</span>
                <span>&bull;</span>
                <span>{sortedPosts[0].readingTime} min read</span>
                <span>&bull;</span>
                <span>{sortedPosts[0].category}</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Blog Posts Grid */}
      <div style={{ padding: '0' }}>
        <h2
          style={{
            fontWeight: 700,
            marginBottom: '16px',
            marginTop: sortedPosts.length > 0 ? '32px' : '0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '13px',
            color: '#94a3b8',
          } as React.CSSProperties}
        >
          All Articles
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          {sortedPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '20px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: '6px',
                    marginBottom: '10px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#F59E0B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {post.category}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#02122c',
                    marginBottom: '10px',
                    lineHeight: '1.4',
                  }}
                >
                  {post.title}
                </h3>

                <p
                  style={{
                    fontSize: '14px',
                    color: '#64748b',
                    lineHeight: '1.6',
                    marginBottom: '12px',
                  }}
                >
                  {post.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    fontSize: '12px',
                    color: '#94a3b8',
                    alignItems: 'center',
                  }}
                >
                  <span>{post.date}</span>
                  <span>&bull;</span>
                  <span>{post.readingTime} min read</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ padding: '40px 20px', marginTop: '40px' }}>
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#02122c',
              marginBottom: '12px',
            }}
          >
            Ready to show true landed costs?
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#94a3b8',
              marginBottom: '20px',
              lineHeight: '1.6',
            }}
          >
            Use POTAL to calculate duties, taxes, and fees for 181 countries. Embed our widget or integrate via REST API — free plan available.
          </p>
          <a
            href="/developers"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: '#F59E0B',
              color: '#02122c',
              fontSize: '15px',
              fontWeight: 700,
              borderRadius: '10px',
              textDecoration: 'none',
            }}
          >
            Get Started Free
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}
