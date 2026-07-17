"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Event, Photo } from "@/lib/types";

export default function AdminEventPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchEvent = useCallback(async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      router.push("/admin");
      return;
    }
    setEvent(data);

    const { count } = await supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id);

    setPhotoCount(count || 0);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchEvent();

    const qrApiUrl = `/api/qr/${encodeURIComponent(id)}`;
    fetch(qrApiUrl)
      .then((r) => r.text())
      .then((svg) => setQrUrl(svg))
      .catch(() => setQrUrl(null));
  }, [id, fetchEvent]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`photos-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${id}`,
        },
        () => {
          setPhotoCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleReveal = async () => {
    if (!event) return;
    setRevealing(true);
    try {
      const res = await fetch(`/api/events/${id}/reveal`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setEvent({ ...event, is_revealed: true });
    } catch {
      alert("Gagal membuka reveal. Coba lagi.");
    } finally {
      setRevealing(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      router.push("/admin");
    } catch {
      alert("Gagal menghapus event.");
    }
  };

  const downloadQR = () => {
    if (!qrUrl) return;
    const blob = new Blob([qrUrl], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${event?.nama_acara || "event"}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadQRImage = (format: "png" | "jpeg") => {
    if (!qrUrl) return;
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(qrUrl, "image/svg+xml");
    const svgEl = svgDoc.querySelector("svg");
    if (!svgEl) return;
    svgEl.setAttribute("width", "480");
    svgEl.setAttribute("height", "480");

    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 480;
      canvas.height = 480;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 480, 480);
      ctx.drawImage(img, 0, 0, 480, 480);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = `qr-${event?.nama_acara || "event"}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          URL.revokeObjectURL(url);
        },
        `image/${format}`,
        1,
      );
    };
    img.src = url;
  };

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <p className="text-film-muted animate-pulse">Memuat...</p>
      </main>
    );
  }

  if (!event) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const cameraLink = `${baseUrl}/${event.link_token}`;
  const galleryLink = `${baseUrl}/gallery/${event.link_token}`;

  return (
    <main className="min-h-dvh pb-8">
      <header className="sticky top-0 z-10 bg-film-bg/95 backdrop-blur-sm border-b border-white/5 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="text-film-muted hover:text-film-accent text-sm"
            >
              &larr; Kembali
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-film-accent mb-1">
            {event.nama_acara}
          </h1>
          <p className="text-xs text-film-muted">
            Dibuat {new Date(event.created_at).toLocaleDateString("id-ID")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-film-muted mb-1">Total Foto</p>
            <p className="text-2xl font-mono text-film-accent">{photoCount}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-film-muted mb-1">Status</p>
            <p
              className={`text-sm ${
                event.is_revealed ? "text-green-400" : "text-yellow-400"
              }`}
            >
              {event.is_revealed ? "Sudah Reveal" : "Belum Reveal"}
            </p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <p className="text-xs text-film-muted">Waktu Reveal</p>
          <p className="text-sm">
            {new Date(event.waktu_reveal).toLocaleString("id-ID", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
          {!event.is_revealed && (
            <button
              onClick={handleReveal}
              disabled={revealing}
              className="w-full py-2 bg-film-accent/20 border border-film-accent/50 text-film-accent rounded-lg text-sm hover:bg-film-accent/30 transition-colors disabled:opacity-50"
            >
              {revealing ? "Memproses..." : "Buka Reveal Sekarang (Override)"}
            </button>
          )}
        </div>

        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <p className="text-xs text-film-muted mb-2">QR Code untuk Tamu</p>
          {qrUrl && (
            <div
              className="bg-white p-4 rounded-lg flex justify-center"
              dangerouslySetInnerHTML={{ __html: qrUrl }}
            />
          )}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={downloadQR}
              disabled={!qrUrl}
              className="flex-1 py-2 bg-film-accent/20 border border-film-accent/50 text-film-accent rounded-lg text-sm hover:bg-film-accent/30 transition-colors"
            >
              Download SVG
            </button>
            <button
              onClick={() => downloadQRImage("png")}
              disabled={!qrUrl}
              className="flex-1 py-2 bg-film-accent/20 border border-film-accent/50 text-film-accent rounded-lg text-sm hover:bg-film-accent/30 transition-colors"
            >
              Download PNG
            </button>
            <button
              onClick={() => downloadQRImage("jpeg")}
              disabled={!qrUrl}
              className="flex-1 py-2 bg-film-accent/20 border border-film-accent/50 text-film-accent rounded-lg text-sm hover:bg-film-accent/30 transition-colors"
            >
              Download JPEG
            </button>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <p className="text-xs text-film-muted">Link</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-film-muted/70 mb-1">Link Kamera:</p>
              <input
                readOnly
                value={cameraLink}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
            <div>
              <p className="text-xs text-film-muted/70 mb-1">Link Galeri:</p>
              <input
                readOnly
                value={galleryLink}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-400/70 text-sm hover:text-red-400"
          >
            Hapus Event
          </button>
          {showDeleteConfirm && (
            <div className="mt-2 flex items-center gap-3">
              <p className="text-xs text-red-400">Yakin?</p>
              <button
                onClick={handleDelete}
                className="text-xs bg-red-600 text-white px-3 py-1 rounded"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs text-film-muted"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
