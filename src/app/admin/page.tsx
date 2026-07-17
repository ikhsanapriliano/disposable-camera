"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Event } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const missingEnv =
    !supabaseUrl ||
    supabaseUrl === "https://xxxxx.supabase.co" ||
    supabaseUrl.includes("placeholder");

  const [showForm, setShowForm] = useState(false);
  const [namaAcara, setNamaAcara] = useState("");
  const [tanggalAcara, setTanggalAcara] = useState("");
  const [waktuReveal, setWaktuReveal] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchEvents = async () => {
    try {
      const { data } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });
      setEvents(data || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const generateToken = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < 8; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!namaAcara.trim() || !waktuReveal) {
      setError("Nama acara dan waktu reveal wajib diisi.");
      return;
    }

    const revealDate = new Date(waktuReveal);
    if (revealDate <= new Date()) {
      setError("Waktu reveal harus di masa depan.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_acara: namaAcara.trim(),
          tanggal_acara: tanggalAcara || null,
          waktu_reveal: revealDate.toISOString(),
          link_token: generateToken(),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal membuat event");

      setShowForm(false);
      setNamaAcara("");
      setTanggalAcara("");
      setWaktuReveal("");
      await fetchEvents();
      router.push(`/admin/${result.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <p className="text-film-muted animate-pulse">Memuat...</p>
      </main>
    );
  }

  if (missingEnv) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <div className="text-4xl mb-4">&#x26A0;</div>
          <h1 className="text-xl font-serif text-film-accent mb-3">
            Supabase Belum Dikonfigurasi
          </h1>
          <p className="text-film-muted text-sm mb-6 leading-relaxed">
            Buat file <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">.env.local</code> di folder
            project dan isi dengan kredensial Supabase. Lihat file{" "}
            <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">.env.local.example</code>{" "}
            untuk template-nya.
          </p>
          <div className="bg-white/5 rounded-lg p-3 text-left text-xs text-film-muted space-y-1">
            <p>1. Buka dashboard Supabase</p>
            <p>2. Settings &rarr; API</p>
            <p>3. Copy Project URL &amp; anon key</p>
            <p>4. Isi ke .env.local</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh pb-8">
      <header className="sticky top-0 z-10 bg-film-bg/95 backdrop-blur-sm border-b border-white/5 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-serif text-film-accent">
            Admin / Host
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-film-accent/20 border border-film-accent/50 text-film-accent rounded-lg text-sm hover:bg-film-accent/30 transition-colors"
          >
            + Buat Event
          </button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        {showForm && (
          <div className="mb-8 bg-white/5 rounded-xl p-5">
            <h2 className="text-lg font-serif text-film-accent mb-4">
              Buat Event Baru
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-film-muted mb-1">
                  Nama Acara *
                </label>
                <input
                  type="text"
                  value={namaAcara}
                  onChange={(e) => setNamaAcara(e.target.value)}
                  placeholder="Contoh: Pernikahan Budi & Ani"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-film-accent/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-film-muted mb-1">
                  Tanggal Acara
                </label>
                <input
                  type="date"
                  value={tanggalAcara}
                  onChange={(e) => setTanggalAcara(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-film-accent/50"
                />
              </div>
              <div>
                <label className="block text-xs text-film-muted mb-1">
                  Waktu Reveal (kapan foto bisa dilihat) *
                </label>
                <input
                  type="datetime-local"
                  value={waktuReveal}
                  onChange={(e) => setWaktuReveal(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-film-accent/50"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-film-accent/80 text-black rounded-lg text-sm font-medium hover:bg-film-accent transition-colors disabled:opacity-50"
                >
                  {creating ? "Membuat..." : "Buat Event"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  className="px-4 py-2.5 border border-white/10 text-film-muted rounded-lg text-sm hover:border-white/20"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-film-muted mb-3">Belum ada event.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-film-accent text-sm underline"
            >
              Buat event pertama
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => router.push(`/admin/${ev.id}`)}
                className="w-full text-left bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{ev.nama_acara}</p>
                    <p className="text-xs text-film-muted mt-1">
                      {new Date(ev.waktu_reveal).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      ev.is_revealed
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {ev.is_revealed ? "Revealed" : "Hidden"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
