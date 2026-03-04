import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts, getBlogPost, getAllBlogPostSlugs } from '../posts';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

// Generate static params for all blog posts
export async function generateStaticParams() {
  const slugs = getAllBlogPostSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

// Generate metadata for each blog post
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: 'Not Found',
    };
  }

  return {
    title: post.title,
    description: post.description,
    keywords: [post.category, 'price comparison', 'shopping guide', 'POTAL'],
    authors: [{ name: post.author }],
    openGraph: {
      type: 'article',
      url: `https://potal.app/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      siteName: 'POTAL',
      publishedTime: post.date,
      authors: [post.author],
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: `https://potal.app/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  // Get next and previous posts
  const postIndex = blogPosts.findIndex((p) => p.slug === slug);
  const previousPost = postIndex < blogPosts.length - 1 ? blogPosts[postIndex + 1] : null;
  const nextPost = postIndex > 0 ? blogPosts[postIndex - 1] : null;

  const ContentComponent = post.content;

  return (
    <div style={{ backgroundColor: '#ffffff' }} className="w-full min-h-screen pb-28">
      {/* JSON-LD Schema for Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.description,
            image: 'https://potal.app/og-image.png',
            datePublished: post.date,
            dateModified: post.date,
            author: {
              '@type': 'Organization',
              name: post.author,
              url: 'https://potal.app',
            },
            publisher: {
              '@type': 'Organization',
              name: 'POTAL',
              logo: {
                '@type': 'ImageObject',
                url: 'https://potal.app/og-image.png',
                width: 1200,
                height: 630,
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://potal.app/blog/${post.slug}`,
            },
            articleBody: post.title,
          }),
        }}
      />

      <div className="max-w-[1440px] mx-auto px-3 sm:px-6">
      {/* Breadcrumb Navigation */}
      <div style={{ padding: '24px 0' }}>
        <Link
          href="/blog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#F59E0B',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          <span>←</span>
          <span>Back to Blog</span>
        </Link>
      </div>

      {/* Article Header */}
      <div style={{ padding: '0 40px' }}>
        <div>
          {/* Category Badge */}
          <div
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '6px',
              marginBottom: '16px',
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
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#02122c',
              marginBottom: '16px',
              lineHeight: '1.3',
            }}
          >
            {post.title}
          </h1>

          {/* Meta Info */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              fontSize: '13px',
              color: '#94a3b8',
              marginBottom: '24px',
              flexWrap: 'wrap',
            }}
          >
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readingTime} minute read</span>
            <span>•</span>
            <span>By {post.author}</span>
          </div>

          {/* Description/Excerpt */}
          <p
            style={{
              fontSize: '16px',
              color: '#334155',
              lineHeight: '1.7',
              maxWidth: '600px',
            }}
          >
            {post.description}
          </p>
        </div>
      </div>

      {/* Article Content */}
      <div
        style={{
          padding: '0 40px',
        }}
      >
        <div
          style={{
            color: '#334155',
          }}
        >
          <ContentComponent />
        </div>
      </div>

      {/* Call-to-Action Section */}
      <div style={{ padding: '40px 20px 60px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '16px',
            padding: '32px 24px',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#02122c',
              marginBottom: '12px',
            }}
          >
            Compare Prices Like a Pro
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#64748b',
              marginBottom: '20px',
              lineHeight: '1.6',
            }}
          >
            Stop wasting time comparing prices manually. Use POTAL to instantly see the true total cost across Amazon, Walmart, Best Buy, eBay, and AliExpress—including all duties, taxes, and shipping.
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
            Search with POTAL
          </a>
        </div>
      </div>

      {/* Related Posts Navigation */}
      {(previousPost || nextPost) && (
        <div style={{ padding: '40px 20px', borderTop: '1px solid #e2e8f0' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '20px',
            }}
          >
            More Articles
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '16px',
            }}
          >
            {nextPost && (
              <Link href={`/blog/${nextPost.slug}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '16px',
                    cursor: 'pointer',
                  }}
                >
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Next Article
                  </p>
                  <h4
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#02122c',
                      lineHeight: '1.4',
                    }}
                  >
                    {nextPost.title}
                  </h4>
                </div>
              </Link>
            )}

            {previousPost && (
              <Link href={`/blog/${previousPost.slug}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '16px',
                    cursor: 'pointer',
                  }}
                >
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Previous Article
                  </p>
                  <h4
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#02122c',
                      lineHeight: '1.4',
                    }}
                  >
                    {previousPost.title}
                  </h4>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
