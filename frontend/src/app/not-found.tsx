import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <LogoMark size={64} className="mx-auto" />
        <p className="mt-6 text-6xl font-extrabold text-slate-900">404</p>
        <p className="mt-2 text-slate-500">Bu sahifa topilmadi.</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}
