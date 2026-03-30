"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
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

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setSelectedFile(file);
          setUrl("");
          setError("");
        }
        return;
      }
    }
  }, []);

  const canSubmit = selectedFile || url.trim();

  return (
    <form onSubmit={handleSubmit} className="w-full" onPaste={handlePaste}>
      {/* Unified input bar — drag an image or type a URL */}
      <motion.div
        animate={{
          borderColor: dragOver ? "var(--brand)" : "var(--border)",
        }}
        transition={{ duration: 0.2 }}
        className="relative overflow-hidden rounded-xl border"
        style={{ background: "var(--s1)" }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        <AnimatePresence>
          {dragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-10 grid place-items-center rounded-xl"
              style={{ background: "var(--brand-dim)" }}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 text-[13px] font-medium"
                style={{ color: "var(--brand)" }}
              >
                <ImagePlus className="h-5 w-5" />
                Drop screenshot to analyze
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 p-2 pl-3">
          {/* Upload button */}
          <motion.button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            className="shrink-0 w-8 h-8 rounded-lg grid place-items-center disabled:opacity-30"
            style={{ background: "var(--brand-dim)" }}
            title="Upload a screenshot"
          >
            <ImagePlus className="h-4 w-4" style={{ color: "var(--brand)" }} />
          </motion.button>

          <AnimatePresence mode="wait">
            {selectedFile ? (
              /* Screenshot selected — show preview inline */
              <motion.div
                key="file-preview"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2.5 flex-1 min-w-0"
              >
                <div
                  className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border"
                  style={{ borderColor: "var(--border)" }}
                >
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Uploaded screenshot preview for UX audit"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-foreground/35">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB • Screenshot audit</p>
                </div>
                <motion.button
                  type="button"
                  onClick={clearFile}
                  whileHover={{ scale: 1.15, backgroundColor: "var(--hover-overlay)" }}
                  whileTap={{ scale: 0.9 }}
                  className="shrink-0 w-6 h-6 rounded-md grid place-items-center text-foreground/30 hover:text-foreground/60 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              </motion.div>
            ) : (
              /* URL input — default state */
              <motion.div
                key="url-input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1"
              >
                <input
                  type="text"
                  placeholder="https://your-landing-page.com"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); if (error) setError(""); }}
                  disabled={isLoading}
                  className="w-full bg-transparent text-[13px] font-mono text-foreground/60 placeholder:text-foreground/30 focus:outline-none disabled:opacity-50"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button — spring hover + tap */}
          <motion.button
            type="submit"
            disabled={isLoading || !canSubmit}
            whileHover={{
              scale: 1.03,
              y: -1,
              boxShadow: canSubmit ? "0 4px 20px var(--brand-glow)" : "none",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold disabled:opacity-25 disabled:pointer-events-none shrink-0"
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
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 text-[12px] text-destructive pl-1 font-mono"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

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
