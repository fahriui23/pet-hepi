"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";

const STROKE_DISTANCE = 120;
const MAX_SUSPICION = 3;

const DIFFICULTY_TIERS = [
  {
    minScore: 0,
    label: "Cozy",
    fastPetMs: 500,
    suspicionDecayMs: 2200,
  },
  {
    minScore: 10,
    label: "Playful",
    fastPetMs: 575,
    suspicionDecayMs: 2500,
  },
  {
    minScore: 25,
    label: "Fussy",
    fastPetMs: 650,
    suspicionDecayMs: 2800,
  },
  {
    minScore: 45,
    label: "Master",
    fastPetMs: 725,
    suspicionDecayMs: 3200,
  },
] as const;

const CAT_IMAGES = [
  "/base.png",
  "/level1.png",
  "/level2.png",
  "/level3.png",
] as const;

const MOODS = [
  {
    label: "Totally chill",
    message: "Hepi is relaxed. Keep your strokes slow and gentle.",
  },
  {
    label: "A little sus",
    message: "Hepi noticed that. Give him a moment.",
  },
  {
    label: "Very suspicious",
    message: "Easy now. Let the suspicion meter cool down.",
  },
  {
    label: "Uh-oh!",
    message: "One more fast pet and Hepi will catch you.",
  },
] as const;

