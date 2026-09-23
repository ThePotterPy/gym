'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Timer,
  CheckCircle2,
  Dumbbell,
  ArrowLeft,
  Flame,
  Check,
  Award,
  Sparkles,
  ChevronDown,
  Info,
} from 'lucide-react';
import RestTimerModal from '@/components/workout/RestTimerModal';
import confetti from 'canvas-confetti';

export default function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Temporizador de descanso
  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);

  // Modal de finalización
  const [isFinishedModalOpen, setIsFinishedModalOpen] = useState(false);
  const [finishStats, setFinishStats] = useState<{ duration: number; totalSets: number } | null>(null);

  useEffect(() => {
    loadSession();
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadSession = async () => {
    try {
      const res = await fetch(`/api/workouts/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el entrenamiento');
      if (data.session) {
        setSession(data.session);
        if (data.session.startedAt) {
          const diffSecs = Math.floor(
            (Date.now() - new Date(data.session.startedAt).getTime()) / 1000
          );
          setElapsedSeconds(Math.max(0, diffSecs));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDraftSetChange = (
    sessionExerciseId: string,
    setId: string,
    field: 'actualReps' | 'actualWeightKg',
    value: number,
  ) => {
    setSession((previous: any) => previous ? ({
      ...previous,
      exercises: previous.exercises.map((exercise: any) =>
        exercise.id === sessionExerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set: any) =>
                set.id === setId ? { ...set, [field]: value } : set,
              ),
            }
          : exercise,
      ),
    }) : previous);
  };

  const handleUpdateSet = async (
    sessionExerciseId: string,
    setId: string,
    currentCompleted: boolean,
    actualReps: number,
    actualWeightKg: number,
    exerciseRestSeconds: number,
  ) => {
    const newCompleted = !currentCompleted;

    setSession((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((se: any) => {
          if (se.id === sessionExerciseId) {
            return {
              ...se,
              sets: se.sets.map((s: any) => {
                if (s.id === setId) {
                  return {
                    ...s,
                    completed: newCompleted,
                    actualReps,
                    actualWeightKg,
                  };
                }
                return s;
              }),
            };
          }
          return se;
        }),
      };
    });

    try {
      const response = await fetch(`/api/workouts/${id}/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setId,
          actualReps,
          actualWeightKg,
          completed: newCompleted,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar la serie');

      if (newCompleted) {
        setRestSeconds(exerciseRestSeconds || 60);
        setIsRestTimerOpen(true);
      }
    } catch (err) {
      await loadSession();
      alert(err instanceof Error ? err.message : 'No se pudo guardar la serie');
    }
  };

  const handleFinishWorkout = async () => {
    try {
      const res = await fetch(`/api/workouts/${id}/finish`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo finalizar el entrenamiento');

      let totalSets = 0;
      session?.exercises?.forEach((ex: any) => {
        totalSets += ex.sets?.filter((s: any) => s.completed).length || 0;
      });

      setFinishStats({
        duration: data.session?.durationMinutes || Math.max(1, Math.round(elapsedSeconds / 60)),
        totalSets,
      });

      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d90429', '#0f172a', '#e2e8f0', '#16a34a'],
        });
      }

      setIsFinishedModalOpen(true);
    } catch (err) {
      alert('Error al finalizar sesión');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gray-muted)', fontWeight: 600 }}>Cargando entrenamiento...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ minHeight: '100dvh', padding: 20, textAlign: 'center' }}>
        <p style={{ color: 'var(--gray-muted)' }}>Sesión no encontrada</p>
        <button onClick={() => router.push('/')} className="btn-primary" style={{ marginTop: 16 }}>
          Volver al Inicio
        </button>
      </div>
    );
  }

  const formatElapsed = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg-main)', paddingBottom: 100 }}>
      {/* Header Fijo con Cronómetro */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <button
          onClick={() => router.push('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-muted)', fontSize: 13, fontWeight: 700 }}
        >
          <ArrowLeft size={16} />
          <span>Volver</span>
        </button>

        {/* Tiempo transcurrido */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--red-tint)',
          border: '1px solid var(--red-border)',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          color: 'var(--red-primary)',
          fontWeight: 800,
          fontFamily: 'monospace',
          fontSize: 14,
        }}>
          <Timer size={14} />
          <span>{formatElapsed(elapsedSeconds)}</span>
        </div>

        <button
          onClick={handleFinishWorkout}
          className="btn-primary"
          style={{ width: 'auto', padding: '6px 12px', fontSize: 12, borderRadius: 'var(--radius-sm)' }}
        >
          <span>Finalizar</span>
        </button>
      </header>

      {/* Contenido Principal */}
      <main className="container-mobile" style={{ gap: 16, marginTop: 8 }}>
        {/* Título de la Sesión */}
        <div>
          <span className="badge badge-red" style={{ marginBottom: 4 }}>
            En Curso
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--gray-dark)' }}>
            {session.name}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--gray-muted)', marginTop: 2 }}>
            Registrá las repeticiones y kilos reales que vas completando
          </p>
        </div>

        {/* Lista de Ejercicios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {session.exercises?.map((se: any, exIdx: number) => (
            <div key={se.id} className="card-clean" style={{ border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--red-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Ejercicio {exIdx + 1} de {session.exercises.length}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-dark)', marginTop: 2 }}>
                    {se.exercise?.name}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--gray-muted)', fontWeight: 600 }}>
                    {se.exercise?.equipment} • Descanso sugerido: {se.exercise?.defaultRest || 60}s
                  </div>
                </div>
              </div>

              {/* Tabla de Series */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 1fr 84px',
                  gap: 8,
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--gray-muted)',
                  textTransform: 'uppercase',
                  padding: '0 4px',
                }}>
                  <div>Serie</div>
                  <div>Peso (kg)</div>
                  <div>Reps</div>
                  <div style={{ textAlign: 'center' }}>Estado</div>
                </div>

                {se.sets?.map((st: any) => (
                  <div
                    key={st.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr 1fr 84px',
                      gap: 8,
                      alignItems: 'center',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: st.completed ? 'var(--green-tint)' : 'var(--bg-subtle)',
                      border: st.completed ? '1px solid var(--green-border)' : '1px solid var(--border-subtle)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Número de Serie */}
                    <div style={{
                      fontWeight: 800,
                      fontSize: 14,
                      fontFamily: 'var(--font-heading)',
                      color: st.completed ? 'var(--green-success)' : 'var(--gray-muted)',
                      textAlign: 'center',
                    }}>
                      #{st.setNumber}
                    </div>

                    {/* Input Peso */}
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        step="0.5"
                        aria-label={`Peso de la serie ${st.setNumber}`}
                        value={st.actualWeightKg ?? st.plannedWeightKg ?? 0}
                        onChange={(event) => handleDraftSetChange(se.id, st.id, 'actualWeightKg', Number(event.target.value))}
                        style={{
                          width: '100%',
                          background: '#ffffff',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--gray-dark)',
                          padding: '6px 8px',
                          fontSize: 14,
                          fontWeight: 700,
                          textAlign: 'center',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* Input Reps */}
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        aria-label={`Repeticiones de la serie ${st.setNumber}`}
                        value={st.actualReps ?? st.plannedReps ?? 10}
                        onChange={(event) => handleDraftSetChange(se.id, st.id, 'actualReps', Number(event.target.value))}
                        style={{
                          width: '100%',
                          background: '#ffffff',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--gray-dark)',
                          padding: '6px 8px',
                          fontSize: 14,
                          fontWeight: 700,
                          textAlign: 'center',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* Botón Completar */}
                    <button
                      onClick={() =>
                        handleUpdateSet(
                          se.id,
                          st.id,
                          st.completed,
                          st.actualReps ?? st.plannedReps ?? 10,
                          st.actualWeightKg ?? st.plannedWeightKg ?? 0,
                          se.restSeconds ?? 60
                        )
                      }
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: st.completed ? 'var(--green-success)' : '#ffffff',
                        color: st.completed ? '#ffffff' : 'var(--gray-dark)',
                        border: st.completed ? 'none' : '1px solid var(--border-active)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {st.completed ? (
                        <>
                          <Check size={14} strokeWidth={3} />
                          <span>Listo</span>
                        </>
                      ) : (
                        <span>Hacer</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Botón de Finalizar al pie */}
        <div style={{ marginTop: 18, marginBottom: 30 }}>
          <button
            onClick={handleFinishWorkout}
            className="btn-primary"
            style={{ fontSize: 17, padding: '14px 20px' }}
          >
            <CheckCircle2 size={19} />
            <span>FINALIZAR ENTRENAMIENTO</span>
          </button>
        </div>
      </main>

      {/* Temporizador de descanso flotante */}
      <RestTimerModal
        seconds={restSeconds}
        isOpen={isRestTimerOpen}
        onFinish={() => setIsRestTimerOpen(false)}
        onSkip={() => setIsRestTimerOpen(false)}
        onAddSeconds={(secs) => setRestSeconds((prev) => prev + secs)}
      />

      {/* Modal de Finalización y Éxito */}
      {isFinishedModalOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="finished-dialog-title" style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div className="card-clean" style={{ width: '100%', maxWidth: 400, textAlign: 'center', padding: '28px 20px' }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: 'var(--radius-md)',
              background: 'var(--green-tint)',
              border: '1.5px solid var(--green-border)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}>
              <Award size={34} color="var(--green-success)" />
            </div>

            <h2 id="finished-dialog-title" style={{ fontSize: 24, fontWeight: 900, color: 'var(--gray-dark)' }}>
              ¡Entrenamiento Completado!
            </h2>
            <p style={{ color: 'var(--gray-muted)', fontSize: 14, marginTop: 4 }}>
              Excelente trabajo hoy en Emporio. Tu entrenamiento quedó guardado en tu historial.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              margin: '20px 0',
              padding: 14,
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-muted)', textTransform: 'uppercase' }}>Tiempo Total</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--gray-dark)', marginTop: 2, fontFamily: 'var(--font-heading)' }}>
                  {finishStats?.duration} MIN
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-muted)', textTransform: 'uppercase' }}>Series Realizadas</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--green-success)', marginTop: 2, fontFamily: 'var(--font-heading)' }}>
                  {finishStats?.totalSets}
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/')}
              className="btn-primary"
              style={{ fontSize: 15 }}
            >
              <span>Volver a la Pantalla Principal</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
