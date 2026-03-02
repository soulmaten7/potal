import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts } from './posts';

export const metadata: Metadata = {
  title: 'POTAL Blog - Smart Shopping Tips & Price Comparison Guides',
  description: 'Learn how to save money on online shopping. Discover price comparison strategies, cross-border shopping guides, and tips for finding the best deals across Amazon, Walmart, eBay, and AliExpress.',
  keywords: [
    'price comparison blog',
    'shopping guides',
    'cross-border shopping',
    'import duties',
    'online shopping tips',
    'best price comparison',
  ],
  openGraph: {
    type: 'website',
    url: 'https://potal.app/blog',
    title: 'POTAL Blog - Smart Shopping Tips & Price Comparison Guides',
    description: 'Learn how to save money on online shopping with expert guides on price comparison, cross-border purchases, and international shipping costs.',
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
    title: 'POTAL Blog - Smart Shopping Tips & Price Comparison Guides',
    description: 'Learn how to save money on online shopping with expert guides on price comparison, cross-border purchases, and international shipping costs.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://potal.app/blog',
  },
};

export default function BlogPage() {
  // Sort posts by date (newest first)
  const sortedPosts = [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div style={{ backgroundColor: '#02122c' }} className="w-full min-h-screen pb-28">
      {/* JSON-LD Schema for Blog Collection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'POTAL Blog',
            url: 'https://potal.app/blog',
            description:
              'Price comparison guides, shopping tips, and cross-border shopping strategies for smart shoppers.',
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

      {/* Hero Section */}
      <div style={{ padding: '80px 24px 48px', textAlign: 'center' }}>
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
            color: '#ffffff',
            marginBottom: '16px',
            lineHeight: '1.2',
          }}
        >
          Smart Shopping<br />Made Simple
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: '1.7',
            maxWidth: '480px',
            margin: '0 auto',
          }}
        >
          Expert guides on price comparison, cross-border shopping, import duties, and finding the real cheapest deals.
        </p>
      </div>

      {/* Featured Post */}
      {sortedPosts.length > 0 && (
        <div style={{ padding: '0 20px 40px' }}>
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
                  color: '#ffffff',
                  marginBottom: '12px',
                  lineHeight: '1.3',
                }}
              >
                {sortedPosts[0].title}
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: 'rgba(255,255,255,0.6)',
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
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                <span>{sortedPosts[0].date}</span>
                <span>•</span>
                <span>{sortedPosts[0].readingTime} min read</span>
                <span>•</span>
                <span>{sortedPosts[0].category}</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Blog Posts Grid */}
      <div style={{ padding: '0 20px' }}>
        <h2
          style={{
            fontWeight: 700,
            marginBottom: '16px',
            marginTop: sortedPosts.length > 0 ? '32px' : '0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.5)',
          } as React.CSSProperties}
        >
          All Articles
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '16px',
          }}
        >
          {sortedPosts.map((post, index) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                  padding: '20px',
                  cursor: 'pointer',
                }}
              >
                {/* Category Badge */}
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

                {/* Title */}
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#ffffff',
                    marginBottom: '10px',
                    lineHeight: '1.4',
                  }}
                >
                  {post.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: '1.6',
                    marginBottom: '12px',
                  }}
                >
                  {post.description}
                </p>

                {/* Meta Info */}
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.4)',
                    alignItems: 'center',
                  }}
                >
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readingTime} min read</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div
        style={{
          padding: '40px 20px',
          marginTop: '40px',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '12px',
            }}
          >
            Ready to find the cheapest deal?
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '20px',
              lineHeight: '1.6',
            }}
          >
            Use POTAL to compare prices across Amazon, Walmart, Best Buy, eBay, and AliExpress. Get the true total cost including taxes, duties, and shipping—all in one search.
          </p>
          <a
            href="/"
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
            Start Comparing Prices
          </a>
        </div>
      </div>
    </div>
  );
}
