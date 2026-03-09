"use client";

import { useRef, useEffect, useCallback } from "react";

/* ─── CONFIG — Tune these to adjust the effect ──────────────────────── */

const CONFIG = {
  cellSize: 20,            // grid density (smaller = denser)
  fontSize: 12,            // character size in px
  font: "JetBrains Mono, monospace",

  // Character palette — intentional, not random
  chars: {
    soft: [".", "·", ":", "'", "`", "°"],
    structure: ["│", "─", "┌", "┐", "└", "┘"],
    text: ["─", "─", "─", "·", "·"],
    metric: ["0", "1", "4", "7", "8", "%", "▸"],
    button: ["[", "─", "─", "─", "]"],
  },

  // Interaction
  mouse: {
    radius: 160,           // px — how far cursor influence reaches
    glowStrength: 0.35,    // max brightness boost near cursor
    repelStrength: 4,      // px — character displacement
    smoothing: 0.08,       // cursor tracking lerp (lower = smoother)
  },

  // Animation timing
  anim: {
    driftSpeed: 0.0004,    // idle vertical sway
    scanSpeed: 0.8,        // scan line travel speed (px/frame)
    pulseFreq: 0.0025,     // breathing glow cycle
    scanInterval: 5000,    // ms between scan sweeps
  },

  // Wireframe panel positions (normalized 0-1)
  panels: [
    { x: 0.03, y: 0.05, w: 0.28, h: 0.14 },   // nav bar
    { x: 0.34, y: 0.04, w: 0.32, h: 0.07 },   // top center
    { x: 0.70, y: 0.06, w: 0.26, h: 0.12 },   // top-right card
    { x: 0.04, y: 0.25, w: 0.40, h: 0.22 },   // left content
    { x: 0.52, y: 0.27, w: 0.44, h: 0.18 },   // right panel
    { x: 0.06, y: 0.56, w: 0.30, h: 0.12 },   // bottom-left
    { x: 0.38, y: 0.55, w: 0.24, h: 0.09 },   // CTA block
    { x: 0.66, y: 0.57, w: 0.30, h: 0.16 },   // score card
    { x: 0.08, y: 0.78, w: 0.84, h: 0.05 },   // footer bar
  ],

  // Simulated text line positions
  textLines: [
    { x: 0.07, y: 0.30, w: 0.32 },
    { x: 0.07, y: 0.33, w: 0.26 },
    { x: 0.07, y: 0.36, w: 0.30 },
    { x: 0.07, y: 0.39, w: 0.20 },
    { x: 0.55, y: 0.31, w: 0.36 },
    { x: 0.55, y: 0.34, w: 0.30 },
    { x: 0.55, y: 0.37, w: 0.34 },
    { x: 0.10, y: 0.60, w: 0.20 },
    { x: 0.10, y: 0.63, w: 0.16 },
    { x: 0.69, y: 0.62, w: 0.22 },
    { x: 0.69, y: 0.65, w: 0.18 },
    { x: 0.69, y: 0.68, w: 0.14 },
  ],

  // CTA button zones (rendered as [ ─── ])
  buttons: [
    { x: 0.42, y: 0.585, w: 0.16 },
    { x: 0.72, y: 0.71, w: 0.12 },
  ],
};

/* ─── Types ─────────────────────────────────────────────────────────── */

interface Cell {
  char: string;
  baseAlpha: number;
  x: number;
  y: number;
  type: "soft" | "structure" | "text" | "metric" | "button" | "empty";
  phase: number;       // random offset for animation
}

