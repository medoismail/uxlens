"use client";

import { Eye } from "lucide-react";

export function Header() {
  return (
    <header className="w-full border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-6">
        <a
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground transition-opacity hover:opacity-70"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
            <Eye className="h-3.5 w-3.5 text-background" />
          </div>
          UXLens
        </a>
        <nav className="flex items-center gap-6">
          <a
            href="#pricing"
            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
