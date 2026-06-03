"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mockStore } from "@/lib/mock-store";
import { simulateOCR } from "@/lib/ai-mock";
import type { Child, HomeworkSession, HomeworkQuestion } from "@/types";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import SubjectBadge from "@/components/ui/SubjectBadge";
import TutorAvatar from "@/components/ui/TutorAvatar";

type UploadMode = "choose" | "photo" | "text" | "voice" | "processing" | "ready";

export default function HomeworkPage() {
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [mode, setMode] = useState<UploadMode>("choose");
  const [textInput, setTextInput] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic] = useState("Fractions");
  const [processing, setProcessing] = useState(false);
  const [ocrFailed, setOcrFailed] = useState(false);
  const [pending, setPending] = useState<HomeworkSession[]>([]);

  useEffect(() => {
    const c = mockStore.getCurrentChild();
    if (!c) { router.push("/onboarding"); return; }
    setChild(c);
    setPending(mockStore.getPendingHomework(c.id));
  }, [router]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setMode("processing");
    setProcessing(true);
    const result = await simulateOCR("uploaded image");
    setProcessing(false);
    if (result.success) {
      setQuestions(result.questions);
      setSubject(result.subject);
      setTopic(result.topic);
      setMode("ready");
      setOcrFailed(false);
    } else {
      setOcrFailed(true);
      setMode("text"); // graceful fallback
    }
  }

  function handleTextSubmit() {
    const lines = textInput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 3);
    if (lines.length === 0) return;
    setQuestions(lines);
    setMode("ready");
  }

  function handleVoiceDemo() {
    // Simulate voice input converting to text
    setTextInput("What is 1/2 + 1/4?\nSimplify 6/8.\nWhich is greater: 3/5 or 2/4?");
    setMode("text");
  }

  function startSession() {
    if (!child || questions.length === 0) return;
    const session: HomeworkSession = {
      id: `hw_${Date.now()}`,
      childId: child.id,
      subject,
      topic,
      questions: questions.map((q, i): HomeworkQuestion => ({
        id: `q${i}`,
        text: q,
        status: "pending",
        hintsGiven: 0,
      })),
      status: "in_progress",
      uploadType: mode === "photo" ? "photo" : "text",
      createdAt: Date.now(),
    };
    mockStore.saveHomeworkSession(session);
    router.push(`/homework/${session.id}`);
  }

  if (!child) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <h1 className="font-bold text-gray-900">Homework</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Pending sessions */}
        {pending.length > 0 && (
          <Card>
            <h3 className="font-semibold text-gray-800 mb-3">In Progress</h3>
            <div className="space-y-2">
              {pending.map((hw) => (
                <button
                  key={hw.id}
                  onClick={() => router.push(`/homework/${hw.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors text-left"
                >
                  <SubjectBadge subject={hw.subject} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{hw.topic}</div>
                    <div className="text-xs text-gray-500">
                      {hw.questions.filter((q) => q.status === "completed").length}/{hw.questions.length} questions done
                    </div>
                  </div>
                  <span className="text-indigo-500">→</span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Upload UI */}
        {mode === "choose" && (
          <UploadChoiceScreen
            onPhoto={() => setMode("photo")}
            onText={() => setMode("text")}
            onVoice={handleVoiceDemo}
          />
        )}

        {mode === "photo" && (
          <PhotoUploadScreen
            onFile={handlePhotoUpload}
            onFallback={() => setMode("text")}
          />
        )}

        {mode === "processing" && (
          <ProcessingScreen />
        )}

        {mode === "text" && (
          <TextInputScreen
            value={textInput}
            ocrFailed={ocrFailed}
            subject={subject}
            child={child}
            onSubjectChange={setSubject}
            onChange={setTextInput}
            onSubmit={handleTextSubmit}
          />
        )}

        {mode === "ready" && (
          <ReadyScreen
            questions={questions}
            subject={subject}
            topic={topic}
            onStart={startSession}
            onBack={() => setMode("choose")}
          />
        )}

        {mode !== "choose" && mode !== "processing" && (
          <button
            onClick={() => setMode("choose")}
            className="w-full text-sm text-gray-400 hover:text-gray-600"
          >
            ← Start over
          </button>
        )}
      </div>
    </div>
  );
}

function UploadChoiceScreen({ onPhoto, onText, onVoice }: { onPhoto: () => void; onText: () => void; onVoice: () => void }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <TutorAvatar size="lg" className="mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900">Upload Homework</h2>
        <p className="text-gray-500 text-sm mt-1">Choose how you want to share it</p>
      </div>

      <button onClick={onPhoto} className="w-full">
        <Card className="hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📷</div>
            <div>
              <div className="font-semibold text-gray-800">Take a Photo</div>
              <div className="text-gray-400 text-sm">Best for printed worksheets</div>
            </div>
          </div>
        </Card>
      </button>

      <button onClick={onText} className="w-full">
        <Card className="hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">⌨️</div>
            <div>
              <div className="font-semibold text-gray-800">Type Questions</div>
              <div className="text-gray-400 text-sm">Type or paste from computer</div>
            </div>
          </div>
        </Card>
      </button>

      <button onClick={onVoice} className="w-full">
        <Card className="hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">🎙️</div>
            <div>
              <div className="font-semibold text-gray-800">Say it Out Loud</div>
              <div className="text-gray-400 text-sm">Read your question aloud</div>
            </div>
          </div>
        </Card>
      </button>
    </div>
  );
}

function PhotoUploadScreen({ onFile, onFallback }: { onFile: (e: React.ChangeEvent<HTMLInputElement>) => void; onFallback: () => void }) {
  return (
    <Card>
      <div className="text-center py-8 space-y-4">
        <div className="text-5xl">📷</div>
        <h3 className="font-bold text-gray-800">Take a Photo of Your Homework</h3>
        <p className="text-gray-500 text-sm">Make sure the image is clear and well-lit</p>
        <label className="block">
          <span className="sr-only">Upload image</span>
          <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" id="hw-upload" />
          <label
            htmlFor="hw-upload"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-colors"
          >
            📷 Take Photo / Upload
          </label>
        </label>
        <button onClick={onFallback} className="block mx-auto text-sm text-gray-400 hover:text-gray-600">
          Can't take a photo? Type instead →
        </button>
      </div>
    </Card>
  );
}

function ProcessingScreen() {
  return (
    <Card>
      <div className="text-center py-12 space-y-4">
        <div className="text-5xl animate-bounce">🔍</div>
        <h3 className="font-bold text-gray-800">Reading Your Homework...</h3>
        <p className="text-gray-500 text-sm">Just a moment</p>
        <div className="flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </Card>
  );
}

function TextInputScreen({
  value, ocrFailed, subject, child, onSubjectChange, onChange, onSubmit
}: {
  value: string;
  ocrFailed: boolean;
  subject: string;
  child: Child;
  onSubjectChange: (s: string) => void;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Card>
      <div className="space-y-4">
        {ocrFailed && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
            I couldn't read the photo clearly. Please type or paste your questions below.
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
          <select
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {child.subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Type your questions <span className="text-gray-400 font-normal">(one per line)</span>
          </label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={"What is 1/2 + 1/4?\nSimplify 6/8.\nWhich is greater: 3/5 or 2/4?"}
            rows={6}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        <Button fullWidth onClick={onSubmit} disabled={!value.trim()}>
          Continue →
        </Button>
      </div>
    </Card>
  );
}

function ReadyScreen({ questions, subject, topic, onStart, onBack }: {
  questions: string[];
  subject: string;
  topic: string;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="bg-indigo-50 border-indigo-100">
        <div className="flex items-center gap-3">
          <TutorAvatar size="sm" />
          <div>
            <p className="font-semibold text-indigo-800 text-sm">{subject} · {topic}</p>
            <p className="text-indigo-600 text-xs">{questions.length} questions · ~{questions.length * 3} min</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-gray-800 mb-3">Questions Found</h3>
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={i} className="flex gap-3 text-sm text-gray-700">
              <span className="font-bold text-indigo-500 shrink-0">{i + 1}.</span>
              <span>{q}</span>
            </div>
          ))}
        </div>
      </Card>

      <Button fullWidth size="lg" onClick={onStart}>
        Start with Tutor →
      </Button>
      <button onClick={onBack} className="w-full text-sm text-gray-400 hover:text-gray-600">
        Edit questions
      </button>
    </div>
  );
}
