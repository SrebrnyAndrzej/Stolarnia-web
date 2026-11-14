import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";

type DataConnection = EventTarget & { saveData?: boolean };
const connection = () =>
  (navigator as Navigator & { connection?: DataConnection }).connection;
const restrictedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches ||
  !!connection()?.saveData;

/** A muted film plays independently of page scrolling. */
export function HomeIntro({ children }: { children: ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const userNavigated = useRef(false);
  const [restricted, setRestricted] = useState(restrictedMotion);
  const [optIn, setOptIn] = useState(false);
  const [visible, setVisible] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [paused, setPaused] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [copyRevealed, setCopyRevealed] = useState(false);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const motion = (!restricted || optIn) && !failed;
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const data = connection();
    const sync = () => {
      setRestricted(restrictedMotion());
      setOptIn(false);
    };
    const visibility = () => setHidden(document.hidden);
    media.addEventListener("change", sync);
    data?.addEventListener("change", sync);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", sync);
      data?.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) setNearby(true);
        setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.25);
      },
      { threshold: [0, 0.25] },
    );
    observer.observe(section.current!);
    const navigate = () => {
      userNavigated.current = true;
    };
    window.addEventListener("wheel", navigate, { passive: true });
    window.addEventListener("touchstart", navigate, { passive: true });
    window.addEventListener("keydown", navigate);
    return () => {
      observer.disconnect();
      window.removeEventListener("wheel", navigate);
      window.removeEventListener("touchstart", navigate);
      window.removeEventListener("keydown", navigate);
    };
  }, []);
  useEffect(() => {
    const film = video.current;
    if (!film) return;
    if (!motion || paused || !visible || hidden || ended) {
      film.pause();
      return;
    }
    let cancelled = false;
    film.playbackRate = 0.75;
    void film
      .play()
      .then(() => {
        if (!cancelled) setBlocked(false);
      })
      .catch(() => {
        if (!cancelled) {
          setBlocked(true);
          setCopyRevealed(true);
        }
      });
    return () => {
      cancelled = true;
      film.pause();
    };
  }, [motion, paused, visible, hidden, ended, nearby]);
  const finish = () => {
    setEnded(true);
    section.current?.style.setProperty("--intro-progress", "1");
    const el = section.current;
    if (
      !el ||
      restricted ||
      userNavigated.current ||
      el.contains(document.activeElement)
    )
      return;
    const rect = el.getBoundingClientRect();
    if (rect.top >= -20 && rect.top < innerHeight && !document.hidden)
      el.nextElementSibling?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };
  const toggle = () => {
    setCopyRevealed(true);
    if (!motion) {
      setOptIn(true);
      setPaused(false);
      return;
    }
    if (ended && video.current) {
      video.current.currentTime = 0;
      setEnded(false);
      setPaused(false);
      return;
    }
    if (blocked) {
      const film = video.current;
      if (film) {
        film.playbackRate = 0.75;
        void film
          .play()
          .then(() => {
            setBlocked(false);
            setPaused(false);
          })
          .catch(() => setBlocked(true));
      }
      return;
    }
    setPaused((value) => !value);
  };
  return (
    <section
      ref={section}
      className={`ps-home-intro ${motion ? "has-motion" : ""} ${copyRevealed ? "is-readable" : ""}`}
      aria-label="Wprowadzenie Pan Stolarz"
    >
      <div className="ps-hero">
        {children}
        <figure className="ps-hero-image ps-intro-film">
          <img
            src="/animations/kuchnia-darii-v4-poster.jpg"
            width="1280"
            height="720"
            alt="Wizualizacja kuchni z drewnianymi frontami, jasnym blatem i zabudową wokół okna"
            fetchPriority="high"
          />
          {motion && nearby && (
            <video
              ref={video}
              src="/animations/kuchnia-darii-v4.mp4"
              poster="/animations/kuchnia-darii-v4-poster.jpg"
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              className={ready ? "ready" : ""}
              onLoadedData={() => setReady(true)}
              onTimeUpdate={(e) =>
                section.current?.style.setProperty(
                  "--intro-progress",
                  String(Math.min(1, e.currentTarget.currentTime / 8)),
                )
              }
              onEnded={finish}
              onError={() => {
                setFailed(true);
                setReady(false);
              }}
            />
          )}
          {!failed && (
            <button className="ps-intro-control" onClick={toggle}>
              {motion && !paused && !blocked && !ended ? (
                <IconPlayerPause size={18} />
              ) : (
                <IconPlayerPlay size={18} />
              )}
              {!motion || blocked
                ? "Włącz animację"
                : ended
                  ? "Obejrzyj ponownie"
                  : paused
                    ? "Wznów animację"
                    : "Wstrzymaj animację"}
            </button>
          )}
          <figcaption>
            {failed
              ? "Wizualizacja kuchni · podgląd statyczny"
              : !motion
                ? "Wizualizacja kuchni · kadr z animacji"
                : ended
                  ? "Wizualizacja kuchni · koniec animacji"
                  : paused
                    ? "Animacja wstrzymana"
                    : blocked
                      ? "Uruchom animację przyciskiem"
                      : "Animacja odtwarza się automatycznie · bez dźwięku"}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
