/**
 * Spring tokens based on Material Design 3 physics.
 * Format: damping = ratio * 2 * sqrt(stiffness)
 */

/** Hero score ring, big reveals — Expressive Spatial (0.8, 380) */
export const SPRING_HERO = {
  type: "spring" as const,
  stiffness: 380,
  damping: 0.8 * 2 * Math.sqrt(380),
};

/** Screenshot slide-in, large panels — Expressive Spatial Slow (0.8, 200) */
export const SPRING_ENTRANCE = {
  type: "spring" as const,
  stiffness: 200,
  damping: 0.8 * 2 * Math.sqrt(200),
};

/** Tab content switch — Standard Spatial (0.9, 700) */
export const SPRING_TAB = {
  type: "spring" as const,
  stiffness: 700,
  damping: 0.9 * 2 * Math.sqrt(700),
};

/** Card stagger, small element entry — Standard Spatial Fast (0.9, 1400) */
export const SPRING_CARD = {
  type: "spring" as const,
  stiffness: 1400,
  damping: 0.9 * 2 * Math.sqrt(1400),
};

/** Nav indicator slide — Standard Spatial (0.9, 700) */
export const SPRING_NAV = {
  type: "spring" as const,
  stiffness: 700,
  damping: 0.9 * 2 * Math.sqrt(700),
};
