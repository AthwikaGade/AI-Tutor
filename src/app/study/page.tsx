"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mockStore } from "@/lib/mock-store";
import { solveDroubt, generateQuiz, generateStudyPlan } from "@/lib/ai-mock";
import { getGradeTier, getDaysUntil } from "@/lib/utils";
import type { Child, LearningGraph, QuizQuestion, Exam } from "@/types";
import TutorAvatar from "@/components/ui/TutorAvatar";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import SubjectBadge from "@/components/ui/SubjectBadge";
import ProgressBar from "@/components/ui/ProgressBar";

type StudyMode = "menu" | "doubt" | "test" | "exam" | "weak" | "custom";

function StudyPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [child, setChild] = useState<Child | null>(null);
  const [graph, setGraph] = useState<LearningGraph | null>(null);
  const [mode, setMode] = useState<StudyMode>("menu");

  useEffect(() => {
    const c = mockStore.getCurrentChild();
    if (!c) { router.push("/onboarding"); return; }
    setChild(c);
    setGraph(mockStore.getLearningGraph(c.id));
    const m = params.get("mode") as StudyMode | null;
    if (m) setMode(m);
  }, [router, params]);

  if (!child || !graph) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => mode === "menu" ? router.push("/dashboard") : setMode("menu")} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <h1 className="font-bold text-gray-900">
          {mode === "menu" && "Study"}
          {mode === "doubt" && "Ask a Doubt"}
          {mode === "test" && "Practice Test"}
          {mode === "exam" && "Exam Prep"}
          {mode === "weak" && "Focus: Weak Areas"}
          {mode === "custom" && "Custom Session"}
        </h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {mode === "menu" && <StudyMenu child={child} graph={graph} onSelect={setMode} />}
        {mode === "doubt" && <DoubtSolver child={child} graph={graph} />}
        {mode === "test" && <QuizMode child={child} graph={graph} subjectParam={params.get("subject") || ""} />}
        {mode === "exam" && <ExamMode child={child} graph={graph} />}
        {mode === "weak" && <WeakAreaMode child={child} graph={graph} subjectParam={params.get("subject") || ""} />}
        {mode === "custom" && <CustomSession child={child} />}
      </div>
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense>
      <StudyPageInner />
    </Suspense>
  );
}

