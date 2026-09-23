'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Timer, Plus, SkipForward } from 'lucide-react';

interface RestTimerModalProps {
  seconds: number;
  isOpen: boolean;
  onFinish: () => void;
  onSkip: () => void;
  onAddSeconds: (secs: number) => void;
}

export default function RestTimerModal({
  seconds,
  isOpen,
  onFinish,
  onSkip,
  onAddSeconds,
}: RestTimerModalProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const onFinishRef = useRef(onFinish);
  const onSkipRef = useRef(onSkip);

  useEffect(() => {
    onFinishRef.current = onFinish;
    onSkipRef.current = onSkip;
  }, [onFinish, onSkip]);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onSkipRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);

    if (timeLeft <= 0) {
      onFinishRef.current();
      document.removeEventListener('keydown', handleKeyDown);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onFinishRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, timeLeft]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const remainingSecs = timeLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;

  return (
    <div role="status" aria-live="polite" aria-label={`Descanso: ${formatted}`} style={{
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '92%',
      maxWidth: 390,
      zIndex: 150,
      animation: 'slideUp 0.25s ease',
    }}>
      <div style={{
        background: '#ffffff',
        border: '1.5px solid var(--border-active)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        {/* Temporizador display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'var(--red-tint)',
            border: '1px solid var(--red-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--red-primary)',
          }}>
            <Timer size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-muted)', letterSpacing: '0.5px' }}>
              Descanso
            </div>
            <div style={{
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--gray-dark)',
              fontFamily: 'monospace',
              lineHeight: 1,
              marginTop: 2,
            }}>
              {formatted}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => onAddSeconds(30)}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--gray-charcoal)',
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Plus size={13} />
            <span>+30s</span>
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="btn-primary"
            style={{
              width: 'auto',
              fontSize: 12,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <SkipForward size={13} />
            <span>Omitir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
