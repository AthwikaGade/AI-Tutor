"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { mockStore } from "@/lib/mock-store";
import type { Board, Medium } from "@/types";

interface ChildSetupStepProps {
  parentId: string;
  onComplete: (childId: string) => void;
}

const BOARDS: Board[] = ["CBSE", "ICSE", "State Board"];
const MEDIUMS: Medium[] = ["English", "Hindi", "Telugu", "Tamil"];
const DEFAULT_SUBJECTS = ["Mathematics", "Science", "English", "Social Studies"];

export default function ChildSetupStep({ parentId, onComplete }: ChildSetupStepProps) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<number>(0);
  const [board, setBoard] = useState<Board>("CBSE");
  const [medium, setMedium] = useState<Medium>("English");
  const [subjects, setSubjects] = useState<string[]>(["Mathematics", "Science", "English"]);
  const [customSubject, setCustomSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allSubjects = [...new Set([...DEFAULT_SUBJECTS, ...subjects])];

  function toggleSubject(s: string) {
    setSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function addCustom() {
    if (customSubject.trim()) {
      setSubjects((prev) => [...prev, customSubject.trim()]);
      setCustomSubject("");
    }
  }

  async function handleComplete() {
    if (!name.trim()) { setError("Enter your child's name"); return; }
    if (!grade) { setError("Select a grade"); return; }
    if (subjects.length === 0) { setError("Select at least one subject"); return; }
    setLoading(true);
    const child = mockStore.addChild({ name: name.trim(), grade, board, medium, subjects, parentId });
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    onComplete(child.id);
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Set Up Your Child's Profile</h2>
        <p className="text-gray-500 text-sm mt-1">Takes 2 minutes. Subjects can be added later.</p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Child's Name</label>
        <input
          type="text"
          placeholder="e.g. Arjun"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Grade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((g) => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                grade === g
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-gray-200 text-gray-600 hover:border-indigo-300"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">School Board</label>
        <div className="flex gap-2 flex-wrap">
          {BOARDS.map((b) => (
            <button
              key={b}
              onClick={() => setBoard(b)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                board === b
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-gray-200 text-gray-600 hover:border-indigo-300"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Medium */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Medium</label>
        <div className="flex gap-2 flex-wrap">
          {MEDIUMS.map((m) => (
            <button
              key={m}
              onClick={() => setMedium(m)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                medium === m
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-gray-200 text-gray-600 hover:border-indigo-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Subjects */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
        <div className="flex flex-wrap gap-2">
          {allSubjects.map((s) => (
            <button
              key={s}
              onClick={() => toggleSubject(s)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                subjects.includes(s)
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-gray-200 text-gray-600 hover:border-indigo-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Add subject..."
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button variant="secondary" size="sm" onClick={addCustom}>Add</Button>
        </div>
      </div>

      {error && <p className="text-rose-500 text-xs">{error}</p>}
      <Button fullWidth size="lg" onClick={handleComplete} loading={loading}>
        Start Learning
      </Button>
    </div>
  );
}
