export type Board = "CBSE" | "ICSE" | "State Board";
export type Medium = "English" | "Hindi" | "Telugu" | "Tamil";
export type GradeTier = "primary" | "middle" | "secondary"; // 1-3, 4-6, 7-10

export interface Child {
  id: string;
  name: string;
  grade: number; // 1-10
  board: Board;
  medium: Medium;
  subjects: string[];
  parentId: string;
  createdAt: number;
}

export interface Parent {
  id: string;
  phone: string;
  name: string;
  children: string[]; // child IDs
  createdAt: number;
}

export interface HomeworkSession {
  id: string;
  childId: string;
  subject: string;
  topic: string;
  questions: HomeworkQuestion[];
  status: "pending" | "in_progress" | "completed";
  uploadType: "photo" | "text" | "voice";
  imageUrl?: string;
  createdAt: number;
  completedAt?: number;
}

export interface HomeworkQuestion {
  id: string;
  text: string;
  status: "pending" | "in_progress" | "completed";
  hintsGiven: number;
  studentAnswer?: string;
  correct?: boolean;
}

export interface Message {
  id: string;
  role: "tutor" | "student";
  content: string;
  timestamp: number;
  type?: "explanation" | "hint" | "question" | "praise" | "correction";
}

export interface LearningGraph {
  childId: string;
  subjects: Record<string, SubjectProgress>;
  totalStudyMinutes: number;
  streak: number;
  lastStudyDate: string; // YYYY-MM-DD
}

export interface SubjectProgress {
  name: string;
  masteryPercent: number;
  weakTopics: string[];
  strongTopics: string[];
  homeworkCompleted: number;
  testsTaken: number;
  lastStudied: number;
  topics: Record<string, TopicProgress>;
}

export interface TopicProgress {
  name: string;
  masteryPercent: number;
  practiceCount: number;
  lastPracticed: number;
}

export interface Exam {
  id: string;
  childId: string;
  name: string;
  subject: string;
  examDate: string; // YYYY-MM-DD
  readinessScore: number;
  studyPlan: StudyPlanDay[];
}

export interface StudyPlanDay {
  date: string;
  topics: string[];
  durationMinutes: number;
  completed: boolean;
}

export interface DailyReport {
  childId: string;
  date: string;
  studyMinutes: number;
  homeworkCompleted: string[];
  subjectsStudied: string[];
  topicsLearned: string[];
  strongAreas: string[];
  weakAreas: string[];
  tomorrowFocus: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  subject: string;
}