export default function Home() {
  const [petCount, setPetCount] = useState(0);
  const [suspicionLevel, setSuspicionLevel] = useState(0);
  const [caught, setCaught] = useState(false);

  const lastPetAtRef = useRef(0);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const distanceRef = useRef(0);
  const trackingRef = useRef(false);
  const didStrokeRef = useRef(false);

  const difficulty = DIFFICULTY_TIERS.reduce(
    (current, tier) => (petCount >= tier.minScore ? tier : current),
    DIFFICULTY_TIERS[0],
  );
  const nextDifficulty = DIFFICULTY_TIERS.find(
    (tier) => tier.minScore > petCount,
  );
  const mood = MOODS[suspicionLevel];
  const catSrc = caught ? "/caught.png" : CAT_IMAGES[suspicionLevel];

  useEffect(() => {
    if (caught || suspicionLevel === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuspicionLevel((level) => Math.max(0, level - 1));
    }, difficulty.suspicionDecayMs);

    return () => window.clearTimeout(timeoutId);
  }, [caught, difficulty.suspicionDecayMs, suspicionLevel]);

  const registerPet = useCallback(() => {
    if (caught) {
      return;
    }

    const now = Date.now();
    setPetCount((count) => count + 1);

    if (
      lastPetAtRef.current > 0 &&
      now - lastPetAtRef.current < difficulty.fastPetMs
    ) {
      setSuspicionLevel((level) => {
        if (level >= MAX_SUSPICION) {
          setCaught(true);
          return level;
        }

        return level + 1;
      });
    }

    lastPetAtRef.current = now;
  }, [caught, difficulty.fastPetMs]);

  const beginTracking = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (caught) {
        return;
      }

      trackingRef.current = true;
      didStrokeRef.current = false;
      lastPosRef.current = { x: event.clientX, y: event.clientY };
      distanceRef.current = 0;
    },
    [caught],
  );

  const endTracking = useCallback(() => {
    trackingRef.current = false;
    lastPosRef.current = null;
    distanceRef.current = 0;
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!trackingRef.current || caught || !lastPosRef.current) {
        return;
      }

      const dx = event.clientX - lastPosRef.current.x;
      const dy = event.clientY - lastPosRef.current.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 2) {
        return;
      }

      distanceRef.current += distance;
      lastPosRef.current = { x: event.clientX, y: event.clientY };

      if (distanceRef.current >= STROKE_DISTANCE) {
        distanceRef.current = 0;
        didStrokeRef.current = true;
        trackingRef.current = false;
        lastPosRef.current = null;
        registerPet();
      }
    },
    [caught, registerPet],
  );

  const handleClick = useCallback(() => {
    if (!didStrokeRef.current) {
      registerPet();
    }
    didStrokeRef.current = false;
  }, [registerPet]);

  const restart = useCallback(() => {
    setPetCount(0);
    setSuspicionLevel(0);
    setCaught(false);
    lastPetAtRef.current = 0;
    lastPosRef.current = null;
    distanceRef.current = 0;
    trackingRef.current = false;
    didStrokeRef.current = false;
  }, []);

  const meterSegments = useMemo(
    () =>
      Array.from({ length: MAX_SUSPICION }, (_, index) => (
        <span
          className={index < suspicionLevel ? "meter-segment is-active" : "meter-segment"}
          key={index}
        />
      )),
    [suspicionLevel],
  );

  return (
    <main className="game-root">
      <header className="game-header">
        <a className="brand" href="#game" aria-label="Pet Hepi home">
          <span className="brand-mark" aria-hidden="true">
            ♥
          </span>
          <span>Pet Hepi</span>
        </a>
        <span className="header-note">Made with paws &amp; patience</span>
      </header>

      <section className="game-layout" id="game">
        <div className="game-copy">
          <p className="eyebrow">pspsps... Hepi is waiting!</p>
          <h1>
            Gentle pets,
            <br />
            happy Hepi.
          </h1>
          <p className="intro">
            Brush Hepi softly to make him happy—but slow down when he starts
            looking a little suspicious.
          </p>

          <div className="score-row">
            <div className="score-card" aria-label={`${petCount} pets earned`}>
              <span className="score-label">
                <i aria-hidden="true">♥</i>
                Happy pets
              </span>
              <strong>{petCount.toString().padStart(2, "0")}</strong>
            </div>
            <div className="difficulty-chip" aria-live="polite">
              <span>Pace</span>
              <strong>{difficulty.label}</strong>
              <small>
                {nextDifficulty
                  ? `Next at ${nextDifficulty.minScore}`
                  : "Max level!"}
              </small>
            </div>
          </div>

          <div className="suspicion-card">
            <div className="meter-heading">
              <span>Suspicion</span>
              <strong>{mood.label}</strong>
            </div>
            <div
              className={`suspicion-meter level-${suspicionLevel}`}
              role="progressbar"
              aria-label="Hepi's suspicion"
              aria-valuemin={0}
              aria-valuemax={MAX_SUSPICION}
              aria-valuenow={suspicionLevel}
            >
              {meterSegments}
            </div>
            <p aria-live="polite">{mood.message}</p>
          </div>

          <div className="how-to">
            <span className="how-to-icon" aria-hidden="true">
              ♡
            </span>
            <p>
              <strong>Brush softly</strong>
              One gentle pass across Hepi earns one pet. Tap and swipe on touch
              screens.
            </p>
          </div>
          <div className="how-to">
            <span className="how-to-icon" aria-hidden="true">
              ☁
            </span>
            <p>
              <strong>Give him a breather</strong>
              Pause when suspicion rises. Hepi gets fussier as your score
              climbs.
            </p>
          </div>
        </div>

        <div className={`play-card level-${suspicionLevel}`}>
          <div className="play-card-topline">
            <span>{caught ? "Oh no!" : "Hepi's cozy corner"}</span>
            <span className="status-dot">
              <i aria-hidden="true" />
              {caught ? "Spotted you" : "Ready for pets"}
            </span>
          </div>

          <button
            type="button"
            className="cat-area"
            onClick={handleClick}
            onPointerEnter={beginTracking}
            onPointerDown={beginTracking}
            onPointerMove={handlePointerMove}
            onPointerLeave={endTracking}
            onPointerUp={endTracking}
            onPointerCancel={endTracking}
            aria-label={
              caught
                ? "Hepi caught you"
                : `Pet Hepi. ${petCount} pets earned.`
            }
            disabled={caught}
          >
            <Image
              src={catSrc}
              alt=""
              fill
              sizes="(max-width: 800px) 88vw, 42vw"
              className="cat-image"
              loading="eager"
              fetchPriority="high"
              draggable={false}
            />
          </button>

          <div className="gesture-hint" aria-hidden="true">
            <span>↔</span>
            brush softly
          </div>
        </div>
      </section>

      <footer>
        <span>Soft brushes make happy cats ♡</span>
        <span>Made for Hepi</span>
      </footer>

      {caught ? (
        <div
          className="caught-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="caught-title"
        >
          <div className="caught-card">
            <span className="caught-kicker">Hepi saw that!</span>
            <h2 id="caught-title">Oops, too speedy!</h2>
            <p>
              You earned <strong>{petCount} pets</strong> before Hepi saw
              through your suspiciously fast petting.
            </p>
            <button type="button" className="restart-button" onClick={restart} autoFocus>
              Give Hepi another try
              <span aria-hidden="true">♥</span>
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
