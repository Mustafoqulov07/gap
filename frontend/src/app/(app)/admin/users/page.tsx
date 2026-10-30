"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Search } from "lucide-react";
import { Alert, Avatar, Badge, Button, Card, PageHeader, PageLoader } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { formatDate, formatPhone } from "@/lib/format";
import type { User, UserStatus } from "@/lib/types";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const isAdmin = user?.role === "SUPER_ADMIN";
  const { data, error, loading } = useApi<User[]>(isAdmin ? "/user" : null);
  const [query, setQuery] = useState("");
  // Backend ro'yxatda status qaytarmaydi — o'zgartirilganlarini shu yerda eslab qolamiz
  const [statuses, setStatuses] = useState<Record<number, UserStatus>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (user && !isAdmin) router.replace("/dashboard");
  }, [user, isAdmin, router]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (u) => !q || u.fullName.toLowerCase().includes(q) || u.phone.includes(q) || String(u.id) === q,
    );
  }, [data, query]);

  if (!isAdmin) return null;

  async function setStatus(target: User, status: UserStatus) {
    setBusyId(target.id);
    try {
      await api.patch(`/user/${target.id}/status`, { status });
      setStatuses((s) => ({ ...s, [target.id]: status }));
      toast(status === "INACTIVE" ? `${target.fullName} bloklandi` : `${target.fullName} faollashtirildi`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Holatni o‘zgartirib bo‘lmadi", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Foydalanuvchilar"
        subtitle={data ? `Platformada jami ${data.length} ta foydalanuvchi` : "Platforma foydalanuvchilarini boshqarish"}
      />

      <label className="relative mb-5 block sm:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ism, telefon yoki ID"
          className="w-full rounded-xl border-0 bg-white py-2.5 pl-9 pr-3 text-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
      </label>

      {error && <Alert>{error.message}</Alert>}

      {loading && !data ? (
        <PageLoader />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Foydalanuvchi</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Ro‘yxatdan o‘tgan</th>
                  <th className="px-4 py-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((u) => {
                  const status = statuses[u.id] ?? u.status;
                  const self = u.id === user.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.fullName} src={u.avatar} seed={u.id} size={36} />
                          <div>
                            <p className="font-semibold text-slate-900">{u.fullName}</p>
                            <p className="text-xs text-slate-500">ID: {u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatPhone(u.phone)}</td>
                      <td className="px-4 py-3">
                        {u.role === "SUPER_ADMIN" ? <Badge tone="amber">Admin</Badge> : <Badge tone="slate">Foydalanuvchi</Badge>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {status && (
                            <Badge tone={status === "ACTIVE" ? "green" : "red"}>
                              {status === "ACTIVE" ? "Faol" : "Bloklangan"}
                            </Badge>
                          )}
                          {!self && u.role !== "SUPER_ADMIN" && (
                            <>
                              {status !== "INACTIVE" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-rose-600 hover:bg-rose-50"
                                  loading={busyId === u.id}
                                  onClick={() => setStatus(u, "INACTIVE")}
                                >
                                  <Ban className="size-4" /> Bloklash
                                </Button>
                              )}
                              {status !== "ACTIVE" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-emerald-700 hover:bg-emerald-50"
                                  loading={busyId === u.id}
                                  onClick={() => setStatus(u, "ACTIVE")}
                                >
                                  <CheckCircle2 className="size-4" /> Faollashtirish
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {list.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500">Foydalanuvchi topilmadi</p>}
        </Card>
      )}
    </>
  );
}
