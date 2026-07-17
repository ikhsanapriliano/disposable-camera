"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Event, Photo } from "@/lib/types";

function formatCountdown(ms: number) {
  if (ms <= 0) return "Foto sudah bisa dilihat!";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const parts = [];
  if (d > 0) parts.push(`${d}h`);
  parts.push(`${String(h).padStart(2, "0")}j`);
  parts.push(`${String(m).padStart(2, "0")}m`);
  parts.push(`${String(s).padStart(2, "0")}d`);
  return parts.join(" ");
}

export default function GalleryPage() {
  const params = useParams();
  const token = params.token as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const fetchEventAndPhotos = useCallback(async () => {
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("*")
      .eq("link_token", token)
      .single();

    if (evErr || !ev) {
      setError("Acara tidak ditemukan.");
      setLoading(false);
      return;
    }

    setEvent(ev);

    const revealTime = new Date(ev.waktu_reveal).getTime();
    const now = Date.now();
    const revealed = ev.is_revealed || now >= revealTime;

    setIsRevealed(revealed);

    if (revealed) {
      const { data: photosData, error: photosErr } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", ev.id)
        .order("created_at", { ascending: false });

      if (!photosErr && photosData) {
        setPhotos(photosData);
      }
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchEventAndPhotos();
  }, [fetchEventAndPhotos]);

  useEffect(() => {
    if (!event || isRevealed) return;

    const updateCountdown = () => {
      const revealTime = new Date(event.waktu_reveal).getTime();
      const remaining = revealTime - Date.now();
      if (remaining <= 0) {
        setIsRevealed(true);
        fetchEventAndPhotos();
      } else {
        setCountdown(formatCountdown(remaining));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event, isRevealed, fetchEventAndPhotos]);

  const downloadPhoto = async (photo: Photo, idx: number) => {
    setDownloadingId(photo.id);
    try {
      const res = await fetch(photo.url_foto);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `foto-${idx + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(photo.url_foto, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  const openViewer = (idx: number) => setViewerIndex(idx);
  const closeViewer = () => setViewerIndex(null);
  const goNext = () => setViewerIndex((prev) => (prev! + 1) % photos.length);
  const goPrev = () =>
    setViewerIndex((prev) => (prev! - 1 + photos.length) % photos.length);

  const currentPhoto = viewerIndex !== null ? photos[viewerIndex] : null;

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <p className="text-film-muted animate-pulse">Memuat galeri...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Link href="/" className="text-film-accent text-sm underline">
          Kembali
        </Link>
      </main>
    );
  }

  if (!isRevealed) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-sm">
          <div className="text-6xl mb-6">&#x1F4F8;</div>
          <h1 className="text-2xl font-serif text-film-accent mb-2">
            {event?.nama_acara}
          </h1>
          <p className="text-film-muted mb-3">
            Foto-foto belum bisa dilihat dulu. Nanti akan dibuka bersamaan
            setelah acara selesai!
          </p>
          {countdown && (
            <div className="bg-film-bg border border-film-accent/30 rounded-xl p-4 mt-4">
              <p className="text-xs text-film-muted mb-1">Waktu tersisa</p>
              <p className="text-xl font-mono text-film-accent">{countdown}</p>
            </div>
          )}
          <p className="text-film-muted/50 text-xs mt-6">
            Seperti kamera film analog &#8212; semua foto baru bisa dilihat
            setelah acara selesai.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh pb-8">
      <header className="sticky top-0 z-10 bg-film-bg/95 backdrop-blur-sm border-b border-white/5 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-serif text-film-accent">
              {event?.nama_acara}
            </h1>
            <p className="text-xs text-film-muted">
              {photos.length} foto kenangan
            </p>
          </div>
          <Link
            href={`/${token}`}
            className="text-xs text-film-accent/70 hover:text-film-accent underline"
          >
            Kamera
          </Link>
        </div>
      </header>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <p className="text-film-muted">Belum ada foto yang diambil.</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-2 py-4 columns-2 sm:columns-3 gap-2">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              className="break-inside-avoid mb-2 group relative rounded-lg overflow-hidden bg-film-muted/10 cursor-pointer"
              onClick={() => openViewer(idx)}
            >
              <img
                src={photo.url_foto}
                alt={`Foto ${idx + 1}`}
                className="w-full h-auto block"
                loading="lazy"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadPhoto(photo, idx);
                }}
                disabled={downloadingId === photo.id}
                className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
              >
                {downloadingId === photo.id ? "..." : "\u2B07"}
              </button>
            </div>
          ))}
        </div>
      )}

      {viewerIndex !== null && currentPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeViewer}
        >
          <button
            onClick={closeViewer}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg"
          >
            &#x2715;
          </button>

          <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white">
            {viewerIndex + 1} / {photos.length}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadPhoto(currentPhoto, viewerIndex);
            }}
            className="absolute top-4 right-16 z-10 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-2 rounded-lg"
          >
            &#x2B07; Download
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl"
              >
                &#x2039;
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl"
              >
                &#x203A;
              </button>
            </>
          )}

          <img
            src={currentPhoto.url_foto}
            alt={`Foto ${viewerIndex + 1}`}
            className="max-w-full max-h-full object-contain p-16"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}