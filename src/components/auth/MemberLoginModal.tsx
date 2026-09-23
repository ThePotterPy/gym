'use client';

import React, { useEffect, useState } from 'react';
import { X, User, ArrowRight, UserCheck, Shield } from 'lucide-react';

interface MemberLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: { name: string; gender: string } | null;
  onSuccess: (user: any) => void;
  onLogout: () => void;
}

export default function MemberLoginModal({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  onLogout,
}: MemberLoginModalProps) {
  const [name, setName] = useState(currentUser?.name || '');
  const [step, setStep] = useState<'NAME' | 'GENDER'>('NAME');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(currentUser?.name || '');
    setStep('NAME');
    setError('');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentUser?.name, onClose]);

  if (!isOpen) return null;

  const handleSubmitName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (data.requiresGender) {
        setStep('GENDER');
      } else if (data.success) {
        onSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Ocurrió un error');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGenderAndFinish = async (selectedGender: 'MALE' | 'FEMALE') => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), gender: selectedGender }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Error al guardar');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-login-title"
      style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div className="card-clean" style={{
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      }}>
        {/* Botón cerrar */}
        <button
          type="button"
          aria-label="Cerrar acceso de socio"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'var(--gray-muted)',
            padding: 4,
          }}
        >
          <X size={20} />
        </button>

        {currentUser && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <span className="badge badge-green" style={{ marginBottom: 10 }}>
              Socio Activo
            </span>
            <h3 id="member-login-title" style={{ fontSize: 22, color: 'var(--gray-dark)', marginTop: 4 }}>
              Hola, {currentUser.name}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--gray-muted)', marginTop: 4 }}>
              Sexo configurado: {currentUser.gender === 'FEMALE' ? 'Mujer' : 'Hombre'}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button
                type="button"
                onClick={onLogout}
                className="btn-secondary"
                style={{ fontSize: 13 }}
              >
                Cambiar de socio
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-primary"
                style={{ fontSize: 13 }}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {!currentUser && step === 'NAME' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: 'var(--red-tint)',
                color: 'var(--red-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
                <User size={24} />
              </div>
              <h2 id="member-login-title" style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-dark)' }}>
                ¿Quién va a entrenar hoy?
              </h2>
              <p style={{ fontSize: 13, color: 'var(--gray-muted)', marginTop: 4 }}>
                Ingresa tu nombre para cargar tu entrenamiento del día
              </p>
            </div>

            <form onSubmit={handleSubmitName} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="sr-only" htmlFor="member-name">Nombre del socio</label>
                <input
                  id="member-name"
                  name="name"
                  autoComplete="name"
                  type="text"
                  placeholder="Tu nombre (ej: Jorge, Valeria)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <p role="alert" style={{ color: 'var(--red-primary)', fontSize: 13, textAlign: 'center' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="btn-primary"
                style={{ opacity: loading || !name.trim() ? 0.6 : 1 }}
              >
                <span>{loading ? 'Cargando...' : 'Entrar a Entrenar'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {!currentUser && step === 'GENDER' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span className="badge badge-red" style={{ marginBottom: 8 }}>
                ¡Bienvenido a Emporio, {name}!
              </span>
              <h2 id="member-login-title" style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-dark)', marginTop: 6 }}>
                Selecciona tu perfil
              </h2>
              <p style={{ fontSize: 13, color: 'var(--gray-muted)', marginTop: 4 }}>
                Para asignarte los grupos musculares y ejercicios recomendados
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={() => handleSelectGenderAndFinish('MALE')}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1.5px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--gray-dark)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18 }}>
                    Hombre
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-muted)', marginTop: 2 }}>
                    Programación: Pecho, Espalda, Piernas, Hombros y Brazos
                  </div>
                </div>
                <ArrowRight size={18} color="var(--red-primary)" />
              </button>

              <button
                type="button"
                onClick={() => handleSelectGenderAndFinish('FEMALE')}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1.5px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--gray-dark)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18 }}>
                    Mujer
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-muted)', marginTop: 2 }}>
                    Programación: Foco Glúteos, Isquios, Cadena Posterior y Tren Superior
                  </div>
                </div>
                <ArrowRight size={18} color="var(--red-primary)" />
              </button>
            </div>

            {error && (
              <p role="alert" style={{ color: 'var(--red-primary)', fontSize: 13, textAlign: 'center', marginTop: 12 }}>
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
