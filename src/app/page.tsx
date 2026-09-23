'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import MemberLoginModal from '@/components/auth/MemberLoginModal';
import Image from 'next/image';
import {
  Dumbbell,
  Flame,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  Shuffle,
  Play,
  Settings,
  Plus,
  Search,
  MapPin,
  Phone,
  Camera,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  // Estados de usuario y sesión
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; gender: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Tab activa del socio ('today' | 'train' | 'exercises' | 'history')
  const [currentTab, setCurrentTab] = useState<'today' | 'train' | 'exercises' | 'history'>('today');

  // Datos del día
  const [todayData, setTodayData] = useState<any>(null);
  const [loadingToday, setLoadingToday] = useState(false);
  const [todayError, setTodayError] = useState('');

  // Flujo guiado del día
  const [guidedGroupState, setGuidedGroupState] = useState<'DEFAULT' | 'SELECT_ANOTHER'>('DEFAULT');
  const [selectedMuscleSlug, setSelectedMuscleSlug] = useState<string | null>(null);
  const [customizedExercises, setCustomizedExercises] = useState<any[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [hasConfirmedGroup, setHasConfirmedGroup] = useState(false);

  // Datos generales
  const [muscleGroups, setMuscleGroups] = useState<any[]>([]);
  const [exercisesList, setExercisesList] = useState<any[]>([]);
  const [routinesList, setRoutinesList] = useState<{ templates: any[]; userRoutines: any[] }>({ templates: [], userRoutines: [] });
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Filtros de biblioteca de ejercicios
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('Todos');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('Todos');
  const [viewingExercise, setViewingExercise] = useState<any | null>(null);

  // Constructor de nueva rutina
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineExercises, setNewRoutineExercises] = useState<any[]>([]);

  useEffect(() => {
    checkCurrentUser();
    loadMuscleGroups();
  }, []);

  const checkCurrentUser = async () => {
    setLoadingUser(true);
    try {
      const res = await fetch('/api/auth/member');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo recuperar la sesión');
      if (data.user) {
        setCurrentUser(data.user);
        loadTodaySchedule();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUser(false);
    }
  };

  const loadTodaySchedule = async () => {
    setLoadingToday(true);
    setTodayError('');
    try {
      const res = await fetch('/api/schedule/today');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el entrenamiento de hoy');
      setTodayData(data);
      if (data.recommendedExercises) {
        setCustomizedExercises(data.recommendedExercises);
      }
    } catch (err) {
      console.error(err);
      setTodayError(err instanceof Error ? err.message : 'No se pudo cargar el entrenamiento de hoy');
    } finally {
      setLoadingToday(false);
    }
  };

  const loadMuscleGroups = async () => {
    try {
      const res = await fetch('/api/muscle-groups');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los grupos musculares');
      setMuscleGroups(data.muscleGroups || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadExercises = async () => {
    try {
      const res = await fetch('/api/exercises');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los ejercicios');
      setExercisesList(data.exercises || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRoutines = async () => {
    try {
      const res = await fetch('/api/routines');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las rutinas');
      setRoutinesList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el historial');
      setHistoryList(data.history || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentTab === 'exercises') {
      loadExercises();
    } else if (currentTab === 'train') {
      void Promise.all([loadRoutines(), loadExercises()]);
    } else if (currentTab === 'history') {
      loadHistory();
    }
  }, [currentTab]);

  useEffect(() => {
    if (!viewingExercise) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewingExercise(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [viewingExercise]);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    loadTodaySchedule();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setTodayData(null);
    setIsLoginModalOpen(false);
  };

  const handleSelectMuscleGroup = async (slug: string) => {
    setSelectedMuscleSlug(slug);
    try {
      const res = await fetch(`/api/exercises?muscle=${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los ejercicios');
      setCustomizedExercises(data.exercises.slice(0, 5));
      setGuidedGroupState('DEFAULT');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartWorkout = async (routineName: string, exercisesToUse: any[], routineId?: string) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!exercisesToUse.length) {
      alert('Seleccioná al menos un ejercicio antes de comenzar.');
      return;
    }

    try {
      const payload = {
        name: routineName,
        routineId: routineId || null,
        exercises: exercisesToUse.map((ex) => ({
          exerciseId: ex.exerciseId ?? ex.id,
          sets: ex.defaultSets || ex.sets || 4,
          reps: ex.defaultReps || ex.reps || 10,
          weightKg: ex.weightKg ?? 0,
          restSeconds: ex.defaultRest || ex.restSeconds || 60,
        })),
      };

      const res = await fetch('/api/workouts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo iniciar el entrenamiento');
      if (data.sessionId) {
        router.push(`/workout/${data.sessionId}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al iniciar entrenamiento');
    }
  };

  const filteredExercises = exercisesList.filter((ex) => {
    const matchesQuery =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.description && ex.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesEquip =
      selectedEquipment === 'Todos' || ex.equipment === selectedEquipment;

    const matchesMuscle =
      selectedMuscleFilter === 'Todos' ||
      ex.muscles?.some((m: any) => m.muscleGroup?.slug === selectedMuscleFilter);

    return matchesQuery && matchesEquip && matchesMuscle;
  });

  if (loadingUser) {
    return (
      <div style={{ minHeight: '100dvh' }}>
        <Navbar />
        <main className="container-mobile" aria-busy="true" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <p style={{ color: 'var(--gray-muted)', fontWeight: 700 }}>Cargando tu espacio de entrenamiento…</p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: currentUser ? 80 : 0 }}>
      {/* Navbar Claro */}
      <Navbar
        userName={currentUser?.name}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Modal de Identificación Simple */}
      <MemberLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Modal de Ficha de Ejercicio */}
      {viewingExercise && (
        <div role="dialog" aria-modal="true" aria-labelledby="exercise-dialog-title" style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 250,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div className="card-clean" style={{ width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ flex: 1, marginRight: 10 }}>
                <span className="badge badge-red">{viewingExercise.equipment}</span>

                <h3 id="exercise-dialog-title" style={{ fontSize: 22, fontWeight: 900, color: 'var(--gray-dark)', marginTop: 6 }}>
                  {viewingExercise.name}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar ficha del ejercicio"
                onClick={() => setViewingExercise(null)}
                style={{ color: 'var(--gray-muted)', padding: 4 }}
              >
                ✕
              </button>
            </div>

            <div style={{ margin: '14px 0', padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 12, color: 'var(--gray-muted)', fontWeight: 600 }}>Músculo Principal</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-dark)', marginTop: 2 }}>
                {viewingExercise.muscles?.find((m: any) => m.isPrimary)?.muscleGroup?.name || 'General'}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <h4 style={{ fontSize: 12, color: 'var(--gray-muted)', letterSpacing: '0.5px' }}>Descripción</h4>
              <p style={{ fontSize: 14, color: 'var(--gray-charcoal)', marginTop: 4, lineHeight: 1.5 }}>
                {viewingExercise.description || 'Sin descripción'}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: 'var(--gray-muted)', letterSpacing: '0.5px' }}>Técnica & Ejecución</h4>
              <p style={{ fontSize: 14, color: 'var(--gray-charcoal)', marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {viewingExercise.instructions || 'Controla el movimiento en todo momento y no arquees la columna.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setViewingExercise(null)}
                className="btn-secondary"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  const ex = viewingExercise;
                  setViewingExercise(null);
                  handleStartWorkout(`Entrenamiento de ${ex.name}`, [ex]);
                }}
                className="btn-primary"
              >
                <Play size={16} />
                <span>Entrenar este ejercicio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CASO A: USUARIO LOGUEADO -> VISTA DE SOCIO */}
      {currentUser ? (
        <main className="container-mobile">
          {/* TAB 1: 🏠 HOY (Flujo guiado interactivo) */}
          {currentTab === 'today' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Saludo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-dark)' }}>
                    Hola, {currentUser.name} 👋
                  </h1>
                  <p style={{ fontSize: 13, color: 'var(--gray-muted)', marginTop: 2 }}>
                    {currentUser.gender === 'FEMALE' ? 'Foco Femenino: Glúteos & Tren Superior' : 'Foco Masculino: Fuerza & Hipertrofia'}
                  </p>
                </div>
                <div className="badge badge-red">
                  <Flame size={13} />
                  <span>Día de Gym</span>
                </div>
              </div>

              {/* CARD PRINCIPAL: ENTRENAMIENTO DE HOY */}
              <div className="card-clean" style={{ borderTop: '4px solid var(--red-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="badge badge-red">Recomendado de hoy</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-muted)' }}>
                    {loadingToday ? 'Cargando…' : `≈ ${customizedExercises.length * 9} min`}
                  </span>
                </div>

                <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--gray-dark)' }}>
                    {loadingToday
                      ? 'Preparando tu entrenamiento…'
                      : selectedMuscleSlug
                    ? muscleGroups.find((m) => m.slug === selectedMuscleSlug)?.name
                    : todayData?.schedule?.title || 'Entrenamiento General'}
                </h2>

                <p style={{ fontSize: 14, color: 'var(--gray-muted)', marginTop: 4 }}>
                  {todayData?.schedule?.description || 'Rutina adaptada al día según tu perfil'}
                </p>

                {/* PASO 1: CONSULTA DE GRUPO MUSCULAR */}
                {guidedGroupState === 'DEFAULT' ? (
                  <div style={{
                    marginTop: 16,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-charcoal)', marginBottom: 8 }}>
                      ¿Vas a entrenar este grupo hoy o preferís otro?
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        aria-pressed={hasConfirmedGroup}
                        onClick={() => setHasConfirmedGroup(true)}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--green-tint)',
                          border: '1px solid var(--green-border)',
                          color: 'var(--green-success)',
                          fontWeight: 700,
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Check size={15} strokeWidth={2.5} />
                        <span>{hasConfirmedGroup ? 'Grupo confirmado' : 'Sí, este grupo'}</span>
                      </button>

                      <button
                        onClick={() => setGuidedGroupState('SELECT_ANOTHER')}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: '#ffffff',
                          border: '1px solid var(--border-active)',
                          color: 'var(--gray-dark)',
                          fontWeight: 700,
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Shuffle size={14} color="var(--red-primary)" />
                        <span>Elegir otro</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* SELECTOR RÁPIDO DE OTRO GRUPO MUSCULAR */
                  <div style={{
                    marginTop: 16,
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    border: '1.5px solid var(--border-active)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--gray-dark)' }}>¿Qué querés entrenar hoy?</span>
                      <button
                        onClick={() => setGuidedGroupState('DEFAULT')}
                        style={{ fontSize: 12, color: 'var(--gray-muted)', fontWeight: 600 }}
                      >
                        Cancelar
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      {muscleGroups.map((mg) => (
                        <button
                          key={mg.slug}
                          onClick={() => {
                            setHasConfirmedGroup(true);
                            handleSelectMuscleGroup(mg.slug);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: selectedMuscleSlug === mg.slug ? 'var(--red-tint)' : 'var(--bg-subtle)',
                            border: selectedMuscleSlug === mg.slug ? '1.5px solid var(--red-primary)' : '1px solid var(--border-subtle)',
                            color: selectedMuscleSlug === mg.slug ? 'var(--red-primary)' : 'var(--gray-dark)',
                            fontSize: 13,
                            fontWeight: 700,
                            textAlign: 'left',
                          }}
                        >
                          {mg.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* PASO 2: EJERCICIOS PROPUESTOS */}
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-muted)', letterSpacing: '0.5px' }}>
                      {loadingToday ? 'Cargando ejercicios…' : `${customizedExercises.length} Ejercicios Propuestos`}
                    </span>
                    <button
                      onClick={() => setIsCustomizing(!isCustomizing)}
                      style={{ fontSize: 12, color: 'var(--red-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Settings size={13} />
                      <span>{isCustomizing ? 'Listo' : 'Personalizar'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {!loadingToday && todayError && (
                      <div role="alert" style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--red-tint)', color: 'var(--red-primary)', fontSize: 13 }}>
                        <div>{todayError}</div>
                        <button type="button" onClick={loadTodaySchedule} className="btn-outline-red" style={{ marginTop: 8, padding: '6px 10px' }}>
                          Reintentar
                        </button>
                      </div>
                    )}
                    {!loadingToday && !todayError && customizedExercises.length === 0 && (
                      <div role="status" style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--amber-tint)', color: 'var(--amber-warning)', fontSize: 13 }}>
                        No encontramos ejercicios para hoy. Elegí otro grupo muscular o reintentá la carga.
                      </div>
                    )}
                    {customizedExercises.map((ex, idx) => (
                      <div
                        key={ex.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 24,
                            height: 24,
                            borderRadius: 'var(--radius-sm)',
                            background: '#ffffff',
                            color: 'var(--gray-dark)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: 12,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--font-heading)',
                          }}>
                            {idx + 1}
                          </span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-dark)' }}>
                              {ex.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--gray-muted)' }}>
                              {ex.equipment} • {ex.defaultSets || ex.sets || 4} × {ex.defaultReps || ex.reps || 10} reps
                            </div>
                          </div>
                        </div>

                        {isCustomizing && (
                          <button
                            onClick={() => {
                              setCustomizedExercises(customizedExercises.filter((_, i) => i !== idx));
                            }}
                            style={{ color: 'var(--red-primary)', fontSize: 12, fontWeight: 700, padding: 4 }}
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* BOTÓN COMENZAR ENTRENAMIENTO */}
                <div style={{ marginTop: 20 }}>
                  <button
                    onClick={() => handleStartWorkout(todayData?.schedule?.title || 'Entrenamiento de Hoy', customizedExercises)}
                    disabled={loadingToday || customizedExercises.length === 0}
                    className="btn-primary"
                    style={{ fontSize: 17, padding: '14px 20px', opacity: loadingToday || customizedExercises.length === 0 ? 0.55 : 1 }}
                  >
                    <Play size={18} fill="#ffffff" />
                    <span>{loadingToday ? 'CARGANDO ENTRENAMIENTO…' : 'COMENZAR ENTRENAMIENTO'}</span>
                  </button>
                </div>
              </div>

              {/* RUTINA DEL ENTRENADOR (SI TIENE ASIGNADA) */}
              {todayData?.assignedRoutine && (
                <div className="card-clean" style={{ borderLeft: '4px solid var(--amber-warning)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span className="badge badge-amber">Asignada por tu Entrenador</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-muted)' }}>Oficial</span>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-dark)' }}>
                    {todayData.assignedRoutine.name}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--gray-muted)', marginTop: 2 }}>
                    {todayData.assignedRoutine.description || 'Rutina asignada por el staff de Emporio'}
                  </p>
                  <div style={{ marginTop: 12 }}>
                    <button
                      onClick={() => handleStartWorkout(todayData.assignedRoutine.name, todayData.assignedRoutine.exercises, todayData.assignedRoutine.id)}
                      className="btn-primary"
                      style={{ padding: '10px 16px', fontSize: 14 }}
                    >
                      <Play size={15} fill="#fff" />
                      <span>Comenzar esta rutina</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 🏋 ENTRENAR */}
          {currentTab === 'train' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ marginTop: 4 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-dark)' }}>¿Qué querés entrenar?</h1>
                <p style={{ fontSize: 13, color: 'var(--gray-muted)', marginTop: 2 }}>
                  Elegí una rutina o seleccioná un músculo para comenzar
                </p>
              </div>

              {/* Botón crear rutina */}
              <button
                onClick={() => setIsCreatingRoutine(!isCreatingRoutine)}
                className="btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '12px 16px', border: '1.5px dashed var(--red-border)' }}
              >
                <Plus size={18} color="var(--red-primary)" />
                <span style={{ color: 'var(--red-primary)', fontWeight: 700 }}>+ Crear mi propia rutina</span>
              </button>

              {/* Formulario para crear rutina propia */}
              {isCreatingRoutine && (
                <div className="card-clean" style={{ border: '1.5px solid var(--border-active)' }}>
                  <h3 style={{ fontSize: 18, color: 'var(--gray-dark)', marginBottom: 12 }}>Nueva Rutina Personal</h3>
                  <label className="sr-only" htmlFor="routine-name">Nombre de la rutina</label>
                  <input
                    id="routine-name"
                    type="text"
                    placeholder="Nombre (ej: Pecho Pesado, Piernas Glúteo)"
                    value={newRoutineName}
                    onChange={(e) => setNewRoutineName(e.target.value)}
                    className="input-field"
                    style={{ marginBottom: 12 }}
                  />

                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-muted)', marginBottom: 8 }}>
                    Selecciona ejercicios para tu rutina:
                  </div>

                  <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {exercisesList.slice(0, 15).map((ex) => {
                      const isSelected = newRoutineExercises.some((item) => item.exerciseId === ex.id);
                      return (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setNewRoutineExercises(newRoutineExercises.filter((item) => item.exerciseId !== ex.id));
                            } else {
                              setNewRoutineExercises([...newRoutineExercises, { exerciseId: ex.id, name: ex.name, sets: 4, reps: 10 }]);
                            }
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: isSelected ? 'var(--red-tint)' : 'var(--bg-subtle)',
                            border: isSelected ? '1.5px solid var(--red-primary)' : '1px solid var(--border-subtle)',
                            color: 'var(--gray-dark)',
                            fontSize: 13,
                            fontWeight: isSelected ? 700 : 500,
                            textAlign: 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{ex.name}</span>
                          {isSelected && <Check size={15} color="var(--red-primary)" strokeWidth={2.5} />}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setIsCreatingRoutine(false)} className="btn-secondary" style={{ flex: 1 }}>
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        if (!newRoutineName || newRoutineExercises.length === 0) return;
                        const response = await fetch('/api/routines', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name: newRoutineName, exercises: newRoutineExercises }),
                        });
                        const result = await response.json();
                        if (!response.ok) {
                          alert(result.error || 'No se pudo guardar la rutina');
                          return;
                        }
                        setIsCreatingRoutine(false);
                        setNewRoutineName('');
                        setNewRoutineExercises([]);
                        loadRoutines();
                      }}
                      className="btn-primary"
                      style={{ flex: 1 }}
                    >
                      Guardar Rutina
                    </button>
                  </div>
                </div>
              )}

              {/* Rutinas oficiales de Emporio */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--gray-muted)', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Rutinas Base de Emporio
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {routinesList.templates.map((rt) => (
                    <div key={rt.id} className="card-clean card-clean-interactive">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span className="badge badge-red" style={{ marginBottom: 4 }}>
                            {rt.targetGender === 'FEMALE' ? 'Femenino' : 'Masculino'}
                          </span>
                          <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-dark)' }}>{rt.name}</h4>
                          <p style={{ fontSize: 13, color: 'var(--gray-muted)', marginTop: 2 }}>
                            {rt.exercises?.length || 0} ejercicios • {rt.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleStartWorkout(rt.name, rt.exercises, rt.id)}
                          className="btn-primary"
                          style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}
                        >
                          <Play size={13} fill="#fff" />
                          <span>Entrenar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mis Rutinas Propias */}
              {routinesList.userRoutines.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--gray-muted)', letterSpacing: '0.5px', marginBottom: 8 }}>
                    Mis Rutinas Creadas
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {routinesList.userRoutines.map((rt) => (
                      <div key={rt.id} className="card-clean">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-dark)' }}>{rt.name}</h4>
                            <p style={{ fontSize: 13, color: 'var(--gray-muted)', marginTop: 2 }}>
                              {rt.exercises?.length || 0} ejercicios
                            </p>
                          </div>
                          <button
                            onClick={() => handleStartWorkout(rt.name, rt.exercises, rt.id)}
                            className="btn-primary"
                            style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}
                          >
                            <Play size={13} fill="#fff" />
                            <span>Entrenar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Elegir por Grupo Muscular */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--gray-muted)', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Elegir Grupo Muscular Directo
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {muscleGroups.map((mg) => (
                    <button
                      key={mg.slug}
                      onClick={async () => {
                        const res = await fetch(`/api/exercises?muscle=${mg.slug}`);
                        const data = await res.json();
                        handleStartWorkout(`Entrenamiento de ${mg.name}`, data.exercises.slice(0, 5));
                      }}
                      className="card-clean card-clean-interactive"
                      style={{ textAlign: 'left', padding: '12px 14px' }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-dark)' }}>{mg.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-muted)', marginTop: 2 }}>
                        {mg._count?.exercises || 4} ejercicios
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 📚 EJERCICIOS */}
          {currentTab === 'exercises' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ marginTop: 4 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-dark)' }}>Biblioteca de Ejercicios</h1>
                <p style={{ fontSize: 13, color: 'var(--gray-muted)', marginTop: 2 }}>
                  Máquinas, mancuernas, poleas y barras de Emporio
                </p>
              </div>

              {/* Buscador */}
              <div style={{ position: 'relative' }}>
                <label className="sr-only" htmlFor="exercise-search">Buscar ejercicio</label>
                <input
                  id="exercise-search"
                  type="search"
                  placeholder="Buscar ejercicio (ej. press banca, hip thrust)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: 40 }}
                />
                <Search size={18} color="var(--gray-light)" style={{ position: 'absolute', left: 14, top: 14 }} />
              </div>

              {/* Filtro por equipamiento */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                {['Todos', 'Máquina', 'Mancuernas', 'Barra y Discos', 'Polea', 'Peso Corporal'].map((eq) => (
                  <button
                    key={eq}
                    onClick={() => setSelectedEquipment(eq)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: selectedEquipment === eq ? 'var(--red-primary)' : 'var(--bg-surface)',
                      border: selectedEquipment === eq ? '1px solid var(--red-primary)' : '1px solid var(--border-subtle)',
                      color: selectedEquipment === eq ? '#ffffff' : 'var(--gray-muted)',
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {eq}
                  </button>
                ))}
              </div>

              <label className="sr-only" htmlFor="muscle-filter">Filtrar por grupo muscular</label>
              <select
                id="muscle-filter"
                className="input-field"
                value={selectedMuscleFilter}
                onChange={(event) => setSelectedMuscleFilter(event.target.value)}
              >
                <option value="Todos">Todos los grupos musculares</option>
                {muscleGroups.map((group) => (
                  <option key={group.slug} value={group.slug}>{group.name}</option>
                ))}
              </select>

              {/* Lista de ejercicios */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredExercises.map((ex) => (
                  <button
                    type="button"
                    key={ex.id}
                    onClick={() => setViewingExercise(ex)}
                    className="card-clean card-clean-interactive"
                    style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}
                  >
                    <div>
                      <span className="badge badge-muted" style={{ marginBottom: 4 }}>
                        {ex.equipment}
                      </span>
                      <h4 style={{ fontSize: 17, fontWeight: 800, color: 'var(--gray-dark)' }}>{ex.name}</h4>
                      <div style={{ fontSize: 12, color: 'var(--gray-muted)', marginTop: 2 }}>
                        Músculo: {ex.muscles?.find((m: any) => m.isPrimary)?.muscleGroup?.name || 'General'}
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--gray-light)" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: 👤 HISTORIAL & PERFIL */}
          {currentTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ marginTop: 4 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-dark)' }}>Mi Cuenta & Historial</h1>
                <p style={{ fontSize: 13, color: 'var(--gray-muted)', marginTop: 2 }}>
                  Registro de tus entrenamientos en Emporio
                </p>
              </div>

              {/* Perfil card */}
              <div className="card-clean">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--red-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#ffffff',
                    fontFamily: 'var(--font-heading)',
                  }}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-dark)' }}>{currentUser.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--gray-muted)' }}>
                      Perfil: {currentUser.gender === 'FEMALE' ? 'Mujer' : 'Hombre'}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary"
                    style={{ fontSize: 13, padding: '9px 12px' }}
                  >
                    Cambiar de socio
                  </button>
                </div>
              </div>

              {/* Historial */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--gray-muted)', letterSpacing: '0.5px', marginBottom: 10 }}>
                  Últimos Entrenamientos Realizados
                </h3>

                {historyList.length === 0 ? (
                  <div className="card-clean" style={{ textAlign: 'center', padding: 28 }}>
                    <Clock size={28} color="var(--gray-light)" style={{ margin: '0 auto 8px auto' }} />
                    <p style={{ color: 'var(--gray-muted)', fontSize: 14 }}>
                      Todavía no registraste entrenamientos completados.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {historyList.map((h) => {
                      const date = new Date(h.startedAt).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                      });
                      return (
                        <div key={h.id} className="card-clean">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span className="badge badge-green">Completado</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-muted)' }}>{date} • {h.durationMinutes || 45} min</span>
                          </div>
                          <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-dark)' }}>{h.name}</h4>
                          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {h.exercises?.map((ex: any) => (
                              <div key={ex.id} style={{ fontSize: 13, color: 'var(--gray-charcoal)' }}>
                                • <strong>{ex.exercise?.name}</strong>: {ex.sets?.length || 4} series
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Nav */}
          <BottomNav currentTab={currentTab} onChangeTab={setCurrentTab} />
        </main>
      ) : (
        /* CASO B: SIN SESIÓN -> LANDING CLARA DE EMPORIO */
        <main>
          {/* HERO SECTION CLARA */}
          <section className="landing-hero" style={{
            position: 'relative',
            padding: '50px 20px 60px 20px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div className="landing-hero-content" style={{ maxWidth: 640, margin: '0 auto' }}>
              {/* Logo en Hero */}
              <div style={{
                position: 'relative',
                width: 90,
                height: 90,
                margin: '0 auto 18px auto',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                backgroundColor: '#000000',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              }}>
                <Image
                  src="/images/emporio-logo.png"
                  alt="Logo Emporio Gym & Fitness"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>

              <span className="badge badge-red" style={{ marginBottom: 12 }}>
                Plataforma de Entrenamiento Oficial
              </span>
              <h1 className="landing-title" style={{
                fontSize: 'clamp(34px, 7vw, 52px)',
                fontWeight: 900,
                color: 'var(--gray-dark)',
                letterSpacing: '-0.5px',
                lineHeight: 1.05,
                marginBottom: 12,
              }}>
                EMPORIO GYM & FITNESS
              </h1>
              <p style={{
                fontSize: 16,
                color: 'var(--gray-muted)',
                lineHeight: 1.5,
                marginBottom: 28,
              }}>
                La plataforma de entrenamiento del gimnasio. Entrá con tu nombre, elegí qué grupo muscular entrenar hoy y registrá tus cargas sin complicaciones.
              </p>

              {/* Formulario de Entrada Rápida */}
              <div className="card-clean landing-login-card" style={{
                maxWidth: 400,
                margin: '0 auto',
                border: '1.5px solid var(--border-active)',
                boxShadow: 'var(--shadow-card-hover)',
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-dark)', marginBottom: 10 }}>
                  ¿Venís a entrenar? Ingresá directo
                </h3>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="btn-primary"
                  style={{ fontSize: 17 }}
                >
                  <span>Ingresar con mi Nombre</span>
                  <ArrowRight size={18} />
                </button>
                <div style={{ fontSize: 12, color: 'var(--gray-muted)', marginTop: 8 }}>
                  Sin contraseñas • Adaptado a tu objetivo
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN SOBRE EMPORIO & INSTALACIONES */}
          <section style={{ padding: '50px 20px', maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <span className="badge badge-muted">Nuestro Espacio</span>
              <h2 style={{ fontSize: 30, fontWeight: 900, color: 'var(--gray-dark)', marginTop: 6 }}>
                Instalaciones y Equipamiento
              </h2>
              <p style={{ color: 'var(--gray-muted)', fontSize: 15, marginTop: 4 }}>
                Máquinas de biomecánica guiada, zona de peso libre completa y seguimiento digital en tu celular.
              </p>
            </div>

            <div className="responsive-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div className="card-clean">
                <div style={{ color: 'var(--red-primary)', marginBottom: 10 }}>
                  <Dumbbell size={28} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-dark)' }}>Zona Peso Libre</h3>
                <p style={{ fontSize: 14, color: 'var(--gray-muted)', marginTop: 4, lineHeight: 1.5 }}>
                  Mancuernas de todos los pesos, barras olímpicas, discos de caucho y bancos planos e inclinados regulables.
                </p>
              </div>

              <div className="card-clean">
                <div style={{ color: 'var(--red-primary)', marginBottom: 10 }}>
                  <Shield size={28} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-dark)' }}>Máquinas & Poleas</h3>
                <p style={{ fontSize: 14, color: 'var(--gray-muted)', marginTop: 4, lineHeight: 1.5 }}>
                  Prensa a 45°, sillón de cuádriceps, camilla femoral, peck deck, cruce de poleas y torres para hombro.
                </p>
              </div>

              <div className="card-clean">
                <div style={{ color: 'var(--red-primary)', marginBottom: 10 }}>
                  <Flame size={28} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-dark)' }}>Plataforma Digital</h3>
                <p style={{ fontSize: 14, color: 'var(--gray-muted)', marginTop: 4, lineHeight: 1.5 }}>
                  Seguimiento de tu entrenamiento en vivo desde tu celular, sin cuadernos ni papeles que se pierden.
                </p>
              </div>
            </div>
          </section>

          {/* HORARIOS Y UBICACIÓN */}
          <section style={{ padding: '30px 20px 60px 20px', maxWidth: 900, margin: '0 auto' }}>
            <div className="card-clean responsive-contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-dark)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={20} color="var(--red-primary)" />
                  <span>Horarios de Atención</span>
                </h3>
                <p style={{ fontSize: 14, color: 'var(--gray-charcoal)', lineHeight: 1.8 }}>
                  <strong>Lunes a Viernes:</strong> 07:00 a 22:00 hs<br />
                  <strong>Sábados:</strong> 09:00 a 14:00 hs<br />
                  <strong>Domingos y Feriados:</strong> Cerrado
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-dark)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={20} color="var(--red-primary)" />
                  <span>Ubicación & Contacto</span>
                </h3>
                <p style={{ fontSize: 14, color: 'var(--gray-charcoal)', lineHeight: 1.8 }}>
                  Emporio Gym & Fitness<br />
                  Tu centro de entrenamiento local.
                </p>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <a
                    href="https://wa.me/"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline-red"
                    style={{ fontSize: 13, padding: '7px 12px' }}
                  >
                    <Phone size={14} />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href="https://instagram.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                    style={{ fontSize: 13, padding: '7px 12px', width: 'auto' }}
                  >
                    <Camera size={14} />
                    <span>Instagram</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Enlace discreto para Admin / Entrenador */}
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Link
                href="/gestion-admin"
                style={{
                  fontSize: 12,
                  color: 'var(--gray-muted)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Shield size={13} />
                <span>Acceso Entrenador & Gestión Administrativa</span>
              </Link>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
