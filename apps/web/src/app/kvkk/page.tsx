import { KVKK_VERSION } from "@alaris/shared";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 text-zinc-800">
      <h1 className="text-2xl font-semibold">Aydınlatma metni ve açık rıza</h1>
      <p className="mt-2 text-sm text-zinc-500">Sürüm: {KVKK_VERSION}</p>
      <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
        Taslak metin. Yayından önce bir KVKK danışmanı veya avukat tarafından hazırlanacak.
      </div>
      <div className="mt-6 space-y-4 text-sm leading-6">
        <p>
          Alaris; ad, e-posta ve koçluk sürecinde paylaştığın verileri (program, görev kayıtları,
          mesajlar) koçluk hizmetinin sunulması amacıyla işler.
        </p>
        <p>
          Kilo, vücut ölçüleri, beslenme kayıtları ve fotoğraflar gibi sağlık verileri, yalnızca ayrıca
          açık rıza verdiğinde ve yalnızca bağlandığın koçla paylaşılmak üzere işlenir.
        </p>
        <p>
          Bir koç, başka bir koçla yürüttüğün koçluğun ayrıntılarını yalnızca sen izin verirsen görür.
          İznini istediğin zaman geri alabilirsin.
        </p>
        <p>Verilerini görüntüleme, indirme ve hesabını silme hakkın vardır.</p>
      </div>
    </main>
  );
}
