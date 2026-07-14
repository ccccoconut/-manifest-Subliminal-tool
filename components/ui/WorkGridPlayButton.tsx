"use client";

import { useEffect, useRef, useState } from "react";
import { getTrackAudio } from "@/lib/audio/store";

export default function WorkGridPlayButton({
  trackId,
  active,
  onPlay,
  onStop,
  accent = "#4f9d2e",
}: {
  trackId: string;
  active: boolean;
  onPlay: (id: string) => void;
  onStop: () => void;
  accent?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!active && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [active]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (active && audioRef.current) {
      audioRef.current.pause();
      onStop();
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const blob = await getTrackAudio(trackId);
      if (!blob) {
        setError(true);
        return;
      }
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => onStop();
      audio.onerror = () => {
        setError(true);
        onStop();
      };
      await audio.play();
      onPlay(trackId);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active ? "暂停" : "播放"}
      className="flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
      style={{
        background: `linear-gradient(135deg, ${accent}, #cef595)`,
        boxShadow: `0 6px 20px -6px ${accent}`,
      }}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a14]/30 border-t-[#0a0a14]" />
      ) : error ? (
        <span className="text-xs font-bold text-[#0a0a14]">!</span>
      ) : active ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a0a14">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a0a14">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}
