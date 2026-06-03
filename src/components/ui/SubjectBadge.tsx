import { cn } from "@/lib/utils";

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-blue-100 text-blue-700",
  Math: "bg-blue-100 text-blue-700",
  Science: "bg-green-100 text-green-700",
  English: "bg-purple-100 text-purple-700",
  "Social Studies": "bg-amber-100 text-amber-700",
  Hindi: "bg-orange-100 text-orange-700",
  Telugu: "bg-red-100 text-red-700",
  Tamil: "bg-pink-100 text-pink-700",
};

const SUBJECT_ICONS: Record<string, string> = {
  Mathematics: "🔢",
  Math: "🔢",
  Science: "🔬",
  English: "📖",
  "Social Studies": "🌍",
  Hindi: "अ",
  Telugu: "తె",
  Tamil: "த",
};

interface SubjectBadgeProps {
  subject: string;
  className?: string;
  showIcon?: boolean;
}

export default function SubjectBadge({ subject, className, showIcon = true }: SubjectBadgeProps) {
  const color = SUBJECT_COLORS[subject] || "bg-gray-100 text-gray-700";
  const icon = SUBJECT_ICONS[subject] || "📚";
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium", color, className)}>
      {showIcon && <span>{icon}</span>}
      {subject}
    </span>
  );
}
