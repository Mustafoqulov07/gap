"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Plus, Trophy, Users, Wallet } from "lucide-react";
import { Alert, Avatar, Button, Card, EmptyState, PageLoader } from "@/components/ui";
import { GapCard, GapFormModal } from "@/components/gap";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { formatMoney } from "@/lib/format";
import type { Gap, Round } from "@/lib/types";

interface GapWithRounds {
  gap: Gap;
  rounds: Round[];
}

function greeting() {
  const h = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Tashkent" }).format(new Date()),
  );
  if (h < 12) return "Xayrli tong";
  if (h < 18) return "Xayrli kun";
  return "Xayrli kech";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: gaps, error, loading, reload } = useApi<Gap[]>("/gap");
  const [roundsByGap, setRoundsByGap] = useState<GapWithRounds[]>([]);
  const [creating, setCreating] = useState(false);

  // Boshlangan davralar uchun navbat (raund) ma'lumotlarini yuklaymiz
  useEffect(() => {
    if (!gaps) return;
    const started = gaps.filter((g) => g.duration > 0 && g.status === "ACTIVE");
    Promise.all(
      started.map((gap) =>
        api
          .get<Round[]>(`/round/gap/${gap.id}`)
          .then((rounds) => ({ gap, rounds }))
          .catch(() => ({ gap, rounds: [] as Round[] })),
      ),
    ).then(setRoundsByGap);
  }, [gaps]);

  const stats = useMemo(() => {
    const list = gaps ?? [];
    const active = list.filter((g) => g.status === "ACTIVE");
    return {
      count: list.length,
      monthly: active.reduce((sum, g) => sum + g.monthlyAmount, 0),
      owned: list.filter((g) => g.organizerId === user?.id).length,
    };
  }, [gaps, user?.id]);

  // "Men qachon to'layman va qachon olaman?" — eng yaqin javob
  const upcoming = useMemo(() => {
    if (!user) return [];
    return roundsByGap
      .map(({ gap, rounds }) => {
        const current = rounds.find((r) => r.status === "ACTIVE");
        const mine = rounds.find((r) => r.receiverId === user.id);
        const pot = gap.monthlyAmount * (gap.members?.length ?? gap.duration);
        return { gap, current, mine, pot, total: rounds.length };
      })
      .filter((x) => x.current || x.mine);
  }, [roundsByGap, user]);

  if (!user) return null;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{greeting()},</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {user.fullName.split(" ")[0]} 👋
          </h1>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Yangi davra
        </Button>
      </div>

      {error && <Alert>{error.message}</Alert>}

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { icon: Users, label: "Davralarim", value: String(stats.count), tone: "bg-emerald-50 text-emerald-600" },
          { icon: Wallet, label: "Oylik badallar", value: formatMoney(stats.monthly), tone: "bg-amber-50 text-amber-600" },
          { icon: Trophy, label: "Tashkilotchiman", value: String(stats.owned), tone: "bg-sky-50 text-sky-600" },
        ].map((s) => (
          <Card key={s.label} className="p-4 sm:p-5">
            <div className={`grid size-10 place-items-center rounded-xl ${s.tone}`}>
              <s.icon className="size-5" />
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">{s.label}</p>
            <p className="mt-0.5 truncate text-base font-extrabold text-slate-900 sm:text-xl">{s.value}</p>
          </Card>
        ))}
      </div>

      {upcoming.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Navbat holati</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map(({ gap, current, mine, pot, total }) => {
              const myTurnNow = current && current.receiverId === user.id;
              return (
                <Link
                  key={gap.id}
                  href={`/gaps/${gap.id}`}
                  className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-md transition hover:-translate-y-0.5 ${
                    myTurnNow
                      ? "bg-gradient-to-br from-amber-400 to-orange-500"
                      : "bg-gradient-to-br from-emerald-600 to-teal-700"
                  }`}
                >
                  <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10" />
                  <div className="relative flex items-center justify-between">
                    <p className="font-semibold">{gap.name}</p>
                    {current && (
                      <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                        {current.roundNumber}/{total}-oy
                      </span>
                    )}
                  </div>
                  {myTurnNow ? (
                    <>
                      <p className="relative mt-4 text-sm text-white/85">🎉 Bu oy sizning navbatingiz!</p>
                      <p className="relative text-2xl font-extrabold">{formatMoney(pot)}</p>
                    </>
                  ) : (
                    <>
                      <p className="relative mt-4 text-sm text-white/80">Bu oy to‘lovingiz</p>
                      <p className="relative text-2xl font-extrabold">{formatMoney(gap.monthlyAmount)}</p>
                    </>
                  )}
                  <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-white/20 pt-3 text-sm">
                    {current?.receiver && (
                      <span className="flex min-w-0 items-center gap-2">
                        <Avatar name={current.receiver.fullName} src={current.receiver.avatar} seed={current.receiverId} size={24} />
                        <span className="truncate">Oluvchi: {current.receiver.fullName}</span>
                      </span>
                    )}
                    {mine && (
                      <span className="flex shrink-0 items-center gap-1.5 font-semibold">
                        <CalendarClock className="size-4" /> Navbatim: {mine.roundNumber}-oy
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Davralarim</h2>
          {gaps && gaps.length > 0 && (
            <Link href="/gaps" className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              Barchasi <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
        {loading && !gaps ? (
          <PageLoader />
        ) : gaps && gaps.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {gaps.slice(0, 4).map((g) => (
              <GapCard key={g.id} gap={g} userId={user.id} />
            ))}
          </div>
        ) : (
          !error && (
            <EmptyState
              icon={<Users className="size-6" />}
              title="Hali davralaringiz yo‘q"
              text="Birinchi davrangizni yarating yoki tashkilotchidan sizni qo‘shishini so‘rang. Buning uchun ID raqamingizni yuboring."
              action={
                <Button onClick={() => setCreating(true)}>
                  <Plus className="size-4" /> Davra yaratish
                </Button>
              }
            />
          )
        )}
      </section>

      {creating && <GapFormModal open onClose={() => setCreating(false)} onSaved={reload} />}
    </>
  );
}
