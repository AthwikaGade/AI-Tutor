import { cn, getMasteryBg } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  colorByValue?: boolean;
  color?: string;
  size?: "sm" | "md";
}

export default function ProgressBar({
  value,
  className,
  showLabel = false,
  colorByValue = false,
  color = "bg-indigo-500",
  size = "md",
}: ProgressBarProps) {
  const barColor = colorByValue ? getMasteryBg(value) : color;
  const height = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("w-full bg-gray-100 rounded-full overflow-hidden", height)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(value)}%</p>
      )}
    </div>
  );
}
