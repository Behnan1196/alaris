"use client";

import { DOMAINS, type DomainKey, type MessageKey } from "@alaris/shared";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut } from "@/app/auth-actions";
import { useI18n } from "./i18n";
import { LanguageSwitcher } from "./language-switcher";

const I = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  users: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6m13 9v-1a4 4 0 0 0-3-3.87M16 4.13a3 3 0 0 1 0 5.74",
  cal: "M4 6h16v14H4zM4 10h16M8 3v4m8-4v4",
  lib: "M4 4h6v16H4zm10 0h6v16h-6z",
  msg: "M4 5h16v11H8l-4 4z",
};

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const NAV: { href: string; label: MessageKey; icon: string; match: (p: string) => boolean }[] = [
  { href: "/panel", label: "nav.overview", icon: I.home, match: (p) => p === "/panel" },
  { href: "/panel/danisanlar", label: "nav.clients", icon: I.users, match: (p) => p.startsWith("/panel/danisan") && !p.includes("/program/") },
  { href: "/panel/program", label: "nav.builder", icon: I.cal, match: (p) => p.startsWith("/panel/program") || p.includes("/program/") },
  { href: "/panel/kutuphane", label: "nav.library", icon: I.lib, match: (p) => p.startsWith("/panel/kutuphane") },
  { href: "/panel/mesajlar", label: "nav.messages", icon: I.msg, match: (p) => p.startsWith("/panel/mesajlar") },
];

export type CoachSummary = { name: string; title: string | null; domainKeys: string[]; unread: number } | null;

export function Sidebar({ coach }: { coach: CoachSummary }) {
  const { t } = useI18n();
  const path = usePathname();
  const setup = path.startsWith("/panel/kurulum") || !coach;

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-6 border-r border-line bg-page px-4 py-5">
      <Link href="/panel" className="flex items-center gap-3 px-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink font-display text-lg font-bold text-white">A</span>
        <span className="leading-tight">
          <span className="block font-display text-base font-semibold">Alaris</span>
          <span className="block text-xs text-muted">{t("nav.coachPanel")}</span>
        </span>
      </Link>

      {!setup && (
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const on = n.match(path);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? "page" : undefined}
                className={`flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                  on ? "bg-ink text-white" : "text-ink hover:bg-soft"
                }`}
              >
                <Icon d={n.icon} />
                <span className="flex-1">{t(n.label)}</span>
                {n.href === "/panel/mesajlar" && coach.unread > 0 && (
                  <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-white">{coach.unread}</span>
                )}
              </Link>
            );
          })}
        </nav>
      )}

      <div className="mt-auto flex flex-col gap-3">
        {coach && (
          <div className="rounded-xl border border-line bg-surface p-3">
            <p className="text-sm font-semibold">{[coach.title, coach.name].filter(Boolean).join(" ")}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {coach.domainKeys.map((k) => (
                <span key={k} className="flex items-center gap-1 text-xs text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DOMAINS[k as DomainKey]?.color }} />
                  {t(`domain.${k as DomainKey}`)}
                </span>
              ))}
            </div>
            <Link href="/panel/kurulum" className="mt-2 block text-xs text-muted underline">
              {t("nav.profile")}
            </Link>
          </div>
        )}
        <LanguageSwitcher />
        <form action={signOut}>
          <button className="px-1 text-sm text-muted hover:text-ink">{t("common.signOut")}</button>
        </form>
      </div>
    </aside>
  );
}

/** Üst çubuktaki danışan araması: Danışanlar sayfasına ?q= ile gider. */
export function ClientSearch({ initial = "" }: { initial?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState(initial);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/panel/danisanlar${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
      }}
      className="flex h-10 w-72 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("common.searchClient")}
        aria-label={t("common.searchClient")}
        className="flex-1 bg-transparent outline-none"
      />
    </form>
  );
}

export function TopActions({ children }: { children?: ReactNode }) {
  const { t } = useI18n();
  return (
    <>
      <ClientSearch />
      {children}
      <Link href="/panel/program" className="flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-medium text-white hover:bg-ink-2">
        <span className="text-lg leading-none">+</span> {t("nav.createProgram")}
      </Link>
    </>
  );
}

/** Veri gelene kadar gösterilen sade menü (usePathname kullanmaz; ön render'a uygun). */
export function SidebarSkeleton() {
  const { t } = useI18n();
  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-6 border-r border-line bg-page px-4 py-5">
      <div className="flex items-center gap-3 px-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink font-display text-lg font-bold text-white">A</span>
        <span className="leading-tight">
          <span className="block font-display text-base font-semibold">Alaris</span>
          <span className="block text-xs text-muted">{t("nav.coachPanel")}</span>
        </span>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map((n) => (
          <span key={n.href} className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink/60">
            <Icon d={n.icon} />
            {t(n.label)}
          </span>
        ))}
      </nav>
    </aside>
  );
}
