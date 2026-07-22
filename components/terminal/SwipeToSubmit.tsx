import React, { useCallback, useRef, useState } from 'react';

const HANDLE_SIZE = 52;
const TRACK_PAD = 4;
const COMPLETE_THRESHOLD = 0.92;

export type SwipeCarrierTheme = 'bst' | 'glx' | 'neutral';

export interface SwipeToSubmitProps {
  disabled?: boolean;
  loading?: boolean;
  onSubmit: () => void | Promise<void>;
  idleLabel?: string;
  slidingLabel?: string;
  doneLabel?: string;
  theme?: SwipeCarrierTheme;
}

const THEME_STYLES: Record<
  SwipeCarrierTheme,
  {
    trackBorder: string;
    trackShadow: string;
    fillEarly: string;
    fillLate: string;
    fillInset: string;
    handleEarly: string;
    handleLate: string;
    handleBorderEarly: string;
    handleBorderLate: string;
    glowEarly: (progress: number) => string;
    glowLate: string;
  }
> = {
  bst: {
    trackBorder: 'border-blue-400/20',
    trackShadow: 'shadow-[0_0_32px_rgba(59,130,246,0.1)]',
    fillEarly: 'linear-gradient(90deg, rgba(30,64,175,0.45) 0%, rgba(37,99,235,0.5) 100%)',
    fillLate: 'linear-gradient(90deg, rgba(37,99,235,0.55) 0%, rgba(59,130,246,0.65) 100%)',
    fillInset: 'inset 0 0 24px rgba(59,130,246,0.15)',
    handleEarly: 'from-blue-500 to-blue-700',
    handleLate: 'from-blue-400 to-blue-600',
    handleBorderEarly: 'border-blue-300/30',
    handleBorderLate: 'border-blue-200/40',
    glowEarly: (p) => `0 0 ${14 + p * 18}px rgba(59,130,246,${0.35 + p * 0.35})`,
    glowLate: '0 0 28px rgba(59,130,246,0.55)',
  },
  glx: {
    trackBorder: 'border-green-400/20',
    trackShadow: 'shadow-[0_0_32px_rgba(34,197,94,0.1)]',
    fillEarly: 'linear-gradient(90deg, rgba(21,128,61,0.45) 0%, rgba(34,197,94,0.5) 100%)',
    fillLate: 'linear-gradient(90deg, rgba(34,197,94,0.55) 0%, rgba(22,163,74,0.65) 100%)',
    fillInset: 'inset 0 0 24px rgba(34,197,94,0.15)',
    handleEarly: 'from-green-500 to-green-700',
    handleLate: 'from-green-400 to-emerald-600',
    handleBorderEarly: 'border-green-300/30',
    handleBorderLate: 'border-green-200/40',
    glowEarly: (p) => `0 0 ${14 + p * 18}px rgba(34,197,94,${0.35 + p * 0.35})`,
    glowLate: '0 0 28px rgba(34,197,94,0.55)',
  },
  neutral: {
    trackBorder: 'border-zinc-600/25',
    trackShadow: 'shadow-[0_0_32px_rgba(99,102,241,0.08)]',
    fillEarly: 'linear-gradient(90deg, rgba(67,56,202,0.4) 0%, rgba(99,102,241,0.45) 100%)',
    fillLate: 'linear-gradient(90deg, rgba(99,102,241,0.5) 0%, rgba(129,140,248,0.55) 100%)',
    fillInset: 'inset 0 0 24px rgba(99,102,241,0.12)',
    handleEarly: 'from-indigo-500 to-indigo-700',
    handleLate: 'from-indigo-400 to-violet-600',
    handleBorderEarly: 'border-indigo-300/30',
    handleBorderLate: 'border-indigo-200/40',
    glowEarly: (p) => `0 0 ${14 + p * 18}px rgba(99,102,241,${0.3 + p * 0.35})`,
    glowLate: '0 0 28px rgba(99,102,241,0.5)',
  },
};

