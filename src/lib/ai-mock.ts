import type { GradeTier, QuizQuestion } from "@/types";

// Simulates Claude + GPT-4o Vision responses with realistic tutor behavior
// Swap these functions with real API calls when keys are available

export interface TutorResponse {
  content: string;
  type: "explanation" | "hint" | "question" | "praise" | "correction";
  revealedAnswer: false; // tutor NEVER reveals the answer directly
}

const GRADE_PERSONAS: Record<GradeTier, string> = {
  primary: "kind, patient, very simple words, uses 'we' together, lots of encouragement",
  middle: "friendly, uses analogies, explains reasoning step by step",
  secondary: "respects intelligence, asks probing questions, treats as capable learner",
};

// OCR simulation
export async function simulateOCR(imageDescription: string): Promise<{
  success: boolean;
  questions: string[];
  subject: string;
  topic: string;
  confidence: number;
}> {
  await delay(1500);
  // Simulate 80% OCR success rate
  const confidence = Math.random() > 0.2 ? 0.85 : 0.35;
  if (confidence < 0.5) {
    return { success: false, questions: [], subject: "", topic: "", confidence };
  }
  return {
    success: true,
    confidence,
    subject: "Mathematics",
    topic: "Fractions",
    questions: [
      "What is 1/2 + 1/4?",
      "Simplify the fraction 6/8.",
      "If you have 3/4 of a pizza and eat 1/4, how much is left?",
      "What is the equivalent fraction of 2/3 with denominator 9?",
      "Which is greater: 3/5 or 2/4?",
    ],
  };
}

// Guided homework response — NEVER reveals answer, always guides
export async function getTutorResponse(
  question: string,
  studentMessage: string,
  hintsGiven: number,
  tier: GradeTier,
  subject: string,
  topic: string,
  teacherMethod?: string
): Promise<TutorResponse> {
  await delay(800 + Math.random() * 600);

  const persona = GRADE_PERSONAS[tier];
  const isFirstAttempt = hintsGiven === 0;
  const isFrustrated =
    studentMessage.toLowerCase().includes("don't know") ||
    studentMessage.toLowerCase().includes("confused") ||
    studentMessage.toLowerCase().includes("don't understand") ||
    studentMessage.toLowerCase().includes("hard");

  if (isFrustrated) {
    return buildResponse(tier, "frustrated", question, topic, teacherMethod);
  }
  if (isFirstAttempt) {
    return buildResponse(tier, "first", question, topic, teacherMethod);
  }
  if (hintsGiven >= 3) {
    return buildResponse(tier, "final_hint", question, topic, teacherMethod);
  }
  return buildResponse(tier, "hint", question, topic, teacherMethod);
}

function buildResponse(
  tier: GradeTier,
  mode: "first" | "hint" | "final_hint" | "frustrated",
  question: string,
  topic: string,
  teacherMethod?: string
): TutorResponse {
  const method = teacherMethod ? ` (using your teacher's method)` : "";

  const responses: Record<GradeTier, Record<string, TutorResponse>> = {
    primary: {
      first: {
        content: `Let's work on this together! 🌟 First, let me explain what ${topic} means${method}. Think of fractions like sharing a pizza — if you cut it into 4 equal pieces and take 1, you have 1/4. Now, can you tell me what the bottom number in a fraction is called?`,
        type: "explanation",
        revealedAnswer: false,
      },
      hint: {
        content: `You're doing great! Here's a little hint — look at the numbers on the bottom (the denominators). Are they the same or different? What do you think we need to do first when they're different?`,
        type: "hint",
        revealedAnswer: false,
      },
      final_hint: {
        content: `Almost there! Try drawing it out — draw a rectangle, cut it into parts, and shade the fraction. Then write what you see. What number do you get?`,
        type: "hint",
        revealedAnswer: false,
      },
      frustrated: {
        content: `That's completely okay! Fractions can feel tricky at first. Let's slow down and start with something really simple${method}. Imagine you have 2 chocolates and I give you 2 more. How many total? Good — now fractions work similarly. Ready to try a tiny example together?`,
        type: "explanation",
        revealedAnswer: false,
      },
    },
    middle: {
      first: {
        content: `Good question! Before we solve it, let's make sure we understand the concept${method}. ${topic} follows a specific rule — can you tell me what you already know about it? Even a partial answer helps me understand where to start explaining.`,
        type: "question",
        revealedAnswer: false,
      },
      hint: {
        content: `You're on the right track. Here's a clue — think about what operation connects the numbers in this problem. If it helps, try writing out the steps one by one. What's the very first thing you'd do?`,
        type: "hint",
        revealedAnswer: false,
      },
      final_hint: {
        content: `Let me give you a worked example with different numbers${method}: if the problem was [simpler version], the answer would be [process]. Now apply the same logic to your problem. What do you get?`,
        type: "hint",
        revealedAnswer: false,
      },
      frustrated: {
        content: `No worries — let's break this down differently${method}. I'll use an analogy: ${topic} is like... [real-world scenario]. Does that click? Tell me which part feels most confusing and we'll tackle just that part.`,
        type: "explanation",
        revealedAnswer: false,
      },
    },
    secondary: {
      first: {
        content: `Interesting problem. Before diving in — what's your initial approach${method}? Walk me through your thinking, even if you're not sure it's right. That'll help me understand exactly where to focus.`,
        type: "question",
        revealedAnswer: false,
      },
      hint: {
        content: `You're close. Consider this: what happens to the equation if you isolate the variable first? What constraint does the problem give you that you might not have used yet?`,
        type: "hint",
        revealedAnswer: false,
      },
      final_hint: {
        content: `Here's the key insight you might be missing${method}: [concept principle]. Apply that principle to your current step. The answer should follow directly. What do you get?`,
        type: "hint",
        revealedAnswer: false,
      },
      frustrated: {
        content: `Let's reframe this${method}. The core principle behind ${topic} is [fundamental concept]. Try approaching it from first principles rather than the formula. What does the problem actually ask you to find?`,
        type: "explanation",
        revealedAnswer: false,
      },
    },
  };

  return responses[tier][mode];
}

