import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { blogPosts, getPostBySlug, getAllSlugs } from "@/lib/blog";
import { Calendar, Clock, ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: "Medo Ismail" }],
    alternates: { canonical: `https://www.uxlens.pro/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `https://www.uxlens.pro/blog/${slug}`,
      publishedTime: post.date,
      authors: ["Medo Ismail"],
      tags: post.keywords,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

/* Simple markdown-ish renderer for blog content */
function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc pl-6 space-y-1.5 text-muted-foreground">
          {listItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const inlineFormat = (text: string) =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={key++} className="text-2xl font-bold mt-10 mb-4">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={key++} className="text-xl font-semibold mt-8 mb-3">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushList();
      listItems.push(trimmed.replace(/^\d+\.\s/, ""));
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p
          key={key++}
          className="text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }}
        />
      );
    }
  }
  flushList();
  return elements;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const currentIndex = blogPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Person", name: "Medo Ismail" },
    publisher: {
      "@type": "Organization",
      name: "UXLens",
      url: "https://www.uxlens.pro",
    },
    mainEntityOfPage: `https://www.uxlens.pro/blog/${slug}`,
    keywords: post.keywords.join(", "),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> All articles
        </Link>

        {/* Cover */}
        <div
          className="relative rounded-xl overflow-hidden h-56 sm:h-64 flex items-center justify-center mb-8"
          style={{
            background: `linear-gradient(135deg, ${post.coverGradient[0]}, ${post.coverGradient[1]})`,
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.2) 0%, transparent 40%)",
              }}
            />
          </div>
          <div className="relative text-center px-8 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white/90 text-xs font-medium mb-3 backdrop-blur-sm">
              {post.category}
            </div>
            <h1 className="text-white text-2xl sm:text-3xl font-bold leading-tight">
              {post.title}
            </h1>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-10">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {post.readTime}
          </span>
          <span>By Medo Ismail</span>
        </div>

        {/* Content */}
        <article className="prose-custom space-y-4">
          {renderContent(post.content)}
        </article>

        {/* CTA */}
        <div className="mt-16 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h3 className="text-xl font-bold mb-2">
            Ready to audit your website?
          </h3>
          <p className="text-muted-foreground mb-5 max-w-md mx-auto">
            Get a full 10-layer UX diagnostic with heuristic evaluation,
            attention heatmaps, and actionable fixes in under 60 seconds.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Run Free UX Audit <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Prev/Next nav */}
        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          {prevPost && (
            <Link
              href={`/blog/${prevPost.slug}`}
              className="rounded-lg border border-border/60 p-4 hover:border-primary/30 transition-colors"
            >
              <span className="text-xs text-muted-foreground">Previous</span>
              <p className="text-sm font-medium mt-1 line-clamp-1">
                {prevPost.title}
              </p>
            </Link>
          )}
          {nextPost && (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="rounded-lg border border-border/60 p-4 hover:border-primary/30 transition-colors sm:text-right sm:ml-auto"
            >
              <span className="text-xs text-muted-foreground">Next</span>
              <p className="text-sm font-medium mt-1 line-clamp-1">
                {nextPost.title}
              </p>
            </Link>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
