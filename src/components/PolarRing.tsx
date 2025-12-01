import { cn } from "@/lib/utils";

interface PolarRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export function PolarRing({ 
  progress, 
  size = 280, 
  strokeWidth = 6,
  color = "hsl(var(--primary))",
  className 
}: PolarRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress * circumference);

  return (
    <svg
      width={size}
      height={size}
      className={cn("polar-ring transform -rotate-90", className)}
    >
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-white/10"
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-300 ease-out"
        style={{
          filter: `drop-shadow(0 0 10px ${color})`,
        }}
      />
      {/* Glow effect */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth + 4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="opacity-30 blur-sm transition-all duration-300"
      />
    </svg>
  );
}
