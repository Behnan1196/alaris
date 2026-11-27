import type { ComponentProps, ReactNode } from "react";

export function Field({ label, ...props }: ComponentProps<"input"> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink-2">{label}</span>
      <input
        {...props}
        className="rounded-xl border border-line bg-white px-3 py-2 text-base outline-none focus:border-ink"
      />
    </label>
  );
}

export function Button({ className = "", ...props }: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink-2 disabled:opacity-50 ${className}`}
    />
  );
}

export function Notice({ kind, children }: { kind: "error" | "info"; children: ReactNode }) {
  const cls = kind === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800";
  return <p className={`rounded-lg px-3 py-2 text-sm ${cls}`}>{children}</p>;
}

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="mb-1 text-sm font-medium text-muted">Alaris · Koç paneli</p>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** Sayfa başlığı: küçük üst satır, büyük başlık, sağda eylemler. */
export function PageHeader({ crumb, title, actions }: { crumb?: ReactNode; title: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {crumb && <div className="text-sm text-muted">{crumb}</div>}
        <h1 className="mt-0.5 text-3xl font-semibold tracking-tight">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Sayfa içeriği kabı. */
export function PageBody({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto flex w-full flex-col gap-6 px-8 py-8 ${wide ? "max-w-none" : "max-w-6xl"}`}>{children}</div>;
}
