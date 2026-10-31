import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";
import { advanceMovieTime } from "./home-motion";

type DataConnection = EventTarget & { saveData?: boolean };
const connection = () =>
  (navigator as Navigator & { connection?: DataConnection }).connection;
const restrictedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches ||
  !!connection()?.saveData;

/** The document scroll owns the timeline. The original animation has no audio. */
export function HomeIntro({ children }: { children: ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const movieTime = useRef(0);
  const copyProgress = useRef(0);
  const video = useRef<HTMLVideoElement>(null);
  const [restricted, setRestricted] = useState(restrictedMotion);
  const [optIn, setOptIn] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const motion = (!restricted || optIn) && !failed;

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const data = connection();
    const sync = () => {
      setRestricted(restrictedMotion());
      setOptIn(false);
    };
    media.addEventListener("change", sync);
    data?.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      data?.removeEventListener("change", sync);
    };
  }, []);
  useEffect(() => {
    const el = section.current!;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNearby(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const el = section.current;
    const film = video.current;
    if (!motion || !el) return;
    let raf = 0;
    let target = movieTime.current;
    let previousFrame = 0;
    const seek = () => {
      if (
        paused ||
        !film ||
        document.hidden ||
        film.readyState < 1 ||
        film.seeking ||
        !Number.isFinite(film.duration)
      )
        return;
      if (Math.abs(film.currentTime - target) > 0.025)
        film.currentTime = target;
    };
    const update = (now: number) => {
      raf = 0;
      if (document.hidden) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      const range = Math.max(1, el.offsetHeight - innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / range));
      const elapsed = previousFrame
        ? Math.min((now - previousFrame) / 1000, 0.064)
        : 1 / 60;
      previousFrame = now;
      const textDelta = progress - copyProgress.current;
      copyProgress.current =
        Math.abs(textDelta) < 0.0008
          ? progress
          : copyProgress.current + textDelta * (1 - Math.exp(-elapsed / 0.22));
      el.style.setProperty("--intro-progress", copyProgress.current.toFixed(4));
      const goal = progress * Math.max(0, (film?.duration || 0) - 0.04);
      const canSeek = !paused && film && film.readyState >= 1;
      if (canSeek) {
        movieTime.current = advanceMovieTime(movieTime.current, goal, elapsed);
        target = movieTime.current;
        seek();
      }
      if (
        Math.abs(progress - copyProgress.current) > 0.0008 ||
        (canSeek && Math.abs(goal - movieTime.current) > 0.025)
      )
        schedule();
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    const loaded = () => {
      movieTime.current = film?.currentTime ?? 0;
      target = movieTime.current;
      schedule();
    };
    film?.addEventListener("loadedmetadata", loaded);
    film?.addEventListener("seeked", seek);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      film?.removeEventListener("loadedmetadata", loaded);
      film?.removeEventListener("seeked", seek);
    };
  }, [motion, paused, nearby]);

  return (
    <section
      ref={section}
      className={`ps-home-intro ${motion ? "has-motion" : ""}`}
      aria-label="Wprowadzenie Pan Stolarz"
    >
      <div className="ps-hero">
        {children}
        <figure className="ps-hero-image ps-intro-film">
          <img
            src="/animations/kuchnia-darii-v2-poster.jpg"
            width="1280"
            height="720"
            alt="Wizualizacja kuchni z drewnianymi frontami, jasnym blatem i zabudową wokół okna"
            fetchPriority="high"
          />
          {motion && nearby && (
            <video
              ref={video}
              src="/animations/kuchnia-darii-v2.mp4"
              poster="/animations/kuchnia-darii-v2-poster.jpg"
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              className={ready ? "ready" : ""}
              onLoadedData={() => setReady(true)}
              onError={() => {
                setFailed(true);
                setReady(false);
              }}
            />
          )}
          {!failed && (
            <button
              className="ps-intro-control"
              onClick={() => {
                if (!motion) {
                  setOptIn(true);
                  setPaused(false);
                } else setPaused((p) => !p);
              }}
            >
              {motion && !paused ? (
                <IconPlayerPause size={18} />
              ) : (
                <IconPlayerPlay size={18} />
              )}
              {!motion
                ? "Włącz animację"
                : paused
                  ? "Wznów animację"
                  : "Wstrzymaj animację"}
            </button>
          )}
          <figcaption>
            {failed
              ? "Wizualizacja kuchni · podgląd statyczny"
              : motion
                ? paused
                  ? "Animacja wstrzymana"
                  : "Przewiń, aby obejrzeć kuchnię"
                : "Wizualizacja kuchni · kadr z animacji"}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