// Verify student's answer
export async function verifyAnswer(
  question: string,
  studentAnswer: string,
  tier: GradeTier
): Promise<{ correct: boolean; feedback: string }> {
  await delay(600);
  // Mock: alternate correct/incorrect for demo
  const correct = studentAnswer.trim().length > 2;
  const feedbacks: Record<GradeTier, Record<string, string>> = {
    primary: {
      correct: "Yes! That's exactly right! You got it! ⭐ Great job working through that.",
      wrong: "Not quite, but that's a great try! Let me show you where to adjust...",
    },
    middle: {
      correct: "Correct! And notice how the method works — you can apply this same approach to similar problems.",
      wrong: "Close, but check your working — there's one step that needs revisiting. Can you spot it?",
    },
    secondary: {
      correct: "Correct. Good reasoning — you identified the right approach. Note this technique for exam prep.",
      wrong: "That's not quite right. Review your second step — the error likely originated there.",
    },
  };
  return {
    correct,
    feedback: feedbacks[tier][correct ? "correct" : "wrong"],
  };
}

// Doubt solver
export async function solveDroubt(
  question: string,
  subject: string,
  tier: GradeTier
): Promise<{ explanation: string; example: string; verificationQuestion: string }> {
  await delay(1000);
  return {
    explanation: `Great question about ${subject}! Here's how to think about it: [Clear concept explanation tailored for grade tier ${tier}]. The key thing to remember is [core principle].`,
    example: `For example: [Concrete example with numbers/scenario relevant to their grade]. See how [process] leads to [result]?`,
    verificationQuestion: `Now let me check your understanding — ${question.replace("What is", "Can you tell me").replace("How do", "Try to explain how")}? Take your time.`,
  };
}

// Quiz generator
export async function generateQuiz(
  topic: string,
  subject: string,
  tier: GradeTier,
  count = 5
): Promise<QuizQuestion[]> {
  await delay(1200);
  return Array.from({ length: count }, (_, i) => ({
    id: `q_${Date.now()}_${i}`,
    question: `[${tier.toUpperCase()}] Practice question ${i + 1} on ${topic} in ${subject}?`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctIndex: Math.floor(Math.random() * 4),
    explanation: `The correct answer is because [explanation of concept]. This is important because [relevance].`,
    topic,
    subject,
  }));
}

// Daily report generator
export async function generateDailyReport(data: {
  studyMinutes: number;
  homeworkCompleted: string[];
  topicsLearned: string[];
  weakAreas: string[];
  strongAreas: string[];
}): Promise<{ text: string; voiceSummary: string }> {
  await delay(500);
  const text = `Today your child studied for ${data.studyMinutes} minutes. Completed: ${data.homeworkCompleted.join(", ") || "nothing yet"}. Learned: ${data.topicsLearned.join(", ") || "reviewed existing topics"}. Strong in: ${data.strongAreas.join(", ") || "building foundations"}. Needs practice: ${data.weakAreas.join(", ") || "keep going"}.`;
  const voiceSummary = `Your child studied for ${data.studyMinutes} minutes today${data.homeworkCompleted.length ? `, completed ${data.homeworkCompleted.join(" and ")} homework` : ""}${data.topicsLearned.length ? `, and learned about ${data.topicsLearned.join(" and ")}` : ""}. ${data.weakAreas.length ? `They need a little more practice with ${data.weakAreas.join(" and ")}.` : "They are doing well across all topics."}`;
  return { text, voiceSummary };
}

// Exam study plan
export async function generateStudyPlan(
  subject: string,
  daysLeft: number,
  weakTopics: string[]
): Promise<{ plan: string[]; readinessScore: number }> {
  await delay(800);
  return {
    plan: Array.from({ length: Math.min(daysLeft, 7) }, (_, i) => {
      const topic = weakTopics[i % weakTopics.length] || subject;
      return `Day ${i + 1}: Revise ${topic} — 20 min practice + 5 min quiz`;
    }),
    readinessScore: Math.floor(50 + Math.random() * 40),
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
