type StatCardProps = {
  accent?: string;
  label: string;
  note: string;
  value: string;
};

export function StatCard({
  accent = "bg-stone-950",
  label,
  note,
  value,
}: StatCardProps) {
  return (
    <article className="rounded-[1.6rem] border border-stone-200 bg-stone-50/70 p-5">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${accent}`} />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
          {label}
        </p>
      </div>
      <p className="mt-4 font-serif text-3xl tracking-tight text-stone-950">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-600">{note}</p>
    </article>
  );
}
