"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mockStore } from "@/lib/mock-store";
import { generateDailyReport } from "@/lib/ai-mock";
import { formatStudyTime, getMasteryColor, getTodayString } from "@/lib/utils";
import type { Child, LearningGraph, DailyReport } from "@/types";
import { Card } from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import SubjectBadge from "@/components/ui/SubjectBadge";
import Button from "@/components/ui/Button";

export default function ParentPage() {
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [graph, setGraph] = useState<LearningGraph | null>(null);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [voiceSummary, setVoiceSummary] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    const c = mockStore.getCurrentChild();
    if (!c) { router.push("/onboarding"); return; }
    setChild(c);
    const g = mockStore.getLearningGraph(c.id);
    setGraph(g);
    const today = getTodayString();
    const saved = mockStore.getDailyReport(c.id, today);
    if (saved) {
      setReport(saved);
    }
  }, [router]);

  async function generateReport() {
    if (!child || !graph) return;
    setGeneratingReport(true);
    const subjectEntries = Object.entries(graph.subjects);
    const result = await generateDailyReport({
      studyMinutes: Math.floor(graph.totalStudyMinutes),
      homeworkCompleted: subjectEntries
        .filter(([, s]) => s.homeworkCompleted > 0)
        .map(([name]) => name),
      topicsLearned: subjectEntries.flatMap(([, s]) => s.strongTopics).slice(0, 3),
      strongAreas: subjectEntries.filter(([, s]) => s.masteryPercent >= 75).map(([name]) => name),
      weakAreas: subjectEntries.filter(([, s]) => s.masteryPercent < 60).map(([name]) => name),
    });
    const today = getTodayString();
    const dailyReport: DailyReport = {
      childId: child.id,
      date: today,
      studyMinutes: graph.totalStudyMinutes,
      homeworkCompleted: subjectEntries.filter(([, s]) => s.homeworkCompleted > 0).map(([n]) => n),
      subjectsStudied: subjectEntries.map(([n]) => n),
      topicsLearned: subjectEntries.flatMap(([, s]) => s.strongTopics).slice(0, 3),
      strongAreas: subjectEntries.filter(([, s]) => s.masteryPercent >= 75).map(([n]) => n),
      weakAreas: subjectEntries.filter(([, s]) => s.masteryPercent < 60).map(([n]) => n),
      tomorrowFocus: subjectEntries.filter(([, s]) => s.masteryPercent < 60).map(([n]) => `${n}: 10 minute revision`),
    };
    mockStore.saveDailyReport(dailyReport);
    setReport(dailyReport);
    setVoiceSummary(result.voiceSummary);
    setGeneratingReport(false);
  }

  function speakReport() {
    if (!voiceSummary || typeof window === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(voiceSummary);
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  if (!child || !graph) return null;

  const subjectEntries = Object.entries(graph.subjects);
  const consistency = graph.streak > 0 ? Math.min(100, graph.streak * 14) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-linear-to-br from-violet-600 to-indigo-600 text-white px-4 pt-10 pb-16">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <button onClick={() => router.push("/dashboard")} className="text-violet-200 text-sm">← Student View</button>
          </div>
          <h1 className="text-2xl font-bold mt-2">Parent Dashboard</h1>
          <p className="text-violet-200 text-sm">{child.name} · Grade {child.grade} · {child.board}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8 pb-24 space-y-4">
        {/* Voice Report Card */}
        <Card className="border-0 shadow-lg">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-2xl">🎙️</div>
            <div>
              <h2 className="font-bold text-gray-900">Today's Voice Report</h2>
              <p className="text-gray-500 text-sm">Tap to hear a summary in plain language</p>
            </div>
          </div>

          {voiceSummary && (
            <div className="bg-violet-50 rounded-xl p-3 mb-3 text-sm text-violet-800 italic">
              "{voiceSummary}"
            </div>
          )}

          <div className="flex gap-2">
            {!report ? (
              <Button fullWidth onClick={generateReport} loading={generatingReport}>
                Generate Today's Report
              </Button>
            ) : speaking ? (
              <Button fullWidth variant="danger" onClick={stopSpeaking}>
                ⏹ Stop
              </Button>
            ) : (
              <>
                <Button fullWidth onClick={speakReport} disabled={!voiceSummary}>
                  ▶ Play Report
                </Button>
                <Button variant="secondary" onClick={generateReport} loading={generatingReport}>
                  Refresh
                </Button>
              </>
            )}
          </div>

          {!voiceSummary && report && (
            <Button fullWidth variant="secondary" className="mt-2" onClick={generateReport} loading={generatingReport}>
              Generate Voice Summary
            </Button>
          )}
        </Card>

        {/* Today's Summary */}
        {report && (
          <Card>
            <h3 className="font-semibold text-gray-800 mb-3">Today</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatBox icon="⏱️" label="Study Time" value={formatStudyTime(report.studyMinutes)} />
              <StatBox icon="📝" label="Homework Done" value={`${report.homeworkCompleted.length} subjects`} />
              <StatBox icon="📚" label="Topics Learned" value={`${report.topicsLearned.length} topics`} />
              <StatBox icon="🔥" label="Day Streak" value={`${graph.streak} days`} />
            </div>

            {report.strongAreas.length > 0 && (
              <div className="mt-3 p-3 bg-emerald-50 rounded-xl">
                <p className="text-xs font-medium text-emerald-700 mb-1">Strong In</p>
                <div className="flex flex-wrap gap-1">
                  {report.strongAreas.map((a) => <SubjectBadge key={a} subject={a} />)}
                </div>
              </div>
            )}

            {report.weakAreas.length > 0 && (
              <div className="mt-3 p-3 bg-rose-50 rounded-xl">
                <p className="text-xs font-medium text-rose-700 mb-1">Needs Practice</p>
                <div className="flex flex-wrap gap-1">
                  {report.weakAreas.map((a) => <SubjectBadge key={a} subject={a} />)}
                </div>
              </div>
            )}

            {report.tomorrowFocus.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs font-medium text-blue-700 mb-1">Tomorrow — Focus on</p>
                {report.tomorrowFocus.map((f, i) => (
                  <p key={i} className="text-xs text-blue-600">• {f}</p>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Subject Performance */}
        {subjectEntries.length > 0 && (
          <Card>
            <h3 className="font-semibold text-gray-800 mb-3">Subject Performance</h3>
            <div className="space-y-4">
              {subjectEntries.map(([name, s]) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <SubjectBadge subject={name} />
                    <span className={`text-sm font-bold ${getMasteryColor(s.masteryPercent)}`}>
                      {s.masteryPercent}%
                    </span>
                  </div>
                  <ProgressBar value={s.masteryPercent} colorByValue />
                  {s.weakTopics.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Weak: {s.weakTopics.slice(0, 2).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Weekly consistency */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">Weekly Consistency</h3>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1">
              <ProgressBar value={consistency} color="bg-violet-500" />
            </div>
            <span className="text-sm font-bold text-gray-700">{consistency}%</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 7 }, (_, i) => {
              const active = i < graph.streak;
              return (
                <div key={i} className={`flex-1 h-8 rounded-lg ${active ? "bg-violet-500" : "bg-gray-100"}`} />
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">Mon</span>
            <span className="text-xs text-gray-400">Sun</span>
          </div>
        </Card>

        {/* Total study time */}
        <Card className="bg-indigo-50 border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="text-3xl">📊</div>
            <div>
              <p className="font-semibold text-indigo-800">
                {formatStudyTime(graph.totalStudyMinutes)} total study time
              </p>
              <p className="text-indigo-500 text-sm">
                {graph.streak > 0 ? `${graph.streak}-day streak — keep it going!` : "Start a study session today"}
              </p>
            </div>
          </div>
        </Card>

        {/* Switch child view */}
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2"
        >
          Switch to {child.name}'s view →
        </button>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-bold text-gray-800 text-sm mt-0.5">{value}</div>
    </div>
  );
}
