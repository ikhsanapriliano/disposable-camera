import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-serif text-film-accent mb-3">
          Kamera Sekali Pakai
        </h1>
        <p className="text-film-muted mb-8 text-sm leading-relaxed">
          Ambil foto kenangan di acara pernikahan ini. Buka link yang diberikan
          oleh tuan rumah untuk mulai memotret.
        </p>
        {/* <div className="space-y-4">
          <Link
            href="/admin"
            className="block w-full py-3 px-6 bg-film-accent/20 border border-film-accent/50 text-film-accent rounded-lg text-sm hover:bg-film-accent/30 transition-colors"
          >
            Halaman Admin / Host
          </Link>
          <p className="text-film-muted/50 text-xs">
            Tamu: buka link atau scan QR code dari tuan rumah
          </p>
        </div> */}
      </div>
    </main>
  );
}
