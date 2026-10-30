const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

/** 1200000 → "1 200 000" */
export function formatNumber(value: number | null | undefined): string {
  return Math.round(Number(value ?? 0))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** 1200000 → "1 200 000 so‘m" */
export function formatMoney(amount: number | null | undefined): string {
  return `${formatNumber(amount)} so‘m`;
}

/** ISO sana → "15-oktabr, 2026" (Asia/Tashkent) */
export function formatDate(iso: string | null | undefined, withYear = true): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tashkent",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const base = `${get("day")}-${MONTHS[get("month") - 1]}`;
  return withYear ? `${base}, ${get("year")}` : base;
}

/** +998901234567 → "+998 90 123 45 67" */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  if (d.length !== 12) return phone;
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
}

/** +998901234567 → "+998 90 *** ** 67" — boshqa a'zolarga qisman ko'rsatish */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  if (d.length !== 12) return phone;
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} *** ** ${d.slice(10)}`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
