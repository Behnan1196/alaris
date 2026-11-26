import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Alaris</h1>
        <p className="mt-2 text-zinc-600">
          Koçlar için program, takip ve mesajlaşma paneli. Danışanlar Alaris mobil uygulamasını kullanır.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/giris" className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white">
          Koç girişi
        </Link>
        <Link href="/kayit" className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium">
          Koç olarak kaydol
        </Link>
      </div>
      <p className="text-sm text-zinc-500">
        Danışan olarak e-postanı onayladıysan Alaris uygulamasına dönüp giriş yapabilirsin.
      </p>
    </main>
  );
}
