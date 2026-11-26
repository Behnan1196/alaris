import type { ComponentProps, ReactNode } from "react";

export function Field({ label, ...props }: ComponentProps<"input"> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      <input
        {...props}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900"
      />
    </label>
  );
}

export function Button({ className = "", ...props }: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={`rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 ${className}`}
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
        <p className="mb-1 text-sm font-medium text-zinc-500">Alaris · Koç paneli</p>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
