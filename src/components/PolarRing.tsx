import { cn } from "@/lib/utils";

interface PolarRingProps {
  progress: number;
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
  const radius = (size - strokeWidth - 20) / 2;
  const circumference = radius * 2 * Math.PI;
  const normalizedProgress = Math.min(1, Math.max(0, progress));
  const offset = circumference - (normalizedProgress * circumference);
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      className={cn("polar-ring -rotate-90", className)}
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <filter id={`softGlow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth={strokeWidth}
      />

      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth + 10}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        opacity={0.18}
        filter={`url(#softGlow-${size})`}
      />

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
        filter={`url(#softGlow-${size})`}
      />
    </svg>
  );
}
