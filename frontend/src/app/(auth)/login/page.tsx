"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Alert, Button, Input, PhoneInput, isValidPhone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, user, ready } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const next = params.get("next");
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  useEffect(() => {
    if (ready && user) router.replace(target);
  }, [ready, user, router, target]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isValidPhone(phone)) return setError("Telefon raqamni to‘liq kiriting");
    if (!password) return setError("Parolni kiriting");
    setLoading(true);
    try {
      await login(phone, password);
      router.replace(target);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kirishda xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Xush kelibsiz</h1>
      <p className="mt-2 text-slate-500">Davralaringizga kirish uchun hisobingizga kiring.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && <Alert>{error}</Alert>}
        <PhoneInput value={phone} onChange={setPhone} autoFocus />
        <div className="relative">
          <Input
            label="Parol"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
            aria-label={show ? "Parolni yashirish" : "Parolni ko‘rsatish"}
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            Parolni unutdingizmi?
          </Link>
        </div>
        <Button type="submit" size="lg" block loading={loading}>
          Kirish
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Hisobingiz yo‘qmi?{" "}
        <Link href="/register" className="font-semibold text-emerald-700 hover:text-emerald-800">
          Ro‘yxatdan o‘ting
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
