"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { mockStore } from "@/lib/mock-store";

interface PhoneStepProps {
  onNext: (parentId: string) => void;
}

export default function PhoneStep({ onNext }: PhoneStepProps) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOTP() {
    if (phone.length < 10) { setError("Enter a valid phone number"); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000)); // simulate OTP send
    setLoading(false);
    setStep("otp");
    setError("");
  }

  async function handleVerify() {
    if (otp.length < 4) { setError("Enter the OTP"); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const parent = mockStore.loginAsParent(phone);
    setLoading(false);
    onNext(parent.id);
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">🦉</div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to GuardianTutor</h1>
        <p className="text-gray-500 text-sm">Your child's personal AI tutor</p>
      </div>

      {step === "phone" ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Phone Number</label>
            <div className="flex gap-2">
              <span className="inline-flex items-center px-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm">
                +91
              </span>
              <input
                type="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {error && <p className="text-rose-500 text-xs">{error}</p>}
          <Button fullWidth size="lg" onClick={handleSendOTP} loading={loading}>
            Send OTP
          </Button>
          <p className="text-center text-xs text-gray-400">No reading required — just one tap after setup</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter OTP sent to +91 {phone}</label>
            <input
              type="tel"
              placeholder="• • • • • •"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1 text-center">(Demo: any 4+ digit code works)</p>
          </div>
          {error && <p className="text-rose-500 text-xs">{error}</p>}
          <Button fullWidth size="lg" onClick={handleVerify} loading={loading}>
            Verify & Continue
          </Button>
          <button onClick={() => setStep("phone")} className="w-full text-xs text-gray-400 hover:text-gray-600">
            Change number
          </button>
        </div>
      )}
    </div>
  );
}