// ─── Study Menu ───────────────────────────────────────────────────────────────
function StudyMenu({ child, graph, onSelect }: { child: Child; graph: LearningGraph; onSelect: (m: StudyMode) => void }) {
  const weakSubjects = Object.entries(graph.subjects)
    .filter(([, s]) => s.masteryPercent < 60)
    .sort((a, b) => a[1].masteryPercent - b[1].masteryPercent);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {[
          { id: "doubt" as StudyMode, icon: "🙋", title: "Ask a Doubt", desc: "Get help on any topic instantly" },
          { id: "test" as StudyMode, icon: "✏️", title: "Practice Test", desc: "Quiz yourself on any subject" },
          { id: "exam" as StudyMode, icon: "🎯", title: "Exam Preparation", desc: "Study plan for upcoming exams" },
          { id: "weak" as StudyMode, icon: "💪", title: "Weak Area Focus", desc: weakSubjects.length > 0 ? `${weakSubjects[0][0]} needs most attention` : "All areas looking good!" },
          { id: "custom" as StudyMode, icon: "⏱️", title: "Custom Session", desc: "Set time and pick subjects" },
        ].map((item) => (
          <button key={item.id} onClick={() => onSelect(item.id)} className="w-full text-left">
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl">{item.icon}</div>
                <div>
                  <div className="font-semibold text-gray-800">{item.title}</div>
                  <div className="text-gray-400 text-sm">{item.desc}</div>
                </div>
                <span className="ml-auto text-gray-300">→</span>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Doubt Solver ─────────────────────────────────────────────────────────────
interface DoubtMsg { role: "student" | "tutor"; content: string }

function DoubtSolver({ child, graph }: { child: Child; graph: LearningGraph }) {
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState(child.subjects[0] || "Mathematics");
  const [messages, setMessages] = useState<DoubtMsg[]>([
    { role: "tutor", content: `Hi ${child.name}! What's your doubt? You can ask me anything about ${child.subjects.join(", ")} — or type a question from your textbook.` }
  ]);
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function handleAsk() {
    if (!question.trim()) return;
    const q = question.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { role: "student", content: q }]);
    setLoading(true);
    const tier = getGradeTier(child.grade);
    const result = await solveDroubt(q, subject, tier);
    setLoading(false);
    setMessages((prev) => [
      ...prev,
      { role: "tutor", content: `${result.explanation}\n\n${result.example}\n\n${result.verificationQuestion}` }
    ]);
    mockStore.addStudyTime(child.id, 5);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Subject selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {child.subjects.map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              subject === s ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "student" ? "flex-row-reverse" : ""}`}>
            {m.role === "tutor" && <TutorAvatar size="sm" />}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
              m.role === "tutor" ? "bg-white border border-gray-100 shadow-sm text-gray-800" : "bg-indigo-600 text-white"
            }`}>
              {m.content}
            </div>
            {m.role === "student" && (
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
                {child.name[0]}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <TutorAvatar size="sm" speaking />
            <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl flex gap-1.5">
              {[0,1,2].map((i) => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 pt-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask your doubt..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button onClick={handleAsk} disabled={!question.trim() || loading}>→</Button>
        </div>
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {["What is...", "How do I solve...", "Explain...", "My teacher explains it differently"].map((s) => (
            <button key={s} onClick={() => setQuestion(s)} className="shrink-0 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Quiz Mode ────────────────────────────────────────────────────────────────
function QuizMode({ child, graph, subjectParam }: { child: Child; graph: LearningGraph; subjectParam: string }) {
  const [subject, setSubject] = useState(subjectParam || child.subjects[0] || "Mathematics");
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function startQuiz() {
    setLoading(true);
    const tier = getGradeTier(child.grade);
    const subjectData = graph.subjects[subject];
    const topic = subjectData?.weakTopics[0] || subject;
    const questions = await generateQuiz(topic, subject, tier, 5);
    setQuiz(questions);
    setCurrent(0);
    setSelected(null);
    setResults([]);
    setDone(false);
    setLoading(false);
    mockStore.addStudyTime(child.id, 10);
  }

  function handleAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    const q = quiz![current];
    const correct = idx === q.correctIndex;
    setTimeout(() => {
      const newResults = [...results, correct];
      setResults(newResults);
      if (current + 1 >= quiz!.length) {
        setDone(true);
      } else {
        setCurrent(current + 1);
        setSelected(null);
      }
    }, 1200);
  }

  if (!quiz) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <div className="text-5xl mb-3">✏️</div>
          <h2 className="font-bold text-gray-900 text-xl">Practice Test</h2>
          <p className="text-gray-500 text-sm mt-1">5 questions · ~5 minutes</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <div className="flex flex-wrap gap-2">
            {child.subjects.map((s) => (
              <button key={s} onClick={() => setSubject(s)} className={`px-4 py-2 rounded-xl text-sm border font-medium transition-all ${
                subject === s ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-200 text-gray-600"
              }`}>{s}</button>
            ))}
          </div>
        </div>
        <Button fullWidth size="lg" onClick={startQuiz} loading={loading}>
          Start Quiz →
        </Button>
      </div>
    );
  }

  if (done) {
    const score = results.filter(Boolean).length;
    const pct = Math.round((score / quiz.length) * 100);
    return (
      <div className="space-y-4 text-center">
        <div className="py-6">
          <div className="text-6xl mb-3">{pct >= 80 ? "🌟" : pct >= 60 ? "👍" : "💪"}</div>
          <h2 className="font-bold text-2xl text-gray-900">{score}/{quiz.length} Correct</h2>
          <p className="text-gray-500 mt-1">{pct >= 80 ? "Excellent work!" : pct >= 60 ? "Good effort — keep practicing!" : "Keep going — practice makes perfect!"}</p>
        </div>
        <div className="w-32 mx-auto">
          <ProgressBar value={pct} colorByValue showLabel />
        </div>
        <div className="space-y-2 text-left">
          {quiz.map((q, i) => (
            <div key={q.id} className={`p-3 rounded-xl text-sm ${results[i] ? "bg-emerald-50 border border-emerald-100" : "bg-rose-50 border border-rose-100"}`}>
              <p className="font-medium text-gray-800">{q.question}</p>
              <p className="text-xs text-gray-500 mt-1">{q.explanation}</p>
            </div>
          ))}
        </div>
        <Button fullWidth onClick={startQuiz}>Try Again</Button>
      </div>
    );
  }

  const q = quiz[current];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SubjectBadge subject={subject} />
        <span className="text-sm text-gray-500">{current + 1} / {quiz.length}</span>
      </div>
      <ProgressBar value={(current / quiz.length) * 100} size="sm" />
      <Card>
        <p className="font-semibold text-gray-900 text-base leading-relaxed">{q.question}</p>
      </Card>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let cls = "border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50";
          if (selected !== null) {
            if (i === q.correctIndex) cls = "border-emerald-500 bg-emerald-50 text-emerald-700";
            else if (i === selected) cls = "border-rose-500 bg-rose-50 text-rose-700";
            else cls = "border-gray-100 text-gray-400";
          }
          return (
            <button key={i} onClick={() => handleAnswer(i)} className={`w-full text-left p-4 rounded-xl border-2 transition-all text-sm font-medium ${cls}`}>
              <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <Card className="bg-blue-50 border-blue-100">
          <p className="text-sm text-blue-800">{q.explanation}</p>
        </Card>
      )}
    </div>
  );
}

// ─── Exam Mode ────────────────────────────────────────────────────────────────
function ExamMode({ child, graph }: { child: Child; graph: LearningGraph }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [adding, setAdding] = useState(false);
  const [examName, setExamName] = useState("");
  const [examSubject, setExamSubject] = useState(child.subjects[0] || "");
  const [examDate, setExamDate] = useState("");
  const [plan, setPlan] = useState<{ plan: string[]; readinessScore: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setExams(mockStore.getExams(child.id));
  }, [child.id]);

  async function handleAddExam() {
    if (!examName || !examDate) return;
    setLoading(true);
    const subjectData = graph.subjects[examSubject];
    const weakTopics = subjectData?.weakTopics || [examSubject];
    const daysLeft = getDaysUntil(examDate);
    const result = await generateStudyPlan(examSubject, daysLeft, weakTopics);
    const exam = mockStore.addExam({
      childId: child.id,
      name: examName,
      subject: examSubject,
      examDate,
      readinessScore: result.readinessScore,
      studyPlan: result.plan.map((p, i) => ({
        date: new Date(Date.now() + i * 86400000).toISOString().split("T")[0],
        topics: [p],
        durationMinutes: 20,
        completed: false,
      })),
    });
    setPlan(result);
    setExams(mockStore.getExams(child.id));
    setAdding(false);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {exams.length === 0 && !adding && (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">🎯</div>
          <h2 className="font-bold text-gray-900 text-xl">Exam Preparation</h2>
          <p className="text-gray-500 text-sm mt-1">Add an upcoming exam to get a personalized study plan</p>
        </div>
      )}

      {exams.map((exam) => {
        const days = getDaysUntil(exam.examDate);
        return (
          <Card key={exam.id}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">{exam.name}</h3>
                <SubjectBadge subject={exam.subject} className="mt-1" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600">{days}d</div>
                <div className="text-xs text-gray-400">remaining</div>
              </div>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Readiness</span>
                <span className="font-semibold text-gray-800">{exam.readinessScore}%</span>
              </div>
              <ProgressBar value={exam.readinessScore} colorByValue />
            </div>
            <div className="space-y-1">
              {exam.studyPlan.slice(0, 3).map((day, i) => (
                <div key={i} className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  {day.topics[0]}
                </div>
              ))}
              {exam.studyPlan.length > 3 && (
                <div className="text-xs text-gray-400 text-center">+{exam.studyPlan.length - 3} more days</div>
              )}
            </div>
          </Card>
        );
      })}

      {plan && (
        <Card className="bg-emerald-50 border-emerald-100">
          <p className="font-semibold text-emerald-800 text-sm">Study plan created! Current readiness: {plan.readinessScore}%</p>
        </Card>
      )}

      {adding ? (
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Add Exam</h3>
          <div className="space-y-3">
            <input type="text" placeholder="Exam name (e.g. Unit Test 2)" value={examName} onChange={(e) => setExamName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={examSubject} onChange={(e) => setExamSubject(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {child.subjects.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="flex gap-2">
              <Button fullWidth onClick={handleAddExam} loading={loading}>Generate Study Plan</Button>
              <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button fullWidth variant="secondary" onClick={() => setAdding(true)}>+ Add Exam</Button>
      )}
    </div>
  );
}

// ─── Weak Area Mode ───────────────────────────────────────────────────────────
function WeakAreaMode({ child, graph, subjectParam }: { child: Child; graph: LearningGraph; subjectParam: string }) {
  const weakSubjects = Object.entries(graph.subjects)
    .filter(([, s]) => s.masteryPercent < 70)
    .sort((a, b) => a[1].masteryPercent - b[1].masteryPercent);

  const [selectedSubject, setSelectedSubject] = useState(subjectParam || weakSubjects[0]?.[0] || child.subjects[0]);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function startFocused() {
    setLoading(true);
    const tier = getGradeTier(child.grade);
    const subjectData = graph.subjects[selectedSubject];
    const topic = subjectData?.weakTopics[0] || selectedSubject;
    const questions = await generateQuiz(topic, selectedSubject, tier, 5);
    setQuiz(questions);
    setLoading(false);
    mockStore.addStudyTime(child.id, 10);
  }

  if (weakSubjects.length === 0) {
    return (
      <Card className="text-center py-8">
        <div className="text-5xl mb-3">🌟</div>
        <h3 className="font-bold text-gray-900">All Areas Looking Strong!</h3>
        <p className="text-gray-500 text-sm mt-1">Keep up the great work. Try a practice test to maintain your score.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-rose-50 border-rose-100">
        <h3 className="font-semibold text-rose-800 mb-2">Areas to Work On</h3>
        {weakSubjects.map(([name, s]) => (
          <button key={name} onClick={() => setSelectedSubject(name)} className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all ${selectedSubject === name ? "bg-rose-200" : "bg-rose-100 hover:bg-rose-150"}`}>
            <SubjectBadge subject={name} />
            <div className="flex-1 text-left">
              <div className="text-xs text-gray-600">{s.weakTopics.slice(0, 2).join(", ") || "General"}</div>
              <ProgressBar value={s.masteryPercent} colorByValue size="sm" className="mt-1" />
            </div>
            <span className="text-rose-600 text-xs font-bold">{s.masteryPercent}%</span>
          </button>
        ))}
      </Card>

      {!quiz && (
        <Button fullWidth size="lg" onClick={startFocused} loading={loading}>
          Start {selectedSubject} Practice →
        </Button>
      )}

      {quiz && (
        <QuizMode child={child} graph={graph} subjectParam={selectedSubject} />
      )}
    </div>
  );
}

// ─── Custom Session ───────────────────────────────────────────────────────────
function CustomSession({ child }: { child: Child }) {
  const [totalMinutes, setTotalMinutes] = useState(60);
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const base = Math.floor(60 / child.subjects.length);
    return Object.fromEntries(child.subjects.map((s) => [s, base]));
  });
  const [started, setStarted] = useState(false);
  const [currentSubjectIdx, setCurrentSubjectIdx] = useState(0);
  const [timer, setTimer] = useState(0);

  const total = Object.values(allocations).reduce((a, b) => a + b, 0);
  const subjectsWithTime = child.subjects.filter((s) => allocations[s] > 0);

  function adjust(subject: string, delta: number) {
    setAllocations((prev) => ({
      ...prev,
      [subject]: Math.max(0, (prev[subject] || 0) + delta),
    }));
  }

  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, [started]);

  if (!started) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-5xl mb-2">⏱️</div>
          <h2 className="font-bold text-gray-900 text-xl">Custom Study Session</h2>
          <p className="text-gray-500 text-sm">Set how long to study each subject</p>
        </div>
        <Card>
          <div className="space-y-3">
            {child.subjects.map((s) => (
              <div key={s} className="flex items-center gap-3">
                <SubjectBadge subject={s} className="w-32 justify-start" />
                <button onClick={() => adjust(s, -5)} className="w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold">−</button>
                <div className="flex-1 text-center font-semibold text-gray-800">{allocations[s] || 0} min</div>
                <button onClick={() => adjust(s, 5)} className="w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold">+</button>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-gray-800">{total} minutes</span>
          </div>
        </Card>
        <Button fullWidth size="lg" onClick={() => setStarted(true)} disabled={total === 0}>
          Start Session →
        </Button>
      </div>
    );
  }

  const currentSubject = subjectsWithTime[currentSubjectIdx];
  const allocated = allocations[currentSubject] || 0;

  return (
    <div className="space-y-4">
      <Card className="bg-indigo-50 border-indigo-100 text-center">
        <div className="text-xs text-indigo-500 font-medium">Now studying</div>
        <SubjectBadge subject={currentSubject} className="mx-auto mt-1" />
        <div className="text-4xl font-bold text-indigo-700 mt-2">{timer}/{allocated}</div>
        <div className="text-xs text-indigo-400">minutes elapsed</div>
      </Card>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {subjectsWithTime.map((s, i) => (
          <div key={s} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${i === currentSubjectIdx ? "bg-indigo-600 text-white" : i < currentSubjectIdx ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
            {i < currentSubjectIdx ? "✓ " : ""}{s}
          </div>
        ))}
      </div>
      {currentSubjectIdx < subjectsWithTime.length - 1 && (
        <Button fullWidth variant="secondary" onClick={() => setCurrentSubjectIdx((i) => i + 1)}>
          Switch to {subjectsWithTime[currentSubjectIdx + 1]} →
        </Button>
      )}
      {currentSubjectIdx === subjectsWithTime.length - 1 && (
        <Button fullWidth onClick={() => { mockStore.addStudyTime(child.id, total); }}>
          Complete Session ✓
        </Button>
      )}
    </div>
  );
}
