"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Alert, Button, Input, PhoneInput, isValidPhone } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/toast";

type Step = "phone" | "code" | "password";

interface SendOtpResponse {
  code?: string;
  expiresIn: number;
  resendAfter: number;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(fn: () => Promise<void>) {
    setError("");
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(phone)) return setError("Telefon raqamni to‘liq kiriting");
    run(async () => {
      const res = await api.post<SendOtpResponse>("/auth/forgot-password", { phone }, { skipRefresh: true });
      setDevCode(res.code);
      setStep("code");
    });
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError("6 xonali kodni kiriting");
    run(async () => {
      const res = await api.post<{ resetToken: string }>("/auth/verify-otp", { phone, code }, { skipRefresh: true });
      setResetToken(res.resetToken);
      setStep("password");
    });
  };

  const reset = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setError("Parol kamida 6 ta belgidan iborat bo‘lsin");
    run(async () => {
      await api.post("/auth/reset-password", { phone, resetToken, newPassword: password }, { skipRefresh: true });
      toast("Parol yangilandi. Endi yangi parol bilan kiring.");
      router.replace("/login");
    });
  };

  const stepIndex = { phone: 0, code: 1, password: 2 }[step];

  return (
    <>
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> Kirishga qaytish
      </Link>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Parolni tiklash</h1>
      <p className="mt-2 text-slate-500">
        {step === "phone" && "Ro‘yxatdan o‘tgan telefon raqamingizni kiriting — tasdiqlash kodi yuboramiz."}
        {step === "code" && "Telefoningizga yuborilgan 6 xonali kodni kiriting."}
        {step === "password" && "Yangi parolni o‘rnating."}
      </p>

      <div className="mt-6 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-emerald-500" : "bg-slate-200"}`} />
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {error && <Alert>{error}</Alert>}

        {step === "phone" && (
          <form onSubmit={sendCode} className="space-y-4">
            <PhoneInput value={phone} onChange={setPhone} autoFocus />
            <Button type="submit" size="lg" block loading={loading}>
              Kod yuborish
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verify} className="space-y-4">
            {devCode && (
              <Alert tone="amber">
                Test rejimi: SMS xizmati ulanmagan, kod — <b className="tracking-widest">{devCode}</b>
              </Alert>
            )}
            <Input
              label="Tasdiqlash kodi"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl font-bold tracking-[0.5em]"
              autoFocus
            />
            <Button type="submit" size="lg" block loading={loading}>
              Tasdiqlash
            </Button>
            <button
              type="button"
              onClick={() => {
                setCode("");
                setStep("phone");
              }}
              className="w-full text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              Raqamni o‘zgartirish
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={reset} className="space-y-4">
            <Input
              label="Yangi parol"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Kamida 6 ta belgi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <Button type="submit" size="lg" block loading={loading}>
              Parolni saqlash
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
