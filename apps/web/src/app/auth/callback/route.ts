import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// E-posta onay bağlantısı buraya döner (PKCE kodu oturuma çevrilir).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/panel";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/panel";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  // Bağlantı başka bir tarayıcıda açıldıysa e-posta yine de onaylanmıştır; girişe yönlendir.
  return NextResponse.redirect(`${origin}/giris?onay=1`);
}
