"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ModalLauncherProps = {
  children: ReactNode;
  description?: string;
  panelClassName?: string;
  title: string;
  triggerClassName?: string;
  triggerLabel: string;
};

export function ModalLauncher({
  children,
  description,
  panelClassName = "max-w-4xl",
  title,
  triggerClassName = "",
  triggerLabel,
}: ModalLauncherProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 px-4 py-6 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_25px_80px_rgba(79,54,32,0.16)] ${panelClassName}`}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-5 sm:px-7">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                      Focused form
                    </p>
                    <h3 className="mt-2 font-serif text-3xl tracking-tight text-stone-950">
                      {title}
                    </h3>
                    {description ? (
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                        {description}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                  >
                    Close
                  </button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                  {children}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
