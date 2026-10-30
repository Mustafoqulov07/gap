import { useId } from "react";
import Link from "next/link";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * GapPay belgisi: "G" harfi davra (navbat aylanishi) shaklida,
 * tepasida esa davraga tushayotgan oltin tanga.
 */
export function LogoMark({ size = 40, className }: LogoMarkProps) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#34D399" />
          <stop offset="0.55" stopColor="#059669" />
          <stop offset="1" stopColor="#065F46" />
        </linearGradient>
        <linearGradient id={`coin${id}`} x1="42" y1="10" x2="54" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FDE68A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#bg${id})`} />
      <rect x="1" y="1" width="62" height="62" rx="17" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" />
      <path
        d="M41.11 22.89A15 15 0 1 0 45.5 33.5H32"
        stroke="#fff"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="16" r="6" fill={`url(#coin${id})`} />
      <circle cx="48" cy="16" r="3.4" stroke="#B45309" strokeOpacity="0.45" strokeWidth="1.2" />
    </svg>
  );
}

interface LogoProps extends LogoMarkProps {
  href?: string;
  /** Qorong'i fonda ishlatish uchun oq matn */
  inverted?: boolean;
}

export function Logo({ size = 36, className = "", href = "/", inverted = false }: LogoProps) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 ${className}`} aria-label="GapPay bosh sahifa">
      <LogoMark size={size} />
      <span
        className="font-extrabold tracking-tight"
        style={{ fontSize: size * 0.62, lineHeight: 1 }}
      >
        <span className={inverted ? "text-white" : "text-slate-900"}>Gap</span>
        <span
          className={
            inverted
              ? "text-emerald-300"
              : "bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
          }
        >
          Pay
        </span>
      </span>
    </Link>
  );
}
