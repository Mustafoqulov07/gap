"use client";

import {
  forwardRef,
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { mediaUrl } from "@/lib/api";
import { initials } from "@/lib/format";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ---------------------------------- Button --------------------------------- */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";

const variants: Record<Variant, string> = {
  primary:
    "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-700 focus-visible:ring-emerald-500",
  secondary:
    "bg-white text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus-visible:ring-emerald-500",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-emerald-500",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500",
  gold: "bg-amber-400 text-amber-950 shadow-sm shadow-amber-500/30 hover:bg-amber-300 focus-visible:ring-amber-500",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, block, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        block && "w-full",
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
});

/* ---------------------------------- Inputs --------------------------------- */

interface FieldProps {
  label?: string;
  hint?: ReactNode;
  error?: string;
}

const inputBase =
  "block w-full rounded-xl border-0 bg-white px-3.5 py-3 text-[15px] text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 transition focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(
  function Input({ label, hint, error, className, id, ...props }, ref) {
    const inputId = id ?? props.name;
    return (
      <label className="block" htmlFor={inputId}>
        {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cn(inputBase, error && "ring-rose-400 focus:ring-rose-500", className)}
          {...props}
        />
        {error ? (
          <span className="mt-1.5 block text-xs text-rose-600">{error}</span>
        ) : hint ? (
          <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>
        ) : null}
      </label>
    );
  },
);

export function Textarea({
  label,
  hint,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
      <textarea className={cn(inputBase, "min-h-24 resize-y", className)} {...props} />
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

/** O'zbekiston telefon raqami: "+998" prefiksi qotirilgan, qiymat +998XXXXXXXXX ko'rinishida */
export function PhoneInput({
  value,
  onChange,
  label = "Telefon raqam",
  error,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  autoFocus?: boolean;
}) {
  const local = value.replace(/^\+?998/, "").replace(/\D/g, "").slice(0, 9);
  const pretty = [local.slice(0, 2), local.slice(2, 5), local.slice(5, 7), local.slice(7, 9)]
    .filter(Boolean)
    .join(" ");
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div
        className={cn(
          "flex items-center rounded-xl bg-white ring-1 ring-inset ring-slate-200 transition focus-within:ring-2 focus-within:ring-emerald-500",
          error && "ring-rose-400",
        )}
      >
        <span className="pl-3.5 pr-2 text-[15px] font-medium text-slate-500">+998</span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          placeholder="90 123 45 67"
          value={pretty}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
            onChange(digits ? `+998${digits}` : "");
          }}
          className="w-full rounded-r-xl border-0 bg-transparent py-3 pr-3.5 text-[15px] tracking-wide text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      {error && <span className="mt-1.5 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export function isValidPhone(phone: string) {
  return /^\+998\d{9}$/.test(phone);
}

/* ---------------------------------- Layout --------------------------------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      {icon && (
        <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------------------------- Status --------------------------------- */

type Tone = "green" | "amber" | "red" | "slate" | "blue";

const tones: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
};

const dots: Record<Tone, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
  slate: "bg-slate-400",
  blue: "bg-sky-500",
};

export function Badge({ tone = "slate", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        tones[tone],
      )}
    >
      <span className={cn("size-1.5 rounded-full", dots[tone])} />
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className ?? "size-5")} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center text-emerald-600">
      <Spinner className="size-7" />
    </div>
  );
}

export function Alert({ tone = "red", children }: { tone?: "red" | "green" | "amber"; children: ReactNode }) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl px-4 py-3 text-sm",
        tone === "red" && "bg-rose-50 text-rose-700",
        tone === "green" && "bg-emerald-50 text-emerald-800",
        tone === "amber" && "bg-amber-50 text-amber-800",
      )}
    >
      {children}
    </div>
  );
}

/* ---------------------------------- Avatar --------------------------------- */

const avatarColors = [
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-800",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

export function Avatar({
  name,
  src,
  size = 40,
  seed = 0,
  className,
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
  seed?: number;
  className?: string;
}) {
  const url = mediaUrl(src);
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold",
        avatarColors[Math.abs(seed) % avatarColors.length],
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name ?? ""} className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/* ---------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button
        aria-label="Yopish"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:max-w-md sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Yopish"
          >
            <svg viewBox="0 0 20 20" className="size-5" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
