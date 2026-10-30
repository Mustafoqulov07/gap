"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Copy, LogOut, Monitor, Smartphone, Trash2 } from "lucide-react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  PageLoader,
  PhoneInput,
  isValidPhone,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { formatDate, formatPhone } from "@/lib/format";
import type { Device, User } from "@/lib/types";

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const devices = useApi<Device[]>("/device");

  if (!user) return null;

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      toast("Faqat JPG, PNG yoki WebP rasm yuklang", "error");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast("Rasm hajmi 5 MB dan oshmasin", "error");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    if (fullName.trim().length < 3) return setError("Ism va familiyani kiriting");
    if (!isValidPhone(phone)) return setError("Telefon raqamni to‘liq kiriting");

    const form = new FormData();
    if (fullName.trim() !== user.fullName) form.append("fullName", fullName.trim());
    if (phone !== user.phone) form.append("phone", phone);
    if (file) form.append("file", file);
    if ([...form.keys()].length === 0) return toast("O‘zgarish yo‘q");

    setSaving(true);
    try {
      const res = await api.patch<{ data?: User } & Partial<User>>(`/user/${user.id}`, form);
      const updated = (res.data ?? res) as User;
      setUser({ ...user, ...updated });
      setFile(null);
      setPreview(null);
      toast("Profil yangilandi");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  async function removeDevice(id: number) {
    try {
      await api.delete(`/device/${id}`);
      toast("Qurilma uzildi");
      devices.reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Qurilmani uzib bo‘lmadi", "error");
    }
  }

  async function deleteAccount() {
    if (!user) return;
    setDeleting(true);
    try {
      await api.delete(`/user/${user.id}`);
      setUser(null);
      toast("Hisobingiz o‘chirildi");
      router.replace("/");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Hisobni o‘chirib bo‘lmadi", "error");
      setDeleting(false);
    }
  }

  function copyId() {
    navigator.clipboard?.writeText(String(user?.id)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <>
      <PageHeader title="Profil" subtitle="Shaxsiy ma‘lumotlar va xavfsizlik" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center text-center lg:self-start">
          <div className="relative">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="size-24 rounded-full object-cover" />
            ) : (
              <Avatar name={user.fullName} src={user.avatar} seed={user.id} size={96} />
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 grid size-9 place-items-center rounded-full bg-emerald-600 text-white shadow-md ring-4 ring-white hover:bg-emerald-700"
              aria-label="Rasmni o‘zgartirish"
            >
              <Camera className="size-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickFile} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">{user.fullName}</h2>
          <p className="text-sm text-slate-500">{formatPhone(user.phone)}</p>
          {user.role === "SUPER_ADMIN" && (
            <div className="mt-2">
              <Badge tone="amber">Platforma admini</Badge>
            </div>
          )}

          <div className="mt-5 w-full rounded-2xl bg-emerald-50 p-4 text-left">
            <p className="text-xs font-medium text-emerald-800">Sizning ID raqamingiz</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-2xl font-extrabold text-emerald-900">#{user.id}</span>
              <button
                onClick={copyId}
                className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Nusxalandi" : "Nusxalash"}
              </button>
            </div>
            <p className="mt-2 text-xs text-emerald-800/80">
              Tashkilotchi sizni davraga qo‘shishi uchun shu raqamni yuboring.
            </p>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h3 className="mb-4 font-bold text-slate-900">Shaxsiy ma‘lumotlar</h3>
            <form onSubmit={save} className="space-y-4">
              {error && <Alert>{error}</Alert>}
              {file && <Alert tone="green">Yangi rasm tanlandi: {file.name}</Alert>}
              <Input label="Ism va familiya" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <PhoneInput value={phone} onChange={setPhone} />
              <div className="flex justify-end">
                <Button type="submit" loading={saving}>
                  Saqlash
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <h3 className="font-bold text-slate-900">Faol qurilmalar</h3>
            <p className="mb-4 text-sm text-slate-500">Hisobingizga kirilgan qurilmalar. Tanimagan qurilmani uzib qo‘ying.</p>
            {devices.loading && !devices.data ? (
              <PageLoader />
            ) : devices.error ? (
              <Alert>{devices.error.message}</Alert>
            ) : (
              <ul className="divide-y divide-slate-100">
                {devices.data?.map((d) => {
                  const current = d.id === user.deviceId;
                  const mobile = /android|ios|iphone|mobile/i.test(d.device);
                  const Icon = mobile ? Smartphone : Monitor;
                  return (
                    <li key={d.id} className="flex items-center gap-3 py-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{d.device}</p>
                        <p className="text-xs text-slate-500">Kirilgan: {formatDate(d.createdAt)}</p>
                      </div>
                      {current ? (
                        <Badge tone="green">Joriy</Badge>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => removeDevice(d.id)}>
                          Uzish
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">Hisob</h3>
              <p className="text-sm text-slate-500">Tizimdan chiqish yoki hisobni butunlay o‘chirish.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={logout}>
                <LogOut className="size-4" /> Chiqish
              </Button>
              <Button variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" /> O‘chirish
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={confirmDelete} onClose={() => !deleting && setConfirmDelete(false)} title="Hisobni o‘chirish">
        <p className="text-sm text-slate-600">
          Hisobingiz va unga bog‘liq ma‘lumotlar butunlay o‘chiriladi. Bu amalni ortga qaytarib bo‘lmaydi.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" block onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Bekor qilish
          </Button>
          <Button variant="danger" block loading={deleting} onClick={deleteAccount}>
            O‘chirish
          </Button>
        </div>
      </Modal>
    </>
  );
}
