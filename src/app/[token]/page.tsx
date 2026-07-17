"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { captureFrameWithVintageFilter } from "@/lib/vintage-filter";
import { Event } from "@/lib/types";

const MAX_PHOTOS = 5;

function getStorageKey(token: string) {
  return `disposable-camera-${token}-count`;
}

function getStorageSessionId(token: string): string {
  const key = `disposable-camera-${token}-session`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function CameraPage() {
  const params = useParams();
  const token = params.token as string;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [flash, setFlash] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [showThanks, setShowThanks] = useState(false);

  useEffect(() => {
    const stored = parseInt(
      localStorage.getItem(getStorageKey(token)) || "0",
      10,
    );
    setPhotoCount(stored);
  }, [token]);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const { data, error: err } = await supabase
          .from("events")
          .select("*")
          .eq("link_token", token)
          .single();

        if (err || !data) {
          setError("Acara tidak ditemukan. Periksa kembali link Anda.");
          setLoading(false);
          return;
        }
        setEvent(data);
      } catch {
        setError("Gagal terhubung. Pastikan Supabase sudah dikonfigurasi.");
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [token]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(
    async (mode: "user" | "environment") => {
      stopCamera();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setError(
          "Tidak bisa mengakses kamera. Pastikan Anda memberikan izin kamera.",
        );
      }
    },
    [stopCamera],
  );

  useEffect(() => {
    startCamera(facingMode);
    return () => stopCamera();
  }, [facingMode, startCamera, stopCamera]);

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const takePhoto = useCallback(async () => {
    if (uploading || !videoRef.current || !event) return;
    if (photoCount >= MAX_PHOTOS) {
      setError(`Batas foto tercapai (${MAX_PHOTOS} foto).`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const blob = await captureFrameWithVintageFilter(
        videoRef.current,
        1600,
        Math.round(
          (1600 * (videoRef.current.videoHeight || 720)) /
            (videoRef.current.videoWidth || 1280),
        ),
        event?.nama_acara,
      );

      const file = new File([blob], `${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      setFlash(true);
      setTimeout(() => setFlash(false), 150);

      const sessionId = getStorageSessionId(token);
      const filePath = `events/${event.id}/${sessionId}/${file.name}`;

      const { error: uploadErr } = await supabase.storage
        .from("photos")
        .upload(filePath, file, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath);

      await supabase.from("photos").insert({
        event_id: event.id,
        url_foto: urlData.publicUrl,
        guest_session_id: sessionId,
      });

      const newCount = photoCount + 1;
      setPhotoCount(newCount);
      localStorage.setItem(getStorageKey(token), String(newCount));
      setSavedMessage(`Foto ${newCount}/${MAX_PHOTOS} tersimpan!`);
      setTimeout(() => setSavedMessage(null), 2500);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan foto. Coba lagi.");
    } finally {
      setUploading(false);
    }
  }, [uploading, videoRef, event, photoCount, token]);

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <p className="text-film-muted animate-pulse">Memuat...</p>
      </main>
    );
  }

  if (error && !event) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
      </main>
    );
  }

  if (showThanks) {
    const galleryUrl = typeof window !== "undefined"
      ? `${window.location.origin}/gallery/${token}`
      : "";

    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-black">
        <div className="max-w-sm">
          <div className="text-5xl mb-4">&#x1F4F8;</div>
          <h2 className="text-2xl font-serif text-film-accent mb-2">
            Terima Kasih!
          </h2>
          <p className="text-film-muted text-sm leading-relaxed mb-2">
            Kamu sudah mengambil {photoCount} foto di acara ini.
          </p>
          <p className="text-film-muted/50 text-xs mb-6">
            Foto-foto akan bisa dilihat setelah acara selesai.
            Nanti buka lagi link yang sama ya!
          </p>
          <a
            href={galleryUrl}
            className="inline-block px-5 py-2.5 bg-film-accent/20 border border-film-accent/40 text-film-accent rounded-full text-sm hover:bg-film-accent/30 transition-colors"
          >
            Lihat Galeri
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh flex flex-col bg-black">
      {flash && (
        <div className="absolute inset-0 z-50 bg-white animate-flash pointer-events-none" />
      )}

      <div className="relative flex-1">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-[8%_10%] border-[3px] border-[#d4c5a9]/70 shadow-[inset_0_0_60px_rgba(0,0,0,0.4)] pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover hidden"
        />

        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <div className="bg-black/50 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs text-white/80">
            {event?.nama_acara || "Kamera Pernikahan"}
          </div>
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={switchCamera}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-lg"
            aria-label="Ganti kamera"
          >
            &#x21C4;
          </button>
          <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white text-center">
            {photoCount}/{MAX_PHOTOS}
          </div>
        </div>
      </div>

      {savedMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-600/90 text-white px-5 py-2 rounded-full text-sm font-medium backdrop-blur-sm z-40 animate-fade-in">
          {savedMessage}
        </div>
      )}

      {error && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-4 py-2 rounded-lg text-xs backdrop-blur-sm z-40 max-w-[90vw] text-center">
          {error}
        </div>
      )}

      <div className="pb-8 pt-4 flex flex-col items-center gap-3 bg-gradient-to-t from-black via-black to-transparent">
        <button
          onClick={takePhoto}
          disabled={uploading || photoCount >= MAX_PHOTOS}
          className={`w-20 h-20 rounded-full border-[3px] transition-all duration-200 flex items-center justify-center
            ${
              uploading || photoCount >= MAX_PHOTOS
                ? "border-film-muted/30 bg-film-muted/20"
                : "border-white bg-white/20 hover:bg-white/30 active:scale-95"
            }`}
          aria-label="Ambil foto"
        >
          <div
            className={`w-16 h-16 rounded-full transition-colors ${
              uploading || photoCount >= MAX_PHOTOS
                ? "bg-film-muted/30"
                : "bg-white"
            }`}
          />
        </button>
        <p className="text-white/50 text-xs">
          {photoCount >= MAX_PHOTOS
            ? "Batas foto tercapai. Terima kasih!"
            : `${MAX_PHOTOS - photoCount} foto tersisa`}
        </p>
        {photoCount > 0 && (
          <button
            onClick={() => setShowThanks(true)}
            className="px-6 py-2 bg-film-accent/20 border border-film-accent/40 text-film-accent rounded-full text-sm hover:bg-film-accent/30 transition-colors"
          >
            Selesai
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes flash {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        .animate-flash {
          animation: flash 0.3s ease-out forwards;
        }
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translate(-50%, -10px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}
