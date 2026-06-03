# GuardianTutor — AI Homework & Learning Companion

An AI-powered tutoring app for self-studying children. The tutor guides students through homework step-by-step without ever revealing answers directly, while giving parents full visibility into learning progress.

---

## Product Overview

**For students:**
- Upload homework (photo, text, or voice)
- Complete homework guided by an AI tutor (never gives answers — only hints and explanations)
- Ask doubts anytime
- Take practice quizzes
- Prepare for exams with a personalized study plan

**For parents:**
- Monitor daily and weekly progress
- Hear voice summaries (no reading required)
- Track subject performance, streaks, and weak areas

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS v4 |
| AI Tutor | Claude API (Anthropic) — guided tutoring logic |
| OCR / Vision | GPT-4o Vision — homework image processing |
| Auth | Firebase Phone OTP |
| Database | Firebase Firestore |
| Deployment | Vercel (recommended) |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Root redirect (onboarding vs dashboard)
│   ├── onboarding/               # Parent phone OTP + child setup
│   ├── dashboard/                # Student home screen
│   ├── homework/
│   │   ├── page.tsx              # Homework upload (photo / text / voice)
│   │   └── [sessionId]/page.tsx  # Guided AI tutor session
│   ├── study/                    # Doubt solver, quiz, exam prep, weak areas
│   └── parent/                   # Parent dashboard + voice reports
├── components/
│   ├── ui/                       # Button, Card, ProgressBar, TutorAvatar, SubjectBadge
│   └── onboarding/               # PhoneStep, ChildSetupStep
├── lib/
│   ├── firebase.ts               # Firebase app init (reads from env vars)
│   ├── mock-store.ts             # localStorage mock DB — REPLACE with Firestore
│   ├── ai-mock.ts                # Mock AI responses — REPLACE with real API calls
│   └── utils.ts                  # Helpers (grade tier, formatting, colors)
└── types/
    └── index.ts                  # All shared TypeScript types
```

---

## Running Locally

```bash
npm install
npm run dev
```

App opens at `http://localhost:3000`. All data is stored in `localStorage` using the mock layer — no backend needed to see the full UI.

---

## Environment Variables

Create a `.env.local` file:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# AI APIs (server-side only)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

---

---

# Backend Integration Guide

> **This section is for the backend developer working on the `backend-integration` branch.**

The frontend is fully built with a mock layer. Your job is to replace every mock with a real backend call. Below is a precise spec for what needs to be done.

---

## Branch

Work on: `backend-integration`
Do not touch: `main`
PR into: `main` when a feature is complete and tested

---

## Step 1 — Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Phone Authentication** under Authentication → Sign-in methods
3. Enable **Firestore Database** (start in test mode, lock down rules before production)
4. Add your web app and copy the config into `.env.local`

The Firebase client is already initialized in `src/lib/firebase.ts`. It reads from env vars — you only need to fill them in.

---

## Step 2 — Replace Mock Auth

**File to edit:** `src/components/onboarding/PhoneStep.tsx`

Replace the `handleSendOTP` and `handleVerify` functions with real Firebase Phone Auth:

```ts
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// In handleSendOTP:
const auth = getAuth();
window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
const confirmationResult = await signInWithPhoneNumber(auth, `+91${phone}`, window.recaptchaVerifier);
window.confirmationResult = confirmationResult;

// In handleVerify:
const result = await window.confirmationResult.confirm(otp);
const user = result.user;
// then call mockStore.loginAsParent → replace with Firestore write
```

Add a `<div id="recaptcha-container" />` in the JSX.

---

## Step 3 — Replace Mock Store with Firestore

**File to replace:** `src/lib/mock-store.ts`

Every function in `mockStore` maps directly to a Firestore operation. Replace them one by one.

### Firestore Collections

```
/parents/{parentId}
/children/{childId}
/learningGraphs/{childId}
/homeworkSessions/{sessionId}
/dailyReports/{childId_date}
/exams/{examId}
```

### Function Mapping

| Mock function | Firestore equivalent |
|---|---|
| `mockStore.loginAsParent(phone)` | `getDoc` / `setDoc` on `/parents` keyed by Firebase UID |
| `mockStore.addChild(child)` | `addDoc` to `/children`, update parent's `children[]` array |
| `mockStore.getCurrentChild()` | Read from `localStorage` (keep — just session state) |
| `mockStore.getLearningGraph(childId)` | `getDoc('/learningGraphs/{childId}')` |
| `mockStore.updateLearningGraph(...)` | `updateDoc` with `merge: true` |
| `mockStore.addStudyTime(childId, min)` | `updateDoc` with `increment(min)` on `totalStudyMinutes` |
| `mockStore.saveHomeworkSession(session)` | `setDoc('/homeworkSessions/{session.id}')` |
| `mockStore.getHomeworkSessions(childId)` | `query` where `childId == childId`, orderBy `createdAt desc` |
| `mockStore.saveDailyReport(report)` | `setDoc('/dailyReports/{childId}_{date}')` |
| `mockStore.addExam(exam)` | `addDoc` to `/exams` |
| `mockStore.getExams(childId)` | `query` where `childId == childId` |

