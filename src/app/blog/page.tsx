import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { blogPosts } from "@/lib/blog";
import { Calendar, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "UX Blog — Tips, Guides & Best Practices",
  description:
    "Learn UX audit techniques, conversion optimization strategies, and usability best practices. Expert guides on heuristic evaluation, landing page optimization, and AI-powered UX tools.",
  alternates: { canonical: "https://www.uxlens.pro/blog" },
  openGraph: {
    title: "UXLens Blog — UX Audit Tips & Conversion Optimization Guides",
    description:
      "Expert guides on UX audits, heuristic evaluation, conversion optimization, and AI-powered design analysis.",
    url: "https://www.uxlens.pro/blog",
  },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            UX Insights & Guides
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Practical tips on UX audits, conversion optimization, and building
            better user experiences — backed by data and real examples.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-xl border border-border/60 overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Cover graphic */}
              <div
                className="relative h-48 flex items-center justify-center overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${post.coverGradient[0]}, ${post.coverGradient[1]})`,
                }}
              >
                <div className="absolute inset-0 opacity-10">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)",
                    }}
                  />
                </div>
                <div className="relative text-center px-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white/90 text-xs font-medium mb-3 backdrop-blur-sm">
                    {post.category}
                  </div>
                  <h2 className="text-white text-lg font-semibold leading-snug line-clamp-2">
                    {post.title}
                  </h2>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {post.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
