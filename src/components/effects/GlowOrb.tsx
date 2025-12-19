import { motion } from "framer-motion";

interface GlowOrbProps {
  color: "cyan" | "purple" | "pink" | "green";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  delay?: number;
}

const colorMap = {
  cyan: "bg-neon-cyan",
  purple: "bg-neon-purple",
  pink: "bg-neon-pink",
  green: "bg-neon-green",
};

const sizeMap = {
  sm: "w-32 h-32",
  md: "w-64 h-64",
  lg: "w-96 h-96",
  xl: "w-[500px] h-[500px]",
};

const blurMap = {
  sm: "blur-[60px]",
  md: "blur-[100px]",
  lg: "blur-[150px]",
  xl: "blur-[200px]",
};

export function GlowOrb({ color, size = "md", className = "", delay = 0 }: GlowOrbProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.3, scale: 1 }}
      transition={{ duration: 1.5, delay }}
      className={`absolute rounded-full ${colorMap[color]} ${sizeMap[size]} ${blurMap[size]} ${className}`}
      style={{ pointerEvents: "none" }}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        }}
        className="w-full h-full rounded-full"
      />
    </motion.div>
  );
}