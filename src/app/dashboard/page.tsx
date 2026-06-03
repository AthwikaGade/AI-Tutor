"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mockStore } from "@/lib/mock-store";
import { formatStudyTime, getMasteryColor } from "@/lib/utils";
import type { Child, LearningGraph, HomeworkSession } from "@/types";
import { Card } from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import SubjectBadge from "@/components/ui/SubjectBadge";
import TutorAvatar from "@/components/ui/TutorAvatar";

export default function DashboardPage() {
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [graph, setGraph] = useState<LearningGraph | null>(null);
  const [pending, setPending] = useState<HomeworkSession[]>([]);

  useEffect(() => {
    const c = mockStore.getCurrentChild();
    if (!c) { router.push("/onboarding"); return; }
    setChild(c);
    setGraph(mockStore.getLearningGraph(c.id));
    setPending(mockStore.getPendingHomework(c.id));
  }, [router]);

  if (!child) return null;

  const greeting = getGreeting(child.name);
  const subjectEntries = graph ? Object.entries(graph.subjects) : [];
  const weakSubjects = subjectEntries
    .filter(([, s]) => s.masteryPercent < 60)
    .sort((a, b) => a[1].masteryPercent - b[1].masteryPercent);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-linear-to-br from-indigo-600 to-violet-600 text-white px-4 pt-10 pb-16">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <TutorAvatar size="sm" />
            <div>
              <p className="text-indigo-200 text-xs">GuardianTutor</p>
              <h1 className="font-bold text-lg leading-tight">{greeting}</h1>
            </div>
            {graph && graph.streak > 0 && (
              <div className="ml-auto bg-white/20 rounded-xl px-3 py-1.5 text-center">
                <div className="text-xl">🔥</div>
                <div className="text-xs font-semibold">{graph.streak} days</div>
              </div>
            )}
          </div>

          {/* Continuity message */}
          <ContinuityMessage child={child} pending={pending} graph={graph} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8 pb-24 space-y-4">
        {/* Primary CTA */}
        <Link href="/homework">
          <Card className="bg-indigo-600 border-0 text-white cursor-pointer hover:bg-indigo-700 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl shrink-0">
                📝
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-base">
                  {pending.length > 0 ? "Continue Homework" : "Start Homework"}
                </h2>
                <p className="text-indigo-200 text-sm">
                  {pending.length > 0
                    ? `${pending.length} assignment${pending.length > 1 ? "s" : ""} in progress`
                    : "Upload a new assignment"}
                </p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </Card>
        </Link>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/study">
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
              <div className="text-2xl mb-2">📚</div>
              <div className="font-semibold text-gray-800 text-sm">Study Session</div>
              <div className="text-gray-400 text-xs mt-0.5">Practice & revise</div>
            </Card>
          </Link>
          <Link href="/study?mode=doubt">
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
              <div className="text-2xl mb-2">🙋</div>
              <div className="font-semibold text-gray-800 text-sm">Ask a Doubt</div>
              <div className="text-gray-400 text-xs mt-0.5">Get instant help</div>
            </Card>
          </Link>
          <Link href="/study?mode=test">
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
              <div className="text-2xl mb-2">✏️</div>
              <div className="font-semibold text-gray-800 text-sm">Practice Test</div>
              <div className="text-gray-400 text-xs mt-0.5">Quiz yourself</div>
            </Card>
          </Link>
          <Link href="/study?mode=exam">
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold text-gray-800 text-sm">Exam Prep</div>
              <div className="text-gray-400 text-xs mt-0.5">Upcoming exams</div>
            </Card>
          </Link>
        </div>

        {/* Subject Progress */}
        {subjectEntries.length > 0 ? (
          <Card>
            <h3 className="font-semibold text-gray-800 mb-3">Subject Progress</h3>
            <div className="space-y-3">
              {subjectEntries.map(([name, s]) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <SubjectBadge subject={name} />
                    <span className={`text-xs font-semibold ${getMasteryColor(s.masteryPercent)}`}>
                      {s.masteryPercent}%
                    </span>
                  </div>
                  <ProgressBar value={s.masteryPercent} colorByValue size="sm" />
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="bg-indigo-50 border-indigo-100">
            <div className="text-center py-2">
              <p className="text-indigo-600 font-medium text-sm">Complete your first homework to see progress here!</p>
            </div>
          </Card>
        )}

        {/* Weak Areas Focus */}
        {weakSubjects.length > 0 && (
          <Card>
            <h3 className="font-semibold text-gray-800 mb-3">Needs Practice</h3>
            <div className="space-y-2">
              {weakSubjects.slice(0, 3).map(([name, s]) => (
                <Link key={name} href={`/study?subject=${encodeURIComponent(name)}&mode=weak`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer">
                    <SubjectBadge subject={name} showIcon />
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">
                        {s.weakTopics.slice(0, 2).join(", ") || "General practice"}
                      </div>
                    </div>
                    <span className="text-rose-500 text-xs font-semibold">{s.masteryPercent}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Today's study time */}
        {graph && graph.totalStudyMinutes > 0 && (
          <Card className="bg-emerald-50 border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⏱️</div>
              <div>
                <p className="font-semibold text-emerald-800 text-sm">
                  {formatStudyTime(graph.totalStudyMinutes)} studied total
                </p>
                <p className="text-emerald-600 text-xs">Keep going — every minute counts</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Bottom nav */}
      <BottomNav active="home" />
    </div>
  );
}

function ContinuityMessage({
  child,
  pending,
  graph,
}: {
  child: Child;
  pending: HomeworkSession[];
  graph: LearningGraph | null;
}) {
  if (pending.length > 0) {
    const hw = pending[0];
    return (
      <div className="bg-white/15 rounded-2xl p-4">
        <p className="text-sm font-medium">
          You were working on <span className="font-bold">{hw.subject} homework</span>. Want to finish it?
        </p>
      </div>
    );
  }
  if (graph && graph.lastStudyDate) {
    return (
      <div className="bg-white/15 rounded-2xl p-4">
        <p className="text-sm font-medium">
          Welcome back, <span className="font-bold">{child.name}</span>! What would you like to work on today?
        </p>
      </div>
    );
  }
  return (
    <div className="bg-white/15 rounded-2xl p-4">
      <p className="text-sm font-medium">
        Hi <span className="font-bold">{child.name}</span>! I'm your tutor 🦉 Start with your homework and we'll learn together.
      </p>
    </div>
  );
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}!`;
  if (hour < 17) return `Good afternoon, ${name}!`;
  return `Good evening, ${name}!`;
}

function BottomNav({ active }: { active: string }) {
  const items = [
    { id: "home", label: "Home", icon: "🏠", href: "/dashboard" },
    { id: "homework", label: "Homework", icon: "📝", href: "/homework" },
    { id: "study", label: "Study", icon: "📚", href: "/study" },
    { id: "parent", label: "Parent", icon: "👨‍👩‍👧", href: "/parent" },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex safe-area-pb z-50">
      {items.map((item) => (
        <Link key={item.id} href={item.href} className="flex-1">
          <div className={`flex flex-col items-center py-3 gap-0.5 ${active === item.id ? "text-indigo-600" : "text-gray-400"}`}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
