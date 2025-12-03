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
  const radius = (size - strokeWidth - 20) / 2; // Extra padding for glow
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress * circumference);
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      className={cn("polar-ring transform -rotate-90", className)}
      style={{ overflow: 'visible' }}
    >
      {/* Glow filter definition */}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-white/10"
      />
      
      {/* Outer glow circle (blurred) */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth + 8}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="opacity-20 transition-all duration-300"
        filter="url(#softGlow)"
      />
      
      {/* Progress ring with glow */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-300 ease-out"
        filter="url(#glow)"
      />
    </svg>
  );
}
