import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { GradeTier } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGradeTier(grade: number): GradeTier {
  if (grade <= 3) return "primary";
  if (grade <= 6) return "middle";
  return "secondary";
}

export function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getDaysUntil(dateString: string): number {
  const target = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getMasteryColor(percent: number): string {
  if (percent >= 80) return "text-emerald-600";
  if (percent >= 60) return "text-amber-600";
  return "text-rose-600";
}

export function getMasteryBg(percent: number): string {
  if (percent >= 80) return "bg-emerald-500";
  if (percent >= 60) return "bg-amber-500";
  return "bg-rose-500";
}
