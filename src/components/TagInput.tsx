import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  className?: string;
}

export function TagInput({ value, onChange, placeholder, multiline, className }: TagInputProps) {
  const baseClasses = cn(
    "w-full px-4 py-3 rounded-xl glass-button",
    "bg-white/5 border border-white/10",
    "text-foreground placeholder:text-muted-foreground",
    "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
    "transition-all",
    className
  );

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(baseClasses, "min-h-[100px] resize-none")}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={baseClasses}
    />
  );
}