Keep the same exported function signatures — the components call these functions directly. If the interface stays the same, no component files need to change.

---

## Step 4 — Replace AI Mock with Real API Calls

**File to replace:** `src/lib/ai-mock.ts`

Create API route handlers under `src/app/api/` and call them from the frontend.

### 4a — Guided Tutor (Claude API)

Create: `src/app/api/tutor/route.ts`

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  const { question, studentMessage, hintsGiven, tier, subject, topic, teacherMethod } = await req.json();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system: buildSystemPrompt(tier, subject, topic, teacherMethod),
    messages: [
      {
        role: "user",
        content: `Question: "${question}"\nStudent says: "${studentMessage}"\nHints given so far: ${hintsGiven}`
      }
    ]
  });

  return Response.json({ content: response.content[0].text, type: "hint", revealedAnswer: false });
}
```

**Critical system prompt rule — must be present in every request:**

```
NEVER reveal the answer directly, even if the student explicitly asks.
NEVER say "the answer is X".
Always guide with a question, a simpler example, or a hint toward the next step.
If the student is frustrated, simplify the explanation — do not give the answer.
```

Tone by tier:
- `primary` (Grade 1–3): very simple words, very short sentences, use "we" together, lots of encouragement
- `middle` (Grade 4–6): friendly, step-by-step, uses real-world analogies
- `secondary` (Grade 7–10): probing questions, treats student as capable, first principles

Replace `getTutorResponse()` in `ai-mock.ts` to call `POST /api/tutor`.

---

### 4b — OCR / Homework Image Processing (GPT-4o Vision)

Create: `src/app/api/ocr/route.ts`

```ts
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("image") as File;
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${file.type};base64,${base64}` } },
        { type: "text", text: 'Extract all homework questions from this image. Return JSON: { subject: string, topic: string, questions: string[], confidence: number }. If unreadable, set confidence below 0.5.' }
      ]
    }],
    response_format: { type: "json_object" }
  });

  return Response.json(JSON.parse(response.choices[0].message.content!));
}
```

If `confidence < 0.5`, return `{ success: false }` — the frontend already handles the fallback to text input.

Replace `simulateOCR()` in `ai-mock.ts` to call `POST /api/ocr` with the file as FormData.

---

### 4c — Other AI Functions

| Mock function | API route | Model |
|---|---|---|
| `solveDroubt()` | `POST /api/doubt` | Claude — explain concept + give example + ask verification question |
| `generateQuiz()` | `POST /api/quiz` | Claude — return 5 MCQs matching `QuizQuestion` type in `src/types/index.ts` |
| `generateDailyReport()` | `POST /api/report` | Claude — generate text summary + voice summary string |
| `generateStudyPlan()` | `POST /api/study-plan` | Claude — return day-by-day plan array + readiness score |

For `generateQuiz`, the response JSON must exactly match the `QuizQuestion` type defined in `src/types/index.ts`.

---

## Step 5 — Firestore Security Rules

Add in Firebase Console → Firestore → Rules before going live:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /parents/{parentId} {
      allow read, write: if request.auth.uid == parentId;
    }
    match /children/{childId} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/parents/$(request.auth.uid)).data.children.hasAny([childId]);
    }
    match /learningGraphs/{childId} {
      allow read, write: if request.auth != null;
    }
    match /homeworkSessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    match /dailyReports/{reportId} {
      allow read, write: if request.auth != null;
    }
    match /exams/{examId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Step 6 — Install Required Packages

```bash
npm install @anthropic-ai/sdk openai firebase-admin
```

---

## Step 7 — Deployment

1. Push `backend-integration` branch to GitHub
2. Connect repo to Vercel, set all env vars in the Vercel dashboard
3. Add your Vercel domain to Firebase Console → Authentication → Authorized domains
4. Test phone OTP on the deployed URL (localhost OTP behaves differently)

---

## What NOT to Touch

- Any file in `src/components/` — UI is complete, do not modify
- `src/types/index.ts` — types are finalized
- `src/lib/utils.ts` — pure helpers, no backend dependency
- `src/app/layout.tsx` — app shell is done

Only create or edit: `src/lib/mock-store.ts`, `src/lib/ai-mock.ts`, `src/components/onboarding/PhoneStep.tsx`, and new files under `src/app/api/`.

---

## Questions

Open an issue on this repo or ping the frontend lead.

---

## Getting Started (original)

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
