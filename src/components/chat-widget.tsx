"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ChatMessage } from "@/lib/types";
import { ChatMarkdown } from "@/components/chat-markdown";

interface ChatWidgetProps {
  auditId: string;
  plan: string;
}

export function ChatWidget({ auditId, plan }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [credits, setCredits] = useState<{ messages_used: number; messages_limit: number } | null>(null);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [error, setError] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load chat history when opened
  useEffect(() => {
    if (isOpen && !historyLoaded) {
      loadHistory();
    }
  }, [isOpen, historyLoaded]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  async function loadHistory() {
    try {
      const res = await fetch(`/api/chat/history?auditId=${auditId}`);
      const data = await res.json();

      if (data.chatEnabled === false) {
        setChatEnabled(false);
        return;
      }

      setMessages(data.messages || []);
      setCredits(data.credits || null);
      setHistoryLoaded(true);
    } catch {
      setError("Failed to load chat history");
    }
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || isLoading) return;

    setError("");
    setInput("");
    setIsLoading(true);

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Add placeholder for assistant response
    const assistantId = `stream-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);
    setIsLoading(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, message: trimmed }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setError(errorData.error || "Chat failed");
        setIsStreaming(false);
        return;
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      if (!reader) {
        setError("No response stream");
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + data.content }
                      : m
                  )
                );
              }

              if (data.done && data.credits) {
                setCredits(data.credits);
              }

              if (data.error) {
                setError(data.error);
              }
            } catch {
              // Ignore parse errors in stream
            }
          }
        }
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      setError("Connection failed. Please try again.");
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const remaining = credits ? credits.messages_limit - credits.messages_used : null;

  if (!chatEnabled) {
    return null;
  }

  return (
    <>
      {/* Floating toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-[14px] font-medium shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: "var(--brand)",
            color: "var(--brand-fg)",
            boxShadow: "0 4px 24px oklch(0.535 0.185 295 / 30%)",
          }}
        >
          <MessageCircle className="h-4 w-4" />
          Ask AI
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col rounded-xl border shadow-2xl overflow-hidden"
          style={{
            width: "min(400px, calc(100vw - 32px))",
            height: "min(560px, calc(100vh - 100px))",
            background: "var(--background)",
            borderColor: "var(--border2)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b shrink-0"
            style={{ borderColor: "var(--border)", background: "var(--s1)" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "var(--brand)" }} />
              <span className="text-[14px] font-semibold">UXLens AI</span>
              {remaining !== null && (
                <span
                  className="text-[12px] px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--brand-dim)",
                    color: "var(--brand)",
                    border: "1px solid var(--brand-glow)",
                  }}
                >
                  {remaining} left
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-foreground/5 transition-colors"
            >
              <X className="h-4 w-4 text-foreground/40" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <Sparkles className="h-8 w-8 mb-3 text-foreground/35" />
                <p className="text-[14px] font-medium text-foreground/50 mb-1">
                  Ask about your audit
                </p>
                <p className="text-[12px] text-foreground/50 max-w-[260px] leading-relaxed">
                  I can explain findings, suggest fixes, help prioritize issues, or rewrite copy.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                  {[
                    "What should I fix first?",
                    "Explain my trust score",
                    "Rewrite my headline",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        inputRef.current?.focus();
                      }}
                      className="text-[12px] px-3 py-1.5 rounded-full border transition-colors hover:border-foreground/20"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)", opacity: 0.5 }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-md"
                      : "rounded-bl-md"
                  }`}
                  style={
                    msg.role === "user"
                      ? { background: "var(--brand)", color: "var(--brand-fg)" }
                      : { background: "var(--s2)", color: "var(--foreground)" }
                  }
                >
                  {!msg.content ? (
                    <span className="inline-flex items-center gap-1.5 text-foreground/40">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Thinking...
                    </span>
                  ) : msg.role === "assistant" ? (
                    <ChatMarkdown content={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-2 text-[12px] text-center border-t" style={{ borderColor: "var(--border)", color: "var(--score-low)", background: "oklch(0.55 0.17 20 / 5%)" }}>
              {error}
              {error.includes("Pro") && (
                <Link href="/pricing" className="ml-1 underline font-medium" style={{ color: "var(--brand)" }}>
                  Upgrade <ArrowRight className="inline h-3 w-3" />
                </Link>
              )}
            </div>
          )}

          {/* Credits exhausted */}
          {remaining !== null && remaining <= 0 && (
            <div className="px-4 py-3 text-center border-t" style={{ borderColor: "var(--border)", background: "var(--s1)" }}>
              <p className="text-[12px] text-foreground/40 mb-1">Monthly chat limit reached</p>
              {plan !== "agency" && (
                <Link href="/pricing" className="text-[12px] font-medium underline" style={{ color: "var(--brand)" }}>
                  Upgrade for more messages
                </Link>
              )}
            </div>
          )}

          {/* Input */}
          {(remaining === null || remaining > 0) && (
            <div className="flex items-end gap-2 px-3 py-3 border-t" style={{ borderColor: "var(--border)" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your audit..."
                rows={1}
                className="flex-1 resize-none rounded-xl border px-3.5 py-2.5 text-[12px] text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-foreground/20 transition-colors"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--s1)",
                  maxHeight: "80px",
                  minHeight: "40px",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:pointer-events-none shrink-0"
                style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
