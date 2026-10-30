"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Crown } from "lucide-react";
import { Avatar, Badge, Button, Input, Modal, Textarea, Alert } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api, ApiError } from "@/lib/api";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Gap, RoundStatus } from "@/lib/types";

export function gapPhase(gap: Gap) {
  if (gap.status === "COMPLETED") return { label: "Yakunlangan", tone: "slate" as const };
  if (gap.status === "CANCELLED") return { label: "Bekor qilingan", tone: "red" as const };
  if (gap.duration > 0) return { label: "Faol", tone: "green" as const };
  return { label: "Yig‘ilmoqda", tone: "blue" as const };
}

export function roundStatus(status: RoundStatus) {
  switch (status) {
    case "ACTIVE":
      return { label: "Joriy", tone: "amber" as const };
    case "COMPLETED":
      return { label: "Yakunlangan", tone: "green" as const };
    default:
      return { label: "Kutilmoqda", tone: "slate" as const };
  }
}

export function GapCard({ gap, userId }: { gap: Gap; userId: number }) {
  const phase = gapPhase(gap);
  const members = gap.members ?? [];
  const fill = Math.min(100, Math.round((members.length / gap.maxMembers) * 100));
  const isOwner = gap.organizerId === userId;

  return (
    <Link
      href={`/gaps/${gap.id}`}
      className="group block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-slate-900">{gap.name}</h3>
            {isOwner && (
              <span title="Siz tashkilotchisiz" className="text-amber-500">
                <Crown className="size-4" />
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
            {gap.description || "Tavsif kiritilmagan"}
          </p>
        </div>
        <Badge tone={phase.tone}>{phase.label}</Badge>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Oylik badal</p>
          <p className="text-xl font-extrabold text-slate-900">{formatMoney(gap.monthlyAmount)}</p>
        </div>
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((m) => (
            <Avatar
              key={m.id}
              name={m.user.fullName}
              src={m.user.avatar}
              seed={m.userId}
              size={30}
              className="ring-2 ring-white"
            />
          ))}
          {members.length > 4 && (
            <span className="grid size-[30px] place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 ring-2 ring-white">
              +{members.length - 4}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500">
          <span>
            A‘zolar: {members.length}/{gap.maxMembers}
          </span>
          <span className="flex items-center gap-0.5 font-semibold text-emerald-700 opacity-0 transition group-hover:opacity-100">
            Ochish <ChevronRight className="size-3.5" />
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${fill}%` }} />
        </div>
      </div>
    </Link>
  );
}

interface GapFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: (gap: Gap) => void;
  /** Tahrirlash rejimi uchun mavjud davra */
  gap?: Gap;
}

export function GapFormModal({ open, onClose, onSaved, gap }: GapFormProps) {
  const toast = useToast();
  const started = Boolean(gap && gap.duration > 0);
  const [name, setName] = useState(gap?.name ?? "");
  const [description, setDescription] = useState(gap?.description ?? "");
  const [maxMembers, setMaxMembers] = useState(String(gap?.maxMembers ?? 10));
  const [amount, setAmount] = useState(gap ? String(gap.monthlyAmount) : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const amountNum = Number(amount.replace(/\D/g, ""));
  const membersNum = Number(maxMembers);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Davra nomini kiriting");
    if (!started) {
      if (!Number.isInteger(membersNum) || membersNum < 2) return setError("A‘zolar soni kamida 2 bo‘lsin");
      if (!amountNum || amountNum < 1) return setError("Oylik badal summasini kiriting");
    }

    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || undefined,
    };
    if (!started) {
      body.maxMembers = membersNum;
      body.monthlyAmount = amountNum;
    }

    setLoading(true);
    try {
      const saved = gap
        ? await api.patch<Gap>(`/gap/${gap.id}`, body)
        : await api.post<Gap>("/gap", body);
      toast(gap ? "Davra yangilandi" : "Davra yaratildi");
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlashda xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={gap ? "Davrani tahrirlash" : "Yangi davra"}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Input label="Davra nomi" name="name" placeholder="Masalan: Oila gapi" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Textarea
          label="Tavsif (ixtiyoriy)"
          placeholder="Qoidalar, to‘lov sanasi va boshqa izohlar"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="A‘zolar soni"
            name="maxMembers"
            type="number"
            min={2}
            value={maxMembers}
            onChange={(e) => setMaxMembers(e.target.value)}
            disabled={started}
          />
          <Input
            label="Oylik badal (so‘m)"
            name="monthlyAmount"
            inputMode="numeric"
            placeholder="1 000 000"
            value={amountNum ? formatNumber(amountNum) : ""}
            onChange={(e) => setAmount(e.target.value)}
            disabled={started}
          />
        </div>
        {started ? (
          <p className="text-xs text-slate-500">Boshlangan davrada a‘zolar soni va badal summasini o‘zgartirib bo‘lmaydi.</p>
        ) : (
          amountNum > 0 &&
          membersNum >= 2 && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Har oy oluvchiga: <b>{formatMoney(amountNum * membersNum)}</b> · Davomiyligi: <b>{membersNum} oy</b>
            </div>
          )
        )}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" block onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit" block loading={loading}>
            {gap ? "Saqlash" : "Yaratish"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
