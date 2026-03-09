"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

/**
 * Compact markdown renderer for the chat widget.
 * Styles are inline to match the UXLens design system and stay compact
 * inside small chat bubbles.
 */

const components: Components = {
  // Paragraphs: tight spacing
  p({ children }) {
    return (
      <p style={{ margin: "0.35em 0", lineHeight: 1.55 }}>{children}</p>
    );
  },

  // Bold
  strong({ children }) {
    return (
      <strong style={{ fontWeight: 650, color: "var(--foreground)" }}>
        {children}
      </strong>
    );
  },

  // Italic
  em({ children }) {
    return <em style={{ fontStyle: "italic", opacity: 0.85 }}>{children}</em>;
  },

  // Headings → just bold text at slightly larger size (no big headers in chat)
  h1({ children }) {
    return (
      <p
        style={{
          fontWeight: 700,
          fontSize: "0.95em",
          margin: "0.6em 0 0.25em",
          color: "var(--foreground)",
        }}
      >
        {children}
      </p>
    );
  },
  h2({ children }) {
    return (
      <p
        style={{
          fontWeight: 700,
          fontSize: "0.92em",
          margin: "0.6em 0 0.25em",
          color: "var(--foreground)",
        }}
      >
        {children}
      </p>
    );
  },
  h3({ children }) {
    return (
      <p
        style={{
          fontWeight: 650,
          fontSize: "0.88em",
          margin: "0.5em 0 0.2em",
          color: "var(--foreground)",
        }}
      >
        {children}
      </p>
    );
  },

  // Ordered list
  ol({ children }) {
    return (
      <ol
        style={{
          margin: "0.35em 0",
          paddingLeft: "1.3em",
          listStyleType: "decimal",
          display: "flex",
          flexDirection: "column",
          gap: "0.2em",
        }}
      >
        {children}
      </ol>
    );
  },

  // Unordered list
  ul({ children }) {
    return (
      <ul
        style={{
          margin: "0.35em 0",
          paddingLeft: "1.3em",
          listStyleType: "disc",
          display: "flex",
          flexDirection: "column",
          gap: "0.2em",
        }}
      >
        {children}
      </ul>
    );
  },

  // List items
  li({ children }) {
    return (
      <li style={{ lineHeight: 1.5, paddingLeft: "0.15em" }}>{children}</li>
    );
  },

  // Inline code
  code({ children, className }) {
    // If it has a language class, it's a code block (handled by pre)
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return (
        <code
          style={{
            display: "block",
            fontFamily: "var(--font-mono, 'SF Mono', 'Fira Code', monospace)",
            fontSize: "0.88em",
            lineHeight: 1.5,
          }}
        >
          {children}
        </code>
      );
    }

    // Inline code
    return (
      <code
        style={{
          fontFamily: "var(--font-mono, 'SF Mono', 'Fira Code', monospace)",
          fontSize: "0.88em",
          background: "var(--s3, oklch(0.85 0.02 295 / 40%))",
          padding: "0.15em 0.4em",
          borderRadius: "4px",
          wordBreak: "break-word",
        }}
      >
        {children}
      </code>
    );
  },

  // Code blocks
  pre({ children }) {
    return (
      <pre
        style={{
          margin: "0.4em 0",
          padding: "0.6em 0.75em",
          borderRadius: "8px",
          background: "var(--s3, oklch(0.85 0.02 295 / 40%))",
          overflowX: "auto",
          fontSize: "0.88em",
          border: "1px solid var(--border)",
        }}
      >
        {children}
      </pre>
    );
  },

  // Links
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "var(--brand)",
          textDecoration: "underline",
          textUnderlineOffset: "2px",
          fontWeight: 500,
        }}
      >
        {children}
      </a>
    );
  },

  // Blockquote
  blockquote({ children }) {
    return (
      <blockquote
        style={{
          margin: "0.4em 0",
          paddingLeft: "0.75em",
          borderLeft: "2px solid var(--brand-glow, oklch(0.75 0.12 295))",
          color: "var(--foreground)",
          opacity: 0.75,
          fontStyle: "italic",
        }}
      >
        {children}
      </blockquote>
    );
  },

  // Horizontal rule
  hr() {
    return (
      <hr
        style={{
          border: "none",
          borderTop: "1px solid var(--border)",
          margin: "0.6em 0",
        }}
      />
    );
  },

  // Tables (GFM)
  table({ children }) {
    return (
      <div style={{ overflowX: "auto", margin: "0.4em 0" }}>
        <table
          style={{
            width: "100%",
            fontSize: "0.88em",
            borderCollapse: "collapse",
          }}
        >
          {children}
        </table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th
        style={{
          textAlign: "left",
          fontWeight: 650,
          padding: "0.35em 0.5em",
          borderBottom: "1px solid var(--border)",
          fontSize: "0.92em",
        }}
      >
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td
        style={{
          padding: "0.3em 0.5em",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {children}
      </td>
    );
  },
};

interface ChatMarkdownProps {
  content: string;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div
      className="chat-md"
      style={{
        fontSize: "inherit",
        lineHeight: "inherit",
        wordBreak: "break-word",
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
