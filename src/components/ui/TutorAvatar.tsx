"use client";
import { cn } from "@/lib/utils";

interface TutorAvatarProps {
  speaking?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "w-10 h-10 text-xl",
  md: "w-14 h-14 text-3xl",
  lg: "w-20 h-20 text-4xl",
};

export default function TutorAvatar({ speaking, size = "md", className }: TutorAvatarProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg",
          sizes[size],
          speaking && "ring-4 ring-indigo-300 ring-offset-2"
        )}
      >
        <span>🦉</span>
      </div>
      {speaking && (
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500" />
        </span>
      )}
    </div>
  );
}
