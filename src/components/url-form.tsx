"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowRight, Loader2, ImagePlus, X } from "lucide-react";
import { urlSchema } from "@/lib/schemas";

interface UrlFormProps {
  onSubmit: (url: string) => void;
  onScreenshotSubmit?: (file: File) => void;
  isLoading: boolean;
}

export function UrlForm({ onSubmit, onScreenshotSubmit, isLoading }: UrlFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selectedFile) {
      onScreenshotSubmit?.(selectedFile);
    } else {
      const result = urlSchema.safeParse(url);
      if (!result.success) {
        setError(result.error.issues[0]?.message || "Invalid URL");
        return;
      }
      onSubmit(url.trim());
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && ["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setSelectedFile(file);
      setUrl("");
      setError("");
    } else {
      setError("Please drop a PNG, JPG, or WebP image");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUrl("");
      setError("");
    }
  }, []);

  function clearFile() {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const canSubmit = selectedFile || url.trim();

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Unified input bar — drag an image or type a URL */}
      <div
        className="relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-elevation-1"
        style={{
          background: "var(--s1)",
          borderColor: dragOver ? "var(--brand)" : "rgba(0,0,0,0.06)",
          boxShadow: dragOver ? "0 0 0 2px var(--brand-glow)" : undefined,
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl" style={{ background: "var(--brand-dim)" }}>
            <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: "var(--brand)" }}>
              <ImagePlus className="h-5 w-5" />
              Drop screenshot to analyze
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 p-2 pl-3">
          {/* Upload button — small icon inside the bar */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="shrink-0 w-8 h-8 rounded-lg grid place-items-center transition-all hover:scale-105 disabled:opacity-30"
            style={{ background: "var(--brand-dim)" }}
            title="Upload a screenshot"
          >
            <ImagePlus className="h-4 w-4" style={{ color: "var(--brand)" }} />
          </button>

          {selectedFile ? (
            /* Screenshot selected — show preview inline */
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div
                className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border"
                style={{ borderColor: "var(--border)" }}
              >
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-foreground truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-foreground/35">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB • Screenshot audit</p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="shrink-0 w-6 h-6 rounded-md grid place-items-center text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5 transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            /* URL input — default state */
            <>
              <input
                type="text"
                placeholder="https://your-landing-page.com"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (error) setError(""); }}
                disabled={isLoading}
                className="flex-1 bg-transparent text-[13px] font-mono text-foreground/60 placeholder:text-foreground/30 focus:outline-none disabled:opacity-50 min-w-0"
              />
            </>
          )}

          {/* Submit button — always visible, large and prominent */}
          <button
            type="submit"
            disabled={isLoading || !canSubmit}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold transition-all duration-200 hover:translate-y-[-1px] active:scale-[0.98] disabled:opacity-25 disabled:pointer-events-none shrink-0"
            style={{
              background: "var(--brand)",
              color: "var(--brand-fg)",
              boxShadow: canSubmit && !isLoading ? "0 2px 16px var(--brand-glow)" : "none",
            }}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {selectedFile ? "Analyze" : "Run Audit"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-1.5 text-[12px] text-destructive animate-fade-in pl-1 font-mono">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </form>
  );
}
