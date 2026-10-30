"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Input, PhoneInput, isValidPhone } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/toast";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (fullName.trim().length < 3) return setError("Ism va familiyani kiriting");
    if (!isValidPhone(phone)) return setError("Telefon raqamni to‘liq kiriting");
    if (password.length < 6) return setError("Parol kamida 6 ta belgidan iborat bo‘lsin");
    if (password !== confirm) return setError("Parollar mos kelmadi");

    setLoading(true);
    try {
      await api.post("/auth/register", { fullName: fullName.trim(), phone, password }, { skipRefresh: true });
      await login(phone, password);
      toast("Hisob yaratildi. Xush kelibsiz!");
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ro‘yxatdan o‘tishda xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hisob yaratish</h1>
      <p className="mt-2 text-slate-500">Bir daqiqada ro‘yxatdan o‘ting va davrangizni boshlang.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && <Alert>{error}</Alert>}
        <Input
          label="Ism va familiya"
          name="fullName"
          autoComplete="name"
          placeholder="Eshmat Toshmatov"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoFocus
        />
        <PhoneInput value={phone} onChange={setPhone} />
        <Input
          label="Parol"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Kamida 6 ta belgi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Parolni tasdiqlang"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" size="lg" block loading={loading}>
          Ro‘yxatdan o‘tish
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Hisobingiz bormi?{" "}
        <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
          Kirish
        </Link>
      </p>
    </>
  );
}
