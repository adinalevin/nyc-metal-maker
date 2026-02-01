import { useEffect, useState, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface MetalPart {
  id: number;
  type: "bracket" | "plate" | "gusset" | "angle";
  x: number;
  delay: number;
  rotation: number;
  size: number;
}

const partShapes = {
  bracket: (size: number) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path
        d="M5 5h30v10H15v20H5V5z"
        fill="currentColor"
        opacity="0.15"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="10" cy="10" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="20" cy="10" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="10" cy="25" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  plate: (size: number) => (
    <svg width={size} height={size * 0.6} viewBox="0 0 50 30" fill="none">
      <rect
        x="2"
        y="2"
        width="46"
        height="26"
        rx="2"
        fill="currentColor"
        opacity="0.12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="10" cy="15" r="3" fill="currentColor" opacity="0.3" />
      <circle cx="25" cy="15" r="3" fill="currentColor" opacity="0.3" />
      <circle cx="40" cy="15" r="3" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  gusset: (size: number) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path
        d="M5 35L5 5L35 35H5Z"
        fill="currentColor"
        opacity="0.12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="28" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="28" cy="28" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  angle: (size: number) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path
        d="M5 5h10v30H5V5zM15 25h20v10H15V25z"
        fill="currentColor"
        opacity="0.12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="10" cy="10" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="10" cy="30" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="30" cy="30" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  ),
};

export function FallingMetalParts() {
  const prefersReducedMotion = useReducedMotion();
  const [parts, setParts] = useState<MetalPart[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isMobile) {
      // Show static parts for reduced motion or mobile
      setParts([]);
      return;
    }

    const types: MetalPart["type"][] = ["bracket", "plate", "gusset", "angle"];
    const newParts: MetalPart[] = [];
    const partCount = 8;

    for (let i = 0; i < partCount; i++) {
      newParts.push({
        id: i,
        type: types[i % types.length],
        x: 50 + (i * 6) + Math.random() * 10,
        delay: i * 0.3 + Math.random() * 0.5,
        rotation: Math.random() * 30 - 15,
        size: 40 + Math.random() * 30,
      });
    }

    setParts(newParts);
  }, [prefersReducedMotion, isMobile]);

  if (prefersReducedMotion || isMobile || parts.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {parts.map((part) => (
        <motion.div
          key={part.id}
          className="absolute text-steel"
          style={{
            left: `${part.x}%`,
            top: -100,
          }}
          initial={{ y: -100, opacity: 0, rotate: 0 }}
          animate={{
            y: `calc(100vh - ${150 + part.id * 30}px)`,
            opacity: [0, 1, 1, 0.6],
            rotate: part.rotation,
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: part.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {partShapes[part.type](part.size)}
        </motion.div>
      ))}
    </div>
  );
}
