"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { mockStore } from "@/lib/mock-store";
import { getTutorResponse, verifyAnswer } from "@/lib/ai-mock";
import { getGradeTier } from "@/lib/utils";
import type { Child, HomeworkSession, HomeworkQuestion, Message } from "@/types";
import TutorAvatar from "@/components/ui/TutorAvatar";
import Button from "@/components/ui/Button";
import SubjectBadge from "@/components/ui/SubjectBadge";
import { Card } from "@/components/ui/Card";

export default function HomeworkSessionPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [child, setChild] = useState<Child | null>(null);
  const [session, setSession] = useState<HomeworkSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [input, setInput] = useState("");
  const [tutorTyping, setTutorTyping] = useState(false);
  const [showTeacherMethod, setShowTeacherMethod] = useState(false);
  const [teacherMethod, setTeacherMethod] = useState("");
  const [sessionComplete, setSessionComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = mockStore.getCurrentChild();
    if (!c) { router.push("/onboarding"); return; }
    setChild(c);
    const sessions = mockStore.getHomeworkSessions(c.id);
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) { router.push("/homework"); return; }
    setSession(s);
    // Start with tutor greeting for first question
    const firstQ = s.questions[0];
    if (firstQ) {
      sendTutorGreeting(c, s, firstQ, 0);
    }
  }, [sessionId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tutorTyping]);

  async function sendTutorGreeting(c: Child, s: HomeworkSession, q: HomeworkQuestion, qIdx: number) {
    setTutorTyping(true);
    const tier = getGradeTier(c.grade);
    const response = await getTutorResponse(
      q.text, "starting", 0, tier, s.subject, s.topic
    );
    setTutorTyping(false);
    addMessage("tutor", `Let's work on Question ${qIdx + 1}: "${q.text}"\n\n${response.content}`, response.type);
  }

  function addMessage(role: Message["role"], content: string, type?: Message["type"]) {
    setMessages((prev) => [
      ...prev,
      { id: `m_${Date.now()}_${Math.random()}`, role, content, timestamp: Date.now(), type },
    ]);
  }

  async function handleSend() {
    if (!input.trim() || !child || !session) return;
    const q = session.questions[currentQIndex];
    const userMsg = input.trim();
    setInput("");
    addMessage("student", userMsg);

    // Check if they submitted an answer attempt
    const looksLikeAnswer = /^\d|^[a-zA-Z]{1,3}$|^\d+\/\d+/.test(userMsg) || userMsg.length < 50;

    if (looksLikeAnswer) {
      setTutorTyping(true);
      const tier = getGradeTier(child.grade);
      const result = await verifyAnswer(q.text, userMsg, tier);
      setTutorTyping(false);

      if (result.correct) {
        addMessage("tutor", result.feedback, "praise");
        // Mark question complete
        const updatedSession: HomeworkSession = {
          ...session,
          questions: session.questions.map((sq, i) =>
            i === currentQIndex ? { ...sq, status: "completed", studentAnswer: userMsg, correct: true } : sq
          ),
        };
        setSession(updatedSession);
        mockStore.saveHomeworkSession(updatedSession);
        mockStore.addStudyTime(child.id, 3);

        // Advance to next question
        setTimeout(() => {
          const nextIdx = currentQIndex + 1;
          if (nextIdx >= session.questions.length) {
            finishSession(updatedSession);
          } else {
            setCurrentQIndex(nextIdx);
            sendTutorGreeting(child, updatedSession, updatedSession.questions[nextIdx], nextIdx);
          }
        }, 1500);
      } else {
        addMessage("tutor", result.feedback, "correction");
        // Give another hint
        setTimeout(() => askForHint(q, child, session), 1000);
      }
    } else {
      // Conversational — give guidance
      setTutorTyping(true);
      const tier = getGradeTier(child.grade);
      const hintsGiven = q.hintsGiven;
      const response = await getTutorResponse(
        q.text, userMsg, hintsGiven, tier, session.subject, session.topic,
        teacherMethod || undefined
      );
      // Update hints count
      const updatedSession: HomeworkSession = {
        ...session,
        questions: session.questions.map((sq, i) =>
          i === currentQIndex ? { ...sq, hintsGiven: sq.hintsGiven + 1, status: "in_progress" } : sq
        ),
      };
      setSession(updatedSession);
      mockStore.saveHomeworkSession(updatedSession);
      setTutorTyping(false);
      addMessage("tutor", response.content, response.type);
    }
  }

  async function askForHint(q: HomeworkQuestion, c: Child, s: HomeworkSession) {
    setTutorTyping(true);
    const tier = getGradeTier(c.grade);
    const response = await getTutorResponse(
      q.text, "confused", q.hintsGiven + 1, tier, s.subject, s.topic, teacherMethod || undefined
    );
    setTutorTyping(false);
    addMessage("tutor", response.content, "hint");
  }

  function finishSession(s: HomeworkSession) {
    const completed: HomeworkSession = { ...s, status: "completed", completedAt: Date.now() };
    mockStore.saveHomeworkSession(completed);
    setSessionComplete(true);
    addMessage("tutor", completionMessage(child!.grade, s), "praise");
  }

  function completionMessage(grade: number, s: HomeworkSession): string {
    const tier = getGradeTier(grade);
    if (tier === "primary") return `Amazing work! 🌟 You finished ALL your ${s.subject} homework! You should be really proud of yourself. I've told your parent too!`;
    if (tier === "middle") return `Great job completing your ${s.subject} homework! You worked through all ${s.questions.length} questions. Your understanding of ${s.topic} has improved today.`;
    return `Homework complete. You answered ${s.questions.filter((q) => q.correct).length}/${s.questions.length} correctly. Review the ones you found difficult before your next class.`;
  }

  const progress = session
    ? (session.questions.filter((q) => q.status === "completed").length / session.questions.length) * 100
    : 0;

  if (!child || !session) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.push("/homework")} className="text-gray-400 hover:text-gray-600">←</button>
        <SubjectBadge subject={session.subject} />
        <div className="flex-1">
          <div className="text-xs text-gray-500">
            Question {Math.min(currentQIndex + 1, session.questions.length)} of {session.questions.length}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => setShowTeacherMethod(!showTeacherMethod)}
          className="text-xs text-gray-400 hover:text-indigo-600 border border-gray-200 rounded-lg px-2 py-1"
          title="My teacher explains it differently"
        >
          📐 Method
        </button>
      </div>

      {/* Teacher method override */}
      {showTeacherMethod && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-3">
          <p className="text-xs font-medium text-amber-700 mb-1">My teacher explains it differently</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Describe your teacher's method..."
              value={teacherMethod}
              onChange={(e) => setTeacherMethod(e.target.value)}
              className="flex-1 text-xs border border-amber-200 rounded-lg px-3 py-1.5 focus:outline-none"
            />
            <button onClick={() => setShowTeacherMethod(false)} className="text-xs text-amber-700 font-medium px-2">Save</button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} childName={child.name} />
        ))}
        {tutorTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Completion state */}
      {sessionComplete ? (
        <div className="p-4 space-y-3">
          <Button fullWidth size="lg" onClick={() => router.push("/dashboard")}>
            Back to Dashboard 🏠
          </Button>
          <Button fullWidth variant="secondary" onClick={() => router.push("/study?mode=test")}>
            Practice Test on {session.topic}
          </Button>
        </div>
      ) : (
        /* Input */
        <div className="bg-white border-t border-gray-100 px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your answer or ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={tutorTyping}
            />
            <Button onClick={handleSend} disabled={!input.trim() || tutorTyping} className="px-4">
              →
            </Button>
          </div>
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
            {["I don't understand", "Give me a hint", "I already know the answer"].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="shrink-0 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message, childName }: { message: Message; childName: string }) {
  const isTutor = message.role === "tutor";
  return (
    <div className={`flex gap-3 ${isTutor ? "" : "flex-row-reverse"}`}>
      {isTutor && <TutorAvatar size="sm" />}
      <div className={`max-w-[80%] ${isTutor ? "" : "items-end flex flex-col"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
            isTutor
              ? "bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm"
              : "bg-indigo-600 text-white rounded-tr-sm"
          }`}
        >
          {message.content}
        </div>
        {message.type === "praise" && isTutor && (
          <div className="text-xs text-emerald-500 mt-1 ml-1">✓ Great work!</div>
        )}
        {message.type === "hint" && isTutor && (
          <div className="text-xs text-amber-500 mt-1 ml-1">💡 Hint</div>
        )}
      </div>
      {!isTutor && (
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
          {childName[0]}
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <TutorAvatar size="sm" speaking />
      <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}
