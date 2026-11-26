import { DOMAINS, type DomainKey } from "@alaris/shared";
import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui";
import { requireCoach } from "@/lib/coach";
import { signOut } from "../auth-actions";
import { InviteForm } from "./invite-form";

const STATUS_LABELS: Record<string, string> = {
  invited: "Davet edildi",
  active: "Aktif",
  paused: "Duraklatıldı",
  ended: "Bitti",
};

function DomainTag({ k }: { k: string }) {
  const d = DOMAINS[k as DomainKey];
  if (!d) return null;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: d.color }}
    >
      {d.name}
    </span>
  );
}

const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" });

async function Content() {
  const coach = await requireCoach();
  const { supabase, userId } = coach;

  const [{ data: coachings }, { data: invites }] = await Promise.all([
    supabase
      .from("coachings")
      .select("id, status, started_at, client:profiles!coachings_client_id_fkey(full_name), coaching_domains(domain_key)")
      .eq("coach_id", userId)
      .order("started_at", { ascending: false }),
    supabase
      .from("invites")
      .select("id, code, domain_keys, expires_at")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">Alaris · Koç paneli</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Merhaba, {[coach.title, coach.name].filter(Boolean).join(" ")}
          </h1>
          <div className="mt-2 flex gap-1.5">
            {coach.domainKeys.map((k) => (
              <DomainTag key={k} k={k} />
            ))}
            <Link href="/panel/kurulum" className="ml-2 text-xs text-zinc-500 underline">
              Alanları düzenle
            </Link>
          </div>
        </div>
        <form action={signOut}>
          <button className="text-sm text-zinc-600 underline">Çıkış yap</button>
        </form>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <Card title={`Danışanlar (${coachings?.length ?? 0})`}>
          {!coachings?.length ? (
            <p className="text-sm text-zinc-500">
              Henüz danışanın yok. Bir davet kodu oluşturup danışanınla paylaş.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-zinc-500">
                <tr>
                  <th className="pb-2 font-medium">Danışan</th>
                  <th className="pb-2 font-medium">Alanlar</th>
                  <th className="pb-2 font-medium">Başlangıç</th>
                  <th className="pb-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {coachings.map((c) => (
                  <tr key={c.id} className="border-t border-zinc-100">
                    <td className="py-2.5 font-medium">
                      <Link href={`/panel/danisan/${c.id}`} className="hover:underline">
                        {c.client?.full_name || "İsimsiz"}
                      </Link>
                    </td>
                    <td className="py-2.5">
                      <div className="flex gap-1">
                        {c.coaching_domains.map((d) => (
                          <DomainTag key={d.domain_key} k={d.domain_key} />
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 text-zinc-600">{dateFmt.format(new Date(c.started_at))}</td>
                    <td className="py-2.5 text-zinc-600">{STATUS_LABELS[c.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card title="Danışan davet et">
            <InviteForm domainKeys={coach.domainKeys} />
          </Card>
          {!!invites?.length && (
            <Card title="Kullanılmamış davetler">
              <ul className="flex flex-col gap-3 text-sm">
                {invites.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold tracking-widest">{i.code}</span>
                    <span className="flex gap-1">
                      {i.domain_keys.map((k) => (
                        <DomainTag key={k} k={k} />
                      ))}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {dateFmt.format(new Date(i.expires_at))}e kadar
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <main className="flex-1 bg-zinc-50">
      <Suspense fallback={<p className="p-10 text-sm text-zinc-500">Yükleniyor…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}
