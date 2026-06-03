"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneStep from "@/components/onboarding/PhoneStep";
import ChildSetupStep from "@/components/onboarding/ChildSetupStep";

type OnboardingStep = "phone" | "child-setup";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("phone");
  const [parentId, setParentId] = useState("");

  function handlePhoneDone(id: string) {
    setParentId(id);
    setStep("child-setup");
  }

  function handleChildDone(childId: string) {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-8">
        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-8">
          {(["phone", "child-setup"] as OnboardingStep[]).map((s, i) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s ? "w-8 bg-indigo-600" : i < ["phone", "child-setup"].indexOf(step) ? "w-2 bg-indigo-300" : "w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {step === "phone" && <PhoneStep onNext={handlePhoneDone} />}
        {step === "child-setup" && <ChildSetupStep parentId={parentId} onComplete={handleChildDone} />}
      </div>
    </div>
  );
}
