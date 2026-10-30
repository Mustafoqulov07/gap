import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Eye,
  ListOrdered,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";

const steps = [
  {
    icon: Users,
    title: "Davra yarating",
    text: "Nomi, oylik badal va a‘zolar sonini belgilang. Do‘stlaringizni ID orqali qo‘shing.",
  },
  {
    icon: ListOrdered,
    title: "Navbat qur‘a bilan",
    text: "Tizim navbatni tasodifiy aralashtiradi — hech kim bahslashmaydi, hammasi shaffof.",
  },
  {
    icon: CalendarCheck,
    title: "Har oy to‘lang va oling",
    text: "Kim to‘ladi, kim oldi — har bir raund yozib boriladi, tarix hech qachon yo‘qolmaydi.",
  },
];

const features = [
  {
    icon: Eye,
    title: "To‘liq shaffoflik",
    text: "Har bir a‘zo o‘z holatini, navbatini va to‘lovlar tarixini istalgan payt ko‘radi.",
  },
  {
    icon: ShieldCheck,
    title: "Xavfsiz sessiyalar",
    text: "Parollar shifrlangan, qurilmalar ro‘yxatini ko‘rib, keraksizini uzib qo‘yishingiz mumkin.",
  },
  {
    icon: Smartphone,
    title: "Telefon uchun qulay",
    text: "Bir qo‘lda ishlatiladigan interfeys: asosiy amallar 3 bosqichdan oshmaydi.",
  },
];

const orbitMembers = ["AK", "DN", "SM", "JT", "NR", "OB"];

function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      <div className="absolute inset-6 rounded-full bg-gradient-to-br from-emerald-200/60 to-teal-100/40 blur-2xl" />
      <div className="absolute inset-8 rounded-full border-2 border-dashed border-emerald-300/70" />
      <div className="orbit absolute inset-8">
        {orbitMembers.map((m, i) => {
          const angle = (i / orbitMembers.length) * 2 * Math.PI - Math.PI / 2;
          const x = 50 + 50 * Math.cos(angle);
          const y = 50 + 50 * Math.sin(angle);
          const receiver = i === 0;
          return (
            <div
              key={m}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="orbit-reverse">
                <div
                  className={
                    receiver
                      ? "grid size-14 place-items-center rounded-full bg-amber-400 text-sm font-bold text-amber-950 shadow-lg shadow-amber-400/40 ring-4 ring-white"
                      : "grid size-12 place-items-center rounded-full bg-white text-sm font-semibold text-emerald-700 shadow-md ring-4 ring-emerald-50"
                  }
                >
                  {m}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute inset-0 grid place-items-center">
        <div className="rounded-3xl bg-white/90 p-5 text-center shadow-xl ring-1 ring-slate-200 backdrop-blur">
          <LogoMark size={56} className="mx-auto" />
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            Bu oy oluvchi
          </p>
          <p className="text-2xl font-extrabold text-slate-900">6 000 000 so‘m</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo size={34} />
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Kirish
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Ro‘yxatdan o‘tish
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative">
        <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-emerald-50 to-transparent" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Gap endi qog‘ozda emas
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
              Davra jamg‘armasini{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                shaffof va ishonchli
              </span>{" "}
              boshqaring
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600">
              Kim to‘ladi, kimning navbati, qachon olasiz — hammasi bir ekranda. Telegram
              guruhdagi hisob-kitob va bahslarga barham bering.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-600 px-6 font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700"
              >
                Bepul boshlash <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center rounded-xl bg-white px-6 font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Hisobim bor
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                ["100%", "shaffof tarix"],
                ["3", "bosqichda to‘lov"],
                ["24/7", "holatni ko‘rish"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-2xl font-extrabold text-slate-900">{v}</dt>
                  <dd className="text-xs text-slate-500">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
          Qanday ishlaydi?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">
          Uch oddiy qadam — va davrangiz raqamli nazoratda.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <span className="absolute right-5 top-5 text-5xl font-extrabold text-slate-100">
                {i + 1}
              </span>
              <div className="grid size-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
                <s.icon className="size-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="flex gap-4 rounded-3xl p-2">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <f.icon className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 py-12 text-center text-white sm:px-12">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-10 size-56 rounded-full bg-amber-300/20" />
          <h2 className="relative text-3xl font-bold tracking-tight">Birinchi davrangizni bugun oching</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-emerald-50/90">
            Ro‘yxatdan o‘tish bir daqiqa oladi. Telefon raqam va parol — boshqa hech narsa kerak emas.
          </p>
          <Link
            href="/register"
            className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-amber-400 px-6 font-semibold text-amber-950 shadow-lg hover:bg-amber-300"
          >
            Hoziroq boshlash <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row">
          <Logo size={28} />
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} GapPay. Barcha huquqlar himoyalangan.</p>
        </div>
      </footer>
    </div>
  );
}
