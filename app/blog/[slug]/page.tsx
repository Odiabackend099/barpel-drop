import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react';
import { blogPosts, getBlogPost, getRelatedPosts } from '@/lib/blog-data';
import Navigation from '@/components/marketing/Navigation';
import Footer from '@/components/marketing/sections/Footer';

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: post.title,
    description: post.excerpt.slice(0, 160),
    alternates: {
      canonical: `https://barpel-ai.odia.dev/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt.slice(0, 160),
      url: `https://barpel-ai.odia.dev/blog/${post.slug}`,
    },
  };
}

const categoryColors: Record<string, string> = {
  'Industry Trends': 'bg-purple-500/20 text-purple-300',
  'Best Practices': 'bg-blue-500/20 text-blue-300',
  Growth: 'bg-emerald-500/20 text-emerald-300',
  Tutorial: 'bg-orange-500/20 text-orange-300',
  Features: 'bg-teal-500/20 text-teal-300',
  'Data & Insights': 'bg-indigo-500/20 text-indigo-300',
  Comparison: 'bg-rose-500/20 text-rose-300',
};

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  const related = getRelatedPosts(post.slug, 3);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt.slice(0, 160),
    datePublished: '2026-03-16',
    dateModified: '2026-03-16',
    author: { '@type': 'Organization', name: 'Barpel AI' },
    publisher: { '@type': 'Organization', name: 'Barpel AI' },
    url: `https://barpel-ai.odia.dev/blog/${post.slug}`,
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Navigation />

      {/* Hero Banner */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-brand-navy via-slate-900 to-teal-900">
        <div className="container-default">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            <div className="flex items-center gap-3 mb-6">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${categoryColors[post.category] || 'bg-slate-500/20 text-slate-300'}`}
              >
                {post.category}
              </span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {post.title}
            </h1>

            <p className="text-white/60 text-lg leading-relaxed mb-8">
              {post.excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-white/40">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {post.author.name}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {post.date}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
              <span className="text-xs text-white/30">Last updated: {post.date}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <main className="section-padding">
        <div className="container-default">
          <article className="max-w-3xl mx-auto">
            {post.content.map((section, index) => (
              <div key={index} className="mb-12">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-navy mb-6">
                  {section.heading}
                </h2>

                {section.paragraphs.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-slate-600 text-lg leading-relaxed mb-5">
                    {paragraph}
                  </p>
                ))}

                {/* Optional comparison table */}
                {section.table && (
                  <div className="overflow-x-auto my-8">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-brand-navy text-white">
                          {section.table.headers.map((h) => (
                            <th key={h} className="text-left py-3 px-4 font-semibold first:rounded-tl-lg last:rounded-tr-lg">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row, rIdx) => (
                          <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={`py-3 px-4 border-b border-slate-100 ${
                                  cIdx === 0 ? 'font-medium text-brand-navy' :
                                  cell.startsWith('✓') ? 'text-teal-600 font-semibold' :
                                  cell.startsWith('✗') ? 'text-slate-400' :
                                  'text-slate-600'
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Optional FAQ accordion */}
                {section.faqs && (
                  <div className="space-y-3 mt-6">
                    {section.faqs.map((faq) => (
                      <details
                        key={faq.question}
                        className="group bg-slate-50 rounded-xl border border-slate-200 open:border-teal-300 open:bg-white transition-colors duration-200"
                      >
                        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-semibold text-brand-navy select-none">
                          {faq.question}
                          <span className="ml-4 flex-shrink-0 w-5 h-5 rounded-full border border-teal-400/50 flex items-center justify-center text-teal-600 text-xs transition-transform duration-200 group-open:rotate-45">
                            +
                          </span>
                        </summary>
                        <p className="px-5 pb-4 text-slate-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </article>

          {/* Internal links strip */}
          <div className="max-w-3xl mx-auto mt-4 mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm font-semibold text-brand-navy mb-3">Explore Barpel AI</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/features" className="text-teal-600 hover:underline">
                See all AI voice features →
              </Link>
              <Link href="/pricing" className="text-teal-600 hover:underline">
                View pricing plans →
              </Link>
              <Link href="/signup" className="text-teal-600 hover:underline">
                Start your free trial →
              </Link>
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-3xl mx-auto mt-8 mb-20">
            <div className="bg-gradient-to-br from-brand-navy to-slate-800 rounded-2xl p-10 md:p-14 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/5 rounded-full translate-y-1/2 -translate-x-1/4" />
              <div className="relative">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
                  Ready to transform your customer support?
                </h2>
                <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
                  Set up your AI voice assistant in minutes and start delivering
                  faster, smarter support to every customer.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-all duration-200"
                >
                  Start your free 14-day trial →
                </Link>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-brand-navy mb-8 text-center">
              Related Articles
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {related.map((relPost) => (
                <Link
                  key={relPost.slug}
                  href={`/blog/${relPost.slug}`}
                  className="group block"
                >
                  <div className="bg-white border border-slate-200 rounded-xl p-6 h-full hover:shadow-lg transition-all duration-300">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mb-3 ${
                        categoryColors[relPost.category]
                          ? categoryColors[relPost.category]
                              .replace('/20', '/10')
                              .replace('300', '700')
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {relPost.category}
                    </span>
                    <h3 className="text-lg font-semibold text-brand-navy mb-2 group-hover:text-teal-600 transition-colors leading-snug">
                      {relPost.title}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2">
                      {relPost.excerpt}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-4">
                      <Clock className="w-3 h-3" />
                      {relPost.readTime}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
