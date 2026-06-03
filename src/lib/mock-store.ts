"use client";
// In-memory mock store simulating Firebase — swap with real Firestore calls when keys are ready

import type {
  Child,
  Parent,
  LearningGraph,
  HomeworkSession,
  DailyReport,
  Exam,
} from "@/types";

const STORAGE_KEY = "guardiantutor_mock";

function load(): MockDB {
  if (typeof window === "undefined") return defaultDB();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultDB();
  } catch {
    return defaultDB();
  }
}

function save(db: MockDB) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

interface MockDB {
  parents: Record<string, Parent>;
  children: Record<string, Child>;
  learningGraphs: Record<string, LearningGraph>;
  homeworkSessions: Record<string, HomeworkSession>;
  dailyReports: Record<string, DailyReport>;
  exams: Record<string, Exam>;
  currentParentId: string | null;
  currentChildId: string | null;
}

function defaultDB(): MockDB {
  return {
    parents: {},
    children: {},
    learningGraphs: {},
    homeworkSessions: {},
    dailyReports: {},
    exams: {},
    currentParentId: null,
    currentChildId: null,
  };
}

export const mockStore = {
  // Auth
  loginAsParent(phone: string): Parent {
    const db = load();
    const existing = Object.values(db.parents).find((p) => p.phone === phone);
    if (existing) {
      db.currentParentId = existing.id;
      save(db);
      return existing;
    }
    const parent: Parent = {
      id: `parent_${Date.now()}`,
      phone,
      name: "",
      children: [],
      createdAt: Date.now(),
    };
    db.parents[parent.id] = parent;
    db.currentParentId = parent.id;
    save(db);
    return parent;
  },

  updateParent(id: string, data: Partial<Parent>) {
    const db = load();
    db.parents[id] = { ...db.parents[id], ...data };
    save(db);
    return db.parents[id];
  },

  getCurrentParent(): Parent | null {
    const db = load();
    if (!db.currentParentId) return null;
    return db.parents[db.currentParentId] || null;
  },

  // Children
  addChild(child: Omit<Child, "id" | "createdAt">): Child {
    const db = load();
    const newChild: Child = {
      ...child,
      id: `child_${Date.now()}`,
      createdAt: Date.now(),
    };
    db.children[newChild.id] = newChild;
    if (db.currentParentId) {
      db.parents[db.currentParentId].children.push(newChild.id);
    }
    db.currentChildId = newChild.id;
    db.learningGraphs[newChild.id] = {
      childId: newChild.id,
      subjects: {},
      totalStudyMinutes: 0,
      streak: 0,
      lastStudyDate: "",
    };
    save(db);
    return newChild;
  },

  getChild(id: string): Child | null {
    const db = load();
    return db.children[id] || null;
  },

  getChildrenForParent(parentId: string): Child[] {
    const db = load();
    const parent = db.parents[parentId];
    if (!parent) return [];
    return parent.children.map((id) => db.children[id]).filter(Boolean);
  },

  setCurrentChild(childId: string) {
    const db = load();
    db.currentChildId = childId;
    save(db);
  },

  getCurrentChild(): Child | null {
    const db = load();
    if (!db.currentChildId) return null;
    return db.children[db.currentChildId] || null;
  },

  // Learning Graph
  getLearningGraph(childId: string): LearningGraph {
    const db = load();
    return (
      db.learningGraphs[childId] || {
        childId,
        subjects: {},
        totalStudyMinutes: 0,
        streak: 0,
        lastStudyDate: "",
      }
    );
  },

  updateLearningGraph(childId: string, data: Partial<LearningGraph>) {
    const db = load();
    db.learningGraphs[childId] = {
      ...db.learningGraphs[childId],
      ...data,
    };
    save(db);
  },

  addStudyTime(childId: string, minutes: number) {
    const db = load();
    const graph = db.learningGraphs[childId];
    if (!graph) return;
    graph.totalStudyMinutes += minutes;
    const today = new Date().toISOString().split("T")[0];
    if (graph.lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split("T")[0];
      graph.streak = graph.lastStudyDate === yStr ? graph.streak + 1 : 1;
      graph.lastStudyDate = today;
    }
    db.learningGraphs[childId] = graph;
    save(db);
  },

  // Homework
  saveHomeworkSession(session: HomeworkSession) {
    const db = load();
    db.homeworkSessions[session.id] = session;
    save(db);
  },

  getHomeworkSessions(childId: string): HomeworkSession[] {
    const db = load();
    return Object.values(db.homeworkSessions)
      .filter((s) => s.childId === childId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getPendingHomework(childId: string): HomeworkSession[] {
    return this.getHomeworkSessions(childId).filter(
      (s) => s.status !== "completed"
    );
  },

  // Daily Report
  saveDailyReport(report: DailyReport) {
    const db = load();
    const key = `${report.childId}_${report.date}`;
    db.dailyReports[key] = report;
    save(db);
  },

  getDailyReport(childId: string, date: string): DailyReport | null {
    const db = load();
    return db.dailyReports[`${childId}_${date}`] || null;
  },

  // Exams
  addExam(exam: Omit<Exam, "id">): Exam {
    const db = load();
    const newExam: Exam = { ...exam, id: `exam_${Date.now()}` };
    db.exams[newExam.id] = newExam;
    save(db);
    return newExam;
  },

  getExams(childId: string): Exam[] {
    const db = load();
    return Object.values(db.exams).filter((e) => e.childId === childId);
  },

  // Reset (for testing)
  reset() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
};