const SwipeToSubmit: React.FC<SwipeToSubmitProps> = ({
  disabled = false,
  loading = false,
  onSubmit,
  idleLabel = 'Swipe to submit →',
  slidingLabel = 'Keep sliding…',
  doneLabel = 'Submitting…',
  theme = 'bst',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [locked, setLocked] = useState(false);
  const dragStartX = useRef(0);
  const startOffset = useRef(0);
  const styles = THEME_STYLES[theme];

  const getMaxOffset = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    return Math.max(0, el.clientWidth - HANDLE_SIZE - TRACK_PAD * 2);
  }, []);

  const max = getMaxOffset();
  const progress = max > 0 ? offset / max : 0;

  const snapBack = useCallback(() => {
    setOffset(0);
    setDragging(false);
  }, []);

  const triggerSubmit = useCallback(async () => {
    if (locked || disabled || loading) return;
    setLocked(true);
    setDragging(false);
    setOffset(getMaxOffset());
    try {
      await onSubmit();
    } finally {
      setLocked(false);
      setOffset(0);
    }
  }, [locked, disabled, loading, onSubmit, getMaxOffset]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || loading || locked) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStartX.current = e.clientX;
    startOffset.current = offset;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || disabled || loading || locked) return;
    const delta = e.clientX - dragStartX.current;
    const next = Math.max(0, Math.min(getMaxOffset(), startOffset.current + delta));
    setOffset(next);
    if (next >= getMaxOffset() * COMPLETE_THRESHOLD) {
      void triggerSubmit();
    }
  };

  const onPointerEnd = () => {
    if (locked) return;
    setDragging(false);
    if (offset < getMaxOffset() * COMPLETE_THRESHOLD) {
      snapBack();
    }
  };

  const fillWidth = `${Math.min(100, progress * 100 + 8)}%`;
  const nearComplete = progress > 0.85;
  const handleGlow = nearComplete ? styles.glowLate : styles.glowEarly(progress);

  return (
    <div
      ref={trackRef}
      className={`relative h-[3.25rem] sm:h-[3.75rem] rounded-2xl overflow-hidden border backdrop-blur-md transition-all ${
        disabled
          ? 'border-zinc-800/50 bg-zinc-950/50 opacity-45 cursor-not-allowed'
          : `${styles.trackBorder} bg-zinc-950/55 ${styles.trackShadow}`
      }`}
    >
      {!disabled ? (
        <div
          className="absolute inset-y-0 left-0 pointer-events-none transition-[width] duration-75 ease-out"
          style={{
            width: fillWidth,
            background: nearComplete ? styles.fillLate : styles.fillEarly,
            boxShadow: progress > 0.5 ? styles.fillInset : undefined,
          }}
        />
      ) : null}

      <p
        className={`absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.28em] pointer-events-none select-none pl-14 ${
          progress > 0.35 ? 'text-white/90' : 'text-zinc-500'
        }`}
      >
        {loading || locked ? doneLabel : progress > 0.12 ? slidingLabel : idleLabel}
      </p>

      <div
        role="slider"
        aria-label="Swipe to submit"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-disabled={disabled || loading}
        tabIndex={disabled || loading ? -1 : 0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={(e) => {
          if (disabled || loading || locked) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            void triggerSubmit();
          }
        }}
        className={`absolute top-1 bottom-1 rounded-xl flex items-center justify-center touch-none select-none transition-transform ${
          disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
        } ${dragging ? 'scale-105' : ''}`}
        style={{
          left: TRACK_PAD + offset,
          width: HANDLE_SIZE,
          boxShadow: disabled ? undefined : handleGlow,
        }}
      >
        <div
          className={`w-full h-full rounded-xl border flex items-center justify-center text-lg font-black transition-colors bg-gradient-to-br ${
            nearComplete
              ? `${styles.handleLate} ${styles.handleBorderLate} text-white`
              : `${styles.handleEarly} ${styles.handleBorderEarly} text-white`
          }`}
        >
          {loading || locked ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            '»'
          )}
        </div>
      </div>
    </div>
  );
};

export default SwipeToSubmit;
