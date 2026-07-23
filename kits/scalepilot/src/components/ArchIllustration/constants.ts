export const ARCH_CONFIG = {
  // 3D Setup
  PERSPECTIVE: 1200,      // in px
  MAX_TILT_DEG: 4,        // maximum tilt rotation in degrees
  DEFAULT_ROT_X: 55,      // standard X axis rotation
  DEFAULT_ROT_Z: -45,     // standard Z axis rotation

  // Layer Spacing (translateZ in normal / hover states)
  LAYERS: {
    L1: { name: 'Infrastructure', zNormal: 0,   zHover: 0,   floatAmp: 0,  floatSec: 8 },
    L2: { name: 'Analytics',      zNormal: 40,  zHover: 55,  floatAmp: 4,  floatSec: 9 },
    L3: { name: 'Service',        zNormal: 80,  zHover: 105, floatAmp: 7,  floatSec: 10 },
    L4: { name: 'Application',    zNormal: 120, zHover: 154, floatAmp: 10, floatSec: 11 }, // includes 4px hover rise
  },

  // Color Tokens mapped to Tailwind/CSS variables
  TOKENS: {
    baseGlow: "rgba(252, 221, 45, 0.12)", // #FCDD2D with 12% opacity
    accent: "#FFD84D",
    accentLight: "#FFE47E",
    black: "#111111",
    cardBg: "#FFFFFF",
    connectorColor: "rgba(13, 13, 11, 0.12)",
  },
};