/* ─── Component ─────────────────────────────────────────────────────── */

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000, tx: -1000, ty: -1000 });
  const gridRef = useRef<Cell[]>([]);
  const scanYRef = useRef(-100);
  const scanTimerRef = useRef(0);
  const timeRef = useRef(0);
  const reducedMotion = useRef(false);

  /* ── Build the grid of ASCII cells ─────────────────────────────── */
  const initGrid = useCallback((w: number, h: number) => {
    const cols = Math.floor(w / CONFIG.cellSize);
    const rows = Math.floor(h / CONFIG.cellSize);
    const cells: Cell[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nx = c / cols;     // 0-1
        const ny = r / rows;
        const px = c * CONFIG.cellSize + CONFIG.cellSize / 2;
        const py = r * CONFIG.cellSize + CONFIG.cellSize / 2;

        let type: Cell["type"] = "empty";
        let char = " ";
        let alpha = 0;

        // 1) Panel edges → wireframe structure
        for (const p of CONFIG.panels) {
          if (nx < p.x || nx > p.x + p.w || ny < p.y || ny > p.y + p.h) continue;

          const edgeThresh = 0.018;
          const onL = Math.abs(nx - p.x) < edgeThresh;
          const onR = Math.abs(nx - (p.x + p.w)) < edgeThresh;
          const onT = Math.abs(ny - p.y) < edgeThresh;
          const onB = Math.abs(ny - (p.y + p.h)) < edgeThresh;

          if ((onL || onR) && (onT || onB)) {
            type = "structure";
            char = onT ? (onL ? "┌" : "┐") : (onL ? "└" : "┘");
            alpha = 0.22;
          } else if (onL || onR) {
            type = "structure";
            char = "│";
            alpha = 0.14;
          } else if (onT || onB) {
            type = "structure";
            char = "─";
            alpha = 0.14;
          } else {
            // Interior fill — sparse dots
            if (Math.random() < 0.25) {
              type = "soft";
              char = CONFIG.chars.soft[Math.floor(Math.random() * CONFIG.chars.soft.length)];
              alpha = 0.06 + Math.random() * 0.04;
            }
          }
          break;
        }

        // 2) Text lines → horizontal dashes suggesting content
        if (type === "empty") {
          for (const tl of CONFIG.textLines) {
            if (Math.abs(ny - tl.y) < 0.012 && nx >= tl.x && nx <= tl.x + tl.w) {
              type = "text";
              char = CONFIG.chars.text[Math.floor(Math.random() * CONFIG.chars.text.length)];
              alpha = 0.10 + Math.random() * 0.05;
              break;
            }
          }
        }

        // 3) CTA buttons → [ ─── ] pattern
        if (type === "empty") {
          for (const btn of CONFIG.buttons) {
            if (Math.abs(ny - btn.y) < 0.012 && nx >= btn.x && nx <= btn.x + btn.w) {
              type = "button";
              const pos = (nx - btn.x) / btn.w;
              char = pos < 0.12 ? "[" : pos > 0.88 ? "]" : "─";
              alpha = 0.16 + Math.random() * 0.04;
              break;
            }
          }
        }

        // 4) Scattered metrics
        if (type === "empty" && Math.random() < 0.02) {
          type = "metric";
          char = CONFIG.chars.metric[Math.floor(Math.random() * CONFIG.chars.metric.length)];
          alpha = 0.06 + Math.random() * 0.04;
        }

        // 5) Very sparse background texture
        if (type === "empty" && Math.random() < 0.06) {
          type = "soft";
          char = CONFIG.chars.soft[Math.floor(Math.random() * CONFIG.chars.soft.length)];
          alpha = 0.035 + Math.random() * 0.025;
        }

        // Center clear zone — fade out near hero text area
        const cx = (nx - 0.5) * 1.8;
        const cy = (ny - 0.42) * 2.5;
        const centerDist = Math.sqrt(cx * cx + cy * cy);
        if (centerDist < 0.45) {
          alpha *= Math.max(0, (centerDist - 0.08) / 0.37);
        }

        cells.push({ char, baseAlpha: alpha, x: px, y: py, type, phase: Math.random() * Math.PI * 2 });
      }
    }

    gridRef.current = cells;
  }, []);

  /* ── Render loop ───────────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const t = timeRef.current;
    const m = mouseRef.current;
    const noMotion = reducedMotion.current;

    // Smooth mouse tracking
    m.tx += (m.x - m.tx) * CONFIG.mouse.smoothing;
    m.ty += (m.y - m.ty) * CONFIG.mouse.smoothing;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Scan line sweep
    if (!noMotion) {
      scanTimerRef.current += 16;
      if (scanTimerRef.current > CONFIG.anim.scanInterval) {
        scanTimerRef.current = 0;
        scanYRef.current = -30;
      }
      if (scanYRef.current >= -30 && scanYRef.current < h + 60) {
        scanYRef.current += CONFIG.anim.scanSpeed;
        const g = ctx.createLinearGradient(0, scanYRef.current - 40, 0, scanYRef.current + 40);
        g.addColorStop(0, "rgba(136,92,191,0)");
        g.addColorStop(0.5, "rgba(136,92,191,0.035)");
        g.addColorStop(1, "rgba(136,92,191,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, scanYRef.current - 40, w + 1, 80);
      }
    }

    // Draw characters
    ctx.font = `${CONFIG.fontSize}px ${CONFIG.font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const cells = gridRef.current;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (cell.type === "empty" || cell.baseAlpha < 0.005) continue;

      // Idle drift
      const drift = noMotion ? 0 : Math.sin(t * CONFIG.anim.driftSpeed + cell.phase) * 1.2;

      // Mouse proximity
      let dx = 0, dy = 0, glow = 0;
      const distX = cell.x - m.tx;
      const distY = cell.y - m.ty;
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist < CONFIG.mouse.radius && m.tx > 0) {
        const prox = 1 - dist / CONFIG.mouse.radius;
        const ease = prox * prox;
        glow = ease * CONFIG.mouse.glowStrength;

        if (!noMotion) {
          const ang = Math.atan2(distY, distX);
          dx = Math.cos(ang) * ease * CONFIG.mouse.repelStrength;
          dy = Math.sin(ang) * ease * CONFIG.mouse.repelStrength;
        }
      }

      // Breathing pulse
      const breath = noMotion ? 0 : Math.sin(t * CONFIG.anim.pulseFreq + cell.phase) * 0.02;

      // Scan boost
      let scanGlow = 0;
      if (!noMotion && scanYRef.current >= 0) {
        const sd = Math.abs(cell.y - scanYRef.current);
        if (sd < 50) scanGlow = (1 - sd / 50) * 0.15;
      }

      const alpha = Math.min(1, cell.baseAlpha + glow + breath + scanGlow);
      if (alpha < 0.008) continue;

      // Color — muted gray-purple base, shifts to brand purple near cursor/scan
      let r = 130, g2 = 120, b = 155;
      const colorShift = Math.max(glow / CONFIG.mouse.glowStrength, scanGlow / 0.15);
      if (colorShift > 0.05) {
        r = Math.round(r + (136 - r) * colorShift);
        g2 = Math.round(g2 + (92 - g2) * colorShift);
        b = Math.round(b + (191 - b) * colorShift);
      }

      ctx.fillStyle = `rgba(${r},${g2},${b},${alpha})`;
      ctx.fillText(cell.char, cell.x + dx, cell.y + dy + drift);
    }

    // Cursor glow halo
    if (m.tx > 0 && !noMotion) {
      const cg = ctx.createRadialGradient(m.tx, m.ty, 0, m.tx, m.ty, CONFIG.mouse.radius * 0.6);
      cg.addColorStop(0, "rgba(136,92,191,0.04)");
      cg.addColorStop(1, "rgba(136,92,191,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(m.tx, m.ty, CONFIG.mouse.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    timeRef.current += 16;
    animRef.current = requestAnimationFrame(render);
  }, []);

  /* ── Setup & teardown ──────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      initGrid(rect.width, rect.height);
    };

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - r.left;
      mouseRef.current.y = e.clientY - r.top;
    };
    const onLeave = () => { mouseRef.current.x = -1000; mouseRef.current.y = -1000; };
    const onTouch = (e: TouchEvent) => {
      if (!e.touches.length) return;
      const r = canvas.getBoundingClientRect();
      mouseRef.current.x = e.touches[0].clientX - r.left;
      mouseRef.current.y = e.touches[0].clientY - r.top;
    };
    const onTouchEnd = () => { mouseRef.current.x = -1000; mouseRef.current.y = -1000; };

    resize();
    animRef.current = requestAnimationFrame(render);

    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("touchmove", onTouch, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("touchmove", onTouch);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [initGrid, render]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
