import type { ReactNode } from "react";

type SurfaceProps = {
  children: ReactNode;
  description?: string;
  title: string;
};

export function Surface({ children, description, title }: SurfaceProps) {
  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_16px_40px_rgba(79,54,32,0.05)]">
      <div className="mb-5">
        <h3 className="font-serif text-2xl tracking-tight text-stone-950">
          {title}
        </h3>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
