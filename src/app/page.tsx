"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { mockStore } from "@/lib/mock-store";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const child = mockStore.getCurrentChild();
    if (child) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 to-violet-50">
      <div className="text-center space-y-3">
        <div className="text-6xl animate-bounce">🦉</div>
        <p className="text-gray-400 text-sm">Loading GuardianTutor...</p>
      </div>
    </div>
  );
}
