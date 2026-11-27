import { KVKK_VERSION } from "@alaris/shared";
import { LanguageSwitcher } from "@/components/language-switcher";
import { T } from "@/components/t";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 text-ink-2">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          <T k="kvkk.title" />
        </h1>
        <LanguageSwitcher />
      </div>
      <p className="mt-2 text-sm text-muted">
        <T k="kvkk.version" vars={{ version: KVKK_VERSION }} />
      </p>
      <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
        <T k="kvkk.draft" />
      </div>
      <div className="mt-6 space-y-4 text-sm leading-6">
        <p>
          <T k="kvkk.p1" />
        </p>
        <p>
          <T k="kvkk.p2" />
        </p>
        <p>
          <T k="kvkk.p3" />
        </p>
        <p>
          <T k="kvkk.p4" />
        </p>
      </div>
    </main>
  );
}
