"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

/**
 * Subtle animated gradient mesh background for the hero section.
 * Uses Three.js to render a gently morphing mesh of soft blobs.
 * Inspired by Linear.app and Vercel's ambient backgrounds.
 *
 * Performance: single low-poly plane with fragment shader, minimal GPU cost.
 * Respects prefers-reduced-motion.
 */
export function HeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Respect reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Fullscreen quad with custom shader
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new THREE.Vector2(container.clientWidth, container.clientHeight),
        },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uResolution;
        varying vec2 vUv;

        // Simple noise function
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          vec2 shift = vec2(100.0);
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = p * 2.0 + shift;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = vUv;
          float aspect = uResolution.x / uResolution.y;
          vec2 p = vec2(uv.x * aspect, uv.y);

          float t = uTime * 0.08;

          // Layered noise for organic movement
          float n1 = fbm(p * 1.5 + t * 0.3);
          float n2 = fbm(p * 2.5 - t * 0.2 + 4.0);
          float n3 = fbm(p * 1.0 + vec2(t * 0.15, -t * 0.1) + 8.0);

          // Brand purple: #4C2CFF → rgb(76, 44, 255)
          vec3 purple = vec3(0.298, 0.173, 1.0);
          vec3 blue = vec3(0.35, 0.45, 1.0);
          vec3 pink = vec3(0.85, 0.3, 0.95);

          // Mix colors based on noise
          vec3 col = mix(purple, blue, n1 * 0.8);
          col = mix(col, pink, n2 * 0.3);

          // Soft vignette — fade to transparent at edges
          float vignette = 1.0 - smoothstep(0.2, 0.85, length(uv - 0.5) * 1.4);

          // Overall intensity — very subtle
          float alpha = (n1 * 0.4 + n2 * 0.3 + n3 * 0.2) * vignette * 0.055;

          // Fade out at bottom
          alpha *= smoothstep(0.0, 0.3, uv.y);
          // Slightly less at very top
          alpha *= smoothstep(0.0, 0.15, 1.0 - uv.y);

          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Animation loop
    const clock = new THREE.Clock();

    function animate() {
      const elapsed = clock.getElapsedTime();
      material.uniforms.uTime.value = prefersReduced ? 0 : elapsed;
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    }

    animate();

    // Handle resize
    function onResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      material.uniforms.uResolution.value.set(w, h);
    }

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
