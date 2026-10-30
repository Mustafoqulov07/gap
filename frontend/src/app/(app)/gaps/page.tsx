"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { Alert, Button, EmptyState, PageHeader, PageLoader, cn } from "@/components/ui";
import { GapCard, GapFormModal, gapPhase } from "@/components/gap";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/use-api";
import type { Gap } from "@/lib/types";

const filters = [
  { key: "all", label: "Barchasi" },
  { key: "Yig‘ilmoqda", label: "Yig‘ilmoqda" },
  { key: "Faol", label: "Faol" },
  { key: "Yakunlangan", label: "Yakunlangan" },
  { key: "owner", label: "Men tashkilotchi" },
];

export default function GapsPage() {
  const { user } = useAuth();
  const { data: gaps, error, loading, reload } = useApi<Gap[]>("/gap");
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (gaps ?? []).filter((g) => {
      if (q && !g.name.toLowerCase().includes(q)) return false;
      if (filter === "all") return true;
      if (filter === "owner") return g.organizerId === user?.id;
      return gapPhase(g).label === filter;
    });
  }, [gaps, filter, query, user?.id]);

  if (!user) return null;

  return (
    <>
      <PageHeader
        title="Davralar"
        subtitle={user.role === "SUPER_ADMIN" ? "Platformadagi barcha davralar" : "Siz a‘zo bo‘lgan barcha davralar"}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Yangi davra
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
                filter === f.key
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nomi bo‘yicha qidirish"
            className="w-full rounded-xl border-0 bg-white py-2.5 pl-9 pr-3 text-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </label>
      </div>

      {error && <Alert>{error.message}</Alert>}

      {loading && !gaps ? (
        <PageLoader />
      ) : list.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((g) => (
            <GapCard key={g.id} gap={g} userId={user.id} />
          ))}
        </div>
      ) : (
        !error && (
          <EmptyState
            icon={<Users className="size-6" />}
            title={gaps?.length ? "Hech narsa topilmadi" : "Hali davralar yo‘q"}
            text={gaps?.length ? "Filtr yoki qidiruvni o‘zgartirib ko‘ring." : "Yangi davra yarating va a‘zolarni taklif qiling."}
            action={
              !gaps?.length && (
                <Button onClick={() => setCreating(true)}>
                  <Plus className="size-4" /> Davra yaratish
                </Button>
              )
            }
          />
        )
      )}

      {creating && <GapFormModal open onClose={() => setCreating(false)} onSaved={reload} />}
    </>
  );
}
