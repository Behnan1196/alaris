// Alaris bildirim fonksiyonu. Veritabanı tetikleyicisi (pg_net) olay türünü ve kimliğini gönderir:
//   { kind: "message", ref: "<message id>" }
//   { kind: "program", ref: "<program id>:<start_date>" }
// Fonksiyon olayı veritabanından service role ile kendisi okur, yalnızca yeni olayları ve
// her olayı bir kez (notification_log) Expo Push API'ye iletir. Bu yüzden çağrı JWT istemez.
import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_AGE_MS = 10 * 60 * 1000;

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

// Bildirim metinleri alıcının diline göre (profiles.locale).
const TEXT = {
  tr: {
    newMessage: "Yeni mesaj",
    newProgram: "Yeni program",
    programBody: (coach: string, name: string) => `${coach} sana "${name}" programını gönderdi.`,
    yourCoach: "Koçun",
  },
  en: {
    newMessage: "New message",
    newProgram: "New program",
    programBody: (coach: string, name: string) => `${coach} sent you the program "${name}".`,
    yourCoach: "Your coach",
  },
} as const;

async function localeOf(userId: string): Promise<keyof typeof TEXT> {
  const { data } = await supabase.from("profiles").select("locale").eq("id", userId).maybeSingle();
  return data?.locale === "en" ? "en" : "tr";
}

type Push = { to: string; title: string; body: string; data: Record<string, string>; sound: "default" };

async function tokensOf(userId: string) {
  const { data } = await supabase.from("push_tokens").select("token").eq("user_id", userId);
  return (data ?? []).map((r) => r.token as string);
}

/** Olayı bir kez işlemek için kayıt atar; daha önce işlendiyse false döner. */
async function claim(kind: string, ref: string) {
  const { error } = await supabase.from("notification_log").insert({ kind, ref });
  return !error;
}

async function send(messages: Push[]) {
  if (!messages.length) return;
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(messages),
  });
  const json = await res.json().catch(() => null);
  // Geçersiz cihaz kayıtlarını temizle.
  const tickets: { status: string; details?: { error?: string } }[] = json?.data ?? [];
  const dead = tickets
    .map((t, i) => (t.details?.error === "DeviceNotRegistered" ? messages[i].to : null))
    .filter((t): t is string => !!t);
  if (dead.length) await supabase.from("push_tokens").delete().in("token", dead);
}

async function handleMessage(id: string) {
  const { data: m } = await supabase
    .from("messages")
    .select("id, body, sender_id, created_at, thread:threads(id, coach_id, client_id)")
    .eq("id", id)
    .maybeSingle();
  if (!m || !m.thread || Date.now() - new Date(m.created_at).getTime() > MAX_AGE_MS) return "yok";
  const thread = m.thread as unknown as { id: string; coach_id: string; client_id: string };
  const recipient = m.sender_id === thread.coach_id ? thread.client_id : thread.coach_id;
  if (!(await claim("message", id))) return "zaten";

  const { data: sender } = await supabase.from("profiles").select("full_name").eq("id", m.sender_id).single();
  const tokens = await tokensOf(recipient);
  const lang = await localeOf(recipient);
  await send(
    tokens.map((to) => ({
      to,
      title: sender?.full_name || TEXT[lang].newMessage,
      body: m.body.length > 140 ? m.body.slice(0, 137) + "…" : m.body,
      data: { url: `/sohbet/${thread.id}` },
      sound: "default",
    })),
  );
  return `gönderildi:${tokens.length}`;
}

async function handleProgram(ref: string) {
  const [id] = ref.split(":");
  const { data: p } = await supabase
    .from("programs")
    .select("id, name, status, domain_key, updated_at, coach_id, coaching:coachings(client_id)")
    .eq("id", id)
    .maybeSingle();
  if (!p || p.status !== "active" || Date.now() - new Date(p.updated_at).getTime() > MAX_AGE_MS) return "yok";
  const clientId = (p.coaching as unknown as { client_id: string } | null)?.client_id;
  if (!clientId) return "yok";
  if (!(await claim("program", ref))) return "zaten";

  const { data: coach } = await supabase.from("profiles").select("full_name").eq("id", p.coach_id).single();
  const tokens = await tokensOf(clientId);
  const lang = await localeOf(clientId);
  await send(
    tokens.map((to) => ({
      to,
      title: TEXT[lang].newProgram,
      body: TEXT[lang].programBody(coach?.full_name ?? TEXT[lang].yourCoach, p.name),
      data: { url: "/" },
      sound: "default",
    })),
  );
  return `gönderildi:${tokens.length}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Yalnızca POST", { status: 405 });
  try {
    const { kind, ref } = await req.json();
    if (typeof ref !== "string" || !/^[0-9a-f-]{36}(:[0-9-]*)?$/.test(ref)) {
      return new Response("Geçersiz istek", { status: 400 });
    }
    const result = kind === "message" ? await handleMessage(ref) : kind === "program" ? await handleProgram(ref) : "bilinmeyen";
    return Response.json({ ok: true, result });
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false }, { status: 500 });
  }
});
