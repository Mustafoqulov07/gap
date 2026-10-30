"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  Coins,
  Crown,
  Dices,
  Pencil,
  Play,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageLoader,
  cn,
} from "@/components/ui";
import { GapFormModal, gapPhase, roundStatus } from "@/components/gap";
import { useToast } from "@/components/toast";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { formatDate, formatMoney, formatPhone, maskPhone } from "@/lib/format";
import type { Gap, GapMember, Round } from "@/lib/types";

type Confirm =
  | { kind: "start" }
  | { kind: "draw" }
  | { kind: "delete" }
  | { kind: "remove"; member: GapMember }
  | { kind: "pay"; round: Round }
  | null;

export default function GapDetailPage({ params }: PageProps<"/gaps/[id]">) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const gapQ = useApi<Gap>(`/gap/${id}`);
  const gap = gapQ.data;
  const roundsQ = useApi<Round[]>(gap && gap.duration > 0 ? `/round/gap/${id}` : null);
  const rounds = gap && gap.duration > 0 ? (roundsQ.data ?? []) : [];

  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  if (gapQ.loading && !gap) return <PageLoader />;
  if (gapQ.error || !gap) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Alert>{gapQ.error?.message ?? "Davra topilmadi"}</Alert>
      </div>
    );
  }

  const members = gap.members ?? [];
  const isOwner = gap.organizerId === user.id;
  const isAdmin = user.role === "SUPER_ADMIN";
  const canManage = isOwner || isAdmin;
  const started = gap.duration > 0;
  const editable = gap.status === "ACTIVE";
  const phase = gapPhase(gap);
  const pot = gap.monthlyAmount * (started ? gap.duration : members.length);
  const current = rounds.find((r) => r.status === "ACTIVE");
  const myRound = rounds.find((r) => r.receiverId === user.id);
  const reloadAll = () => {
    gapQ.reload();
    roundsQ.reload();
  };

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      setConfirm(null);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Amalni bajarib bo‘lmadi", "error");
    } finally {
      setBusy(false);
    }
  }

  const runConfirm = () => {
    if (!confirm) return;
    switch (confirm.kind) {
      case "start":
        return act(async () => {
          try {
            await api.post(`/gap/${gap.id}/start`);
            await api.post(`/round/gap/${gap.id}`);
            toast("Davra boshlandi, navbat qur‘a bilan aniqlandi!");
          } finally {
            reloadAll();
          }
        });
      case "draw":
        return act(async () => {
          await api.post(`/round/gap/${gap.id}`);
          toast("Navbat qur‘a bilan aniqlandi");
          reloadAll();
        });
      case "delete":
        return act(async () => {
          await api.delete(`/gap/${gap.id}`);
          toast("Davra o‘chirildi");
          router.replace("/gaps");
        });
      case "remove":
        return act(async () => {
          await api.delete(`/gap/${gap.id}/member/${confirm.member.userId}`);
          toast("A‘zo davradan chiqarildi");
          gapQ.reload();
        });
      case "pay":
        return act(async () => {
          await api.post("/payments", { roundId: confirm.round.id, amount: gap.monthlyAmount });
          toast("To‘lov qayd etildi");
        });
    }
  };

  return (
    <>
      <BackLink />

      {/* Sarlavha */}
      <div className="mb-6 mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{gap.name}</h1>
            <Badge tone={phase.tone}>{phase.label}</Badge>
          </div>
          {gap.description && <p className="mt-2 max-w-2xl text-slate-600">{gap.description}</p>}
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
            <Crown className="size-4 text-amber-500" />
            Tashkilotchi: <b className="font-semibold text-slate-700">{gap.organizer?.fullName ?? "—"}</b>
            <span className="text-slate-300">·</span> {formatDate(gap.createdAt)}
          </p>
        </div>
        {canManage && editable && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Tahrirlash
            </Button>
            {!started && (
              <Button variant="secondary" size="sm" onClick={() => setConfirm({ kind: "delete" })} className="text-rose-600">
                <Trash2 className="size-4" /> O‘chirish
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Ko'rsatkichlar */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Wallet, label: "Oylik badal", value: formatMoney(gap.monthlyAmount) },
          { icon: Coins, label: "Oluvchiga har oy", value: formatMoney(pot) },
          { icon: Users, label: "A‘zolar", value: `${members.length} / ${gap.maxMembers}` },
          { icon: CalendarRange, label: "Davomiylik", value: started ? `${gap.duration} oy` : "Boshlanmagan" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className="size-5 text-emerald-600" />
            <p className="mt-2 text-xs font-medium text-slate-500">{s.label}</p>
            <p className="truncate text-lg font-extrabold text-slate-900">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Joriy raund */}
      {current && (
        <div
          className={cn(
            "relative mt-6 overflow-hidden rounded-3xl p-6 text-white shadow-lg",
            current.receiverId === user.id
              ? "bg-gradient-to-br from-amber-400 to-orange-500"
              : "bg-gradient-to-br from-emerald-600 to-teal-700",
          )}
        >
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <Avatar
                name={current.receiver?.fullName}
                src={current.receiver?.avatar}
                seed={current.receiverId}
                size={56}
                className="ring-4 ring-white/30"
              />
              <div>
                <p className="text-sm text-white/80">
                  {current.roundNumber}-oy · {current.receiverId === user.id ? "Bu oy siz olasiz 🎉" : "Bu oy oluvchi"}
                </p>
                <p className="text-xl font-bold">{current.receiver?.fullName}</p>
                <p className="text-sm text-white/80">Jami: {formatMoney(pot)}</p>
              </div>
            </div>
            {current.receiverId !== user.id && (
              <Button variant="gold" size="lg" onClick={() => setConfirm({ kind: "pay", round: current })}>
                <Wallet className="size-5" /> {formatMoney(gap.monthlyAmount)} to‘lash
              </Button>
            )}
          </div>
          {myRound && current.receiverId !== user.id && (
            <p className="relative mt-4 border-t border-white/20 pt-3 text-sm text-white/90">
              Sizning navbatingiz: <b>{myRound.roundNumber}-oy</b>
              {myRound.roundNumber > current.roundNumber &&
                ` — yana ${myRound.roundNumber - current.roundNumber} oydan keyin`}
            </p>
          )}
        </div>
      )}

      {/* Boshlash bo'yicha ko'rsatma */}
      {canManage && editable && !started && isOwner && (
        <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 border-l-4 border-emerald-500">
          <div>
            <p className="font-semibold text-slate-900">Davrani boshlashga tayyormisiz?</p>
            <p className="text-sm text-slate-500">
              Boshlangach a‘zolar tarkibi qotiriladi va navbat qur‘a bilan tasodifiy aniqlanadi.
              {members.length < 2 && " Kamida 2 ta a‘zo kerak."}
            </p>
          </div>
          <Button onClick={() => setConfirm({ kind: "start" })} disabled={members.length < 2}>
            <Play className="size-4" /> Boshlash
          </Button>
        </Card>
      )}

      {isOwner && started && editable && !roundsQ.loading && rounds.length === 0 && (
        <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 border-l-4 border-amber-400">
          <div>
            <p className="font-semibold text-slate-900">Navbat hali aniqlanmagan</p>
            <p className="text-sm text-slate-500">Qur‘a tashlab, har bir a‘zoning oluvchi oyini belgilang.</p>
          </div>
          <Button variant="gold" onClick={() => setConfirm({ kind: "draw" })}>
            <Dices className="size-4" /> Qur‘a tashlash
          </Button>
        </Card>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* A'zolar */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">A‘zolar</h2>
            {isOwner && editable && !started && members.length < gap.maxMembers && (
              <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
                <UserPlus className="size-4" /> Qo‘shish
              </Button>
            )}
          </div>
          <Card className="divide-y divide-slate-100 p-0">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={m.user.fullName} src={m.user.avatar} seed={m.userId} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900">
                    {m.user.fullName}
                    {m.userId === gap.organizerId && <Crown className="size-3.5 shrink-0 text-amber-500" />}
                    {m.userId === user.id && <span className="text-xs font-medium text-slate-400">(siz)</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {canManage || m.userId === user.id ? formatPhone(m.user.phone) : maskPhone(m.user.phone)}
                  </p>
                </div>
                {canManage && editable && !started && m.userId !== gap.organizerId && (
                  <button
                    onClick={() => setConfirm({ kind: "remove", member: m })}
                    className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Chiqarish"
                    aria-label={`${m.user.fullName}ni chiqarish`}
                  >
                    <UserMinus className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {Array.from({ length: Math.max(0, gap.maxMembers - members.length) })
              .slice(0, 3)
              .map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400">
                  <span className="grid size-10 place-items-center rounded-full border-2 border-dashed border-slate-200">
                    <UserPlus className="size-4" />
                  </span>
                  Bo‘sh o‘rin
                </div>
              ))}
          </Card>
        </section>

        {/* Navbat jadvali */}
        <section className="lg:col-span-3">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Navbat jadvali</h2>
          {roundsQ.loading && started ? (
            <PageLoader />
          ) : rounds.length > 0 ? (
            <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-[27px] before:top-4 before:w-0.5 before:bg-slate-200">
              {rounds.map((r) => {
                const st = roundStatus(r.status);
                const mine = r.receiverId === user.id;
                return (
                  <li
                    key={r.id}
                    className={cn(
                      "relative flex items-center gap-4 rounded-2xl bg-white p-3 pr-4 ring-1",
                      r.status === "ACTIVE" ? "ring-2 ring-amber-400" : "ring-slate-200/70",
                    )}
                  >
                    <span
                      className={cn(
                        "relative z-10 grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold",
                        r.status === "COMPLETED" && "bg-emerald-500 text-white",
                        r.status === "ACTIVE" && "bg-amber-400 text-amber-950",
                        r.status === "PENDING" && "bg-slate-100 text-slate-500",
                      )}
                    >
                      {r.roundNumber}
                    </span>
                    <Avatar name={r.receiver?.fullName} src={r.receiver?.avatar} seed={r.receiverId} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {r.receiver?.fullName ?? `#${r.receiverId}`}
                        {mine && <span className="ml-1.5 text-xs font-medium text-emerald-600">(siz)</span>}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.roundNumber}-oy
                        {r.completedAt && ` · ${formatDate(r.completedAt, false)} da yopilgan`}
                      </p>
                    </div>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyState
              icon={<Dices className="size-6" />}
              title="Navbat hali aniqlanmagan"
              text={
                started
                  ? "Tashkilotchi qur‘a tashlagach, navbat jadvali shu yerda paydo bo‘ladi."
                  : "Davra boshlanganda tizim navbatni tasodifiy aralashtiradi."
              }
            />
          )}
        </section>
      </div>

      {editing && <GapFormModal open gap={gap} onClose={() => setEditing(false)} onSaved={gapQ.reload} />}
      {adding && <AddMemberModal gapId={gap.id} onClose={() => setAdding(false)} onAdded={gapQ.reload} />}

      <Modal open={Boolean(confirm)} onClose={() => !busy && setConfirm(null)} title={confirmTitle(confirm)}>
        <p className="text-sm text-slate-600">{confirmText(confirm, gap)}</p>
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" block onClick={() => setConfirm(null)} disabled={busy}>
            Bekor qilish
          </Button>
          <Button
            block
            loading={busy}
            variant={confirm?.kind === "delete" || confirm?.kind === "remove" ? "danger" : "primary"}
            onClick={runConfirm}
          >
            Tasdiqlash
          </Button>
        </div>
      </Modal>
    </>
  );
}

function BackLink() {
  return (
    <Link href="/gaps" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
      <ArrowLeft className="size-4" /> Davralar
    </Link>
  );
}

function confirmTitle(c: Confirm) {
  switch (c?.kind) {
    case "start":
      return "Davrani boshlash";
    case "draw":
      return "Qur‘a tashlash";
    case "delete":
      return "Davrani o‘chirish";
    case "remove":
      return "A‘zoni chiqarish";
    case "pay":
      return "To‘lovni tasdiqlash";
    default:
      return "";
  }
}

function confirmText(c: Confirm, gap: Gap) {
  switch (c?.kind) {
    case "start":
      return `Davra ${gap.members?.length ?? 0} a‘zo bilan boshlanadi va navbat qur‘a orqali aniqlanadi. Shundan so‘ng a‘zolar tarkibini o‘zgartirib bo‘lmaydi.`;
    case "draw":
      return "Tizim a‘zolarni tasodifiy tartibda aralashtiradi. Natijani keyin o‘zgartirib bo‘lmaydi.";
    case "delete":
      return `“${gap.name}” davrasi butunlay o‘chiriladi. Bu amalni ortga qaytarib bo‘lmaydi.`;
    case "remove":
      return `${c.member.user.fullName} davradan chiqariladi.`;
    case "pay":
      return `${c.round.roundNumber}-oy uchun ${formatMoney(gap.monthlyAmount)} to‘lovi qayd etiladi. Oluvchi: ${c.round.receiver?.fullName ?? "—"}.`;
    default:
      return "";
  }
}

function AddMemberModal({
  gapId,
  onClose,
  onAdded,
}: {
  gapId: number;
  onClose: () => void;
  onAdded: () => void;
}) {
  const toast = useToast();
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const idNum = Number(userId);
    if (!Number.isInteger(idNum) || idNum < 1) return setError("To‘g‘ri ID raqam kiriting");
    setError("");
    setLoading(true);
    try {
      const member = await api.post<GapMember>(`/gap/${gapId}/member`, { userId: idNum });
      toast(`${member.user?.fullName ?? "A‘zo"} davraga qo‘shildi`);
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Qo‘shib bo‘lmadi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="A‘zo qo‘shish">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Input
          label="Foydalanuvchi ID raqami"
          name="userId"
          inputMode="numeric"
          placeholder="Masalan: 12"
          value={userId}
          onChange={(e) => setUserId(e.target.value.replace(/\D/g, ""))}
          hint="Har bir foydalanuvchi o‘z ID raqamini “Profil” sahifasida ko‘radi."
          autoFocus
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" block onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit" block loading={loading}>
            Qo‘shish
          </Button>
        </div>
      </form>
    </Modal>
  );
}
