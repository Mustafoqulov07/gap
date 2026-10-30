import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 top-24 size-96 rounded-full border-[40px] border-white/5" />
        <div className="absolute -bottom-24 -left-16 size-80 rounded-full bg-amber-300/15 blur-2xl" />
        <Logo size={40} inverted />
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            “Men qachon to‘layman va qachon olaman?”
          </h2>
          <p className="mt-4 max-w-md text-emerald-50/85">
            GapPay bu savolga kirgan zahoti javob beradi. Davra, navbat va to‘lovlar — bitta joyda.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {["Navbat qur'a bilan, adolatli", "Har bir to'lov tarixda saqlanadi", "Qurilmalar ustidan to'liq nazorat"].map(
              (t) => (
                <li key={t} className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-amber-300" />
                  {t.replace(/'/g, "‘")}
                </li>
              ),
            )}
          </ul>
        </div>
        <p className="relative text-sm text-emerald-100/70">© GapPay</p>
      </aside>
      <main className="flex flex-col px-4 py-8 sm:px-8">
        <div className="lg:hidden">
          <Logo size={34} />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
