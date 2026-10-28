"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const VOLUME = 0.15;
const OFF_KEY = "isa_sound_off"; 

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = true;
    video.defaultMuted = true;
    video.volume = VOLUME;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
    } else {
      video.play().catch(() => {}); 
    }

    let off = false;
    try { off = localStorage.getItem(OFF_KEY) === "1"; } catch {}
    if (off) return;

    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    const cleanup = () => events.forEach((name) => document.removeEventListener(name, onFirst));
    
    function onFirst(event: Event) {
      if ((event.target as Element | null)?.closest?.(".audio-control")) return; 
      cleanup();
      video!.muted = false;
      video!.play().then(() => setSoundOn(true)).catch(() => { video!.muted = true; });
    }
    
    events.forEach((name) => document.addEventListener(name, onFirst, { passive: true }));
    return cleanup;
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !soundOn;
    video.muted = !next;
    video.volume = VOLUME;
    if (next) video.play().catch(() => {});
    try { next ? localStorage.removeItem(OFF_KEY) : localStorage.setItem(OFF_KEY, "1"); } catch {}
    setSoundOn(next);
  };

  return (
    <>
      {/* LAYER 1: Blurred background for mobile (fills the empty space) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="bg-video-blur"
      >
        <source src="/videos/Indiana-mobile.mp4" type="video/mp4" media="(max-width: 767px)" />
      </video>

      {/* LAYER 2: The main video (shows full width on mobile) */}
      <video
        ref={videoRef}
        className="bg-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/images/video-poster.jpg"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/videos/Indiana-mobile.mp4" type="video/mp4" media="(max-width: 767px)" />
        <source src="/videos/Indiana1.mp4" type="video/mp4" />
      </video>
      
      <button
        className="audio-control"
        type="button"
        onClick={toggleSound}
        aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
        title={soundOn ? "Turn sound off" : "Turn sound on"}
      >
        {soundOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
      </button>
    </>
  );
}