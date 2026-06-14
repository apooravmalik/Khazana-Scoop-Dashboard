type StatusPillProps = {
  tone: "danger" | "neutral" | "success" | "warning";
  value: string;
};

const toneClasses: Record<StatusPillProps["tone"], string> = {
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  neutral: "bg-stone-100 text-stone-700 ring-stone-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
};

export function StatusPill({ tone, value }: StatusPillProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${toneClasses[tone]}`}
    >
      {value}
    </span>
  );
}
