import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { T } from "@/components/t";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Alaris</h1>
          <LanguageSwitcher />
        </div>
        <p className="mt-2 text-muted">
          <T k="web.home.tagline" />
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/giris" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white">
          <T k="web.home.coachSignIn" />
        </Link>
        <Link href="/kayit" className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium">
          <T k="web.auth.signUpAsCoach" />
        </Link>
      </div>
      <p className="text-sm text-muted">
        <T k="web.home.clientConfirmed" />
      </p>
    </main>
  );
}
