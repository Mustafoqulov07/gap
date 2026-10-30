"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LogOut, Shield, User, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar, PageLoader, cn } from "@/components/ui";
import { useAuth } from "@/lib/auth";

const baseNav = [
  { href: "/dashboard", label: "Bosh sahifa", icon: Home },
  { href: "/gaps", label: "Davralar", icon: Users },
  { href: "/profile", label: "Profil", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout, refreshUser } = useAuth();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, user, router, pathname]);

  useEffect(() => {
    if (ready && user) refreshUser().catch(() => {});
    // faqat birinchi yuklanishda profilni yangilaymiz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready || !user) return <PageLoader />;

  const nav =
    user.role === "SUPER_ADMIN"
      ? [...baseNav.slice(0, 2), { href: "/admin/users", label: "Admin", icon: Shield }, baseNav[2]]
      : baseNav;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/70 bg-white px-4 py-6 lg:flex">
        <Logo size={34} href="/dashboard" className="px-2" />
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                isActive(item.href)
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
          <Avatar name={user.fullName} src={user.avatar} seed={user.id} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
            <p className="text-xs text-slate-500">ID: {user.id}</p>
          </div>
          <button
            onClick={logout}
            className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-rose-600"
            title="Chiqish"
            aria-label="Chiqish"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur lg:hidden">
        <Logo size={28} href="/dashboard" />
        <Link href="/profile" aria-label="Profil">
          <Avatar name={user.fullName} src={user.avatar} seed={user.id} size={32} />
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
                isActive(item.href) ? "text-emerald-700" : "text-slate-500",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
