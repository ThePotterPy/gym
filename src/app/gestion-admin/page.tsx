'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  Dumbbell,
  Check,
  Search,
  Lock,
  ArrowRight,
  LogOut,
  Calendar,
  Sparkles,
  ChevronRight,
  Flame,
  Edit2,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function GestionAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Tab del panel ('users' | 'exercises')
  const [adminTab, setAdminTab] = useState<'users' | 'exercises'>('users');

  // Datos del panel
  const [users, setUsers] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [searchExercise, setSearchExercise] = useState('');
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  // Edición de nombre de ejercicio
  const [editingExId, setEditingExId] = useState<string | null>(null);
  const [editingExName, setEditingExName] = useState('');
  const [savingExId, setSavingExId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const res = await fetch('/api/auth/admin');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        loadData();
      }
    } catch (err) {
      setIsAuthenticated(false);
    }
  };

  const loadData = async () => {
    try {
      const [usersRes, routinesRes, exercisesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/routines'),
        fetch('/api/exercises'),
      ]);
      if (!usersRes.ok || !routinesRes.ok || !exercisesRes.ok) {
        if (usersRes.status === 401) setIsAuthenticated(false);
        throw new Error('No se pudieron cargar los datos del panel');
      }
      const usersData = await usersRes.json();
      const routinesData = await routinesRes.json();
      const exercisesData = await exercisesRes.json();

      setUsers(usersData.users || []);
      setRoutines(routinesData.templates || []);
      setExercises(exercisesData.exercises || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        loadData();
      } else {
        setLoginError(data.error || 'Contraseña incorrecta');
      }
    } catch (err) {
      setLoginError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/admin', { method: 'DELETE' });
    setIsAuthenticated(false);
    setPassword('');
  };

  const handleAssignRoutine = async (userId: string, routineId: string) => {
    try {
      const response = await fetch('/api/admin/assign-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, routineId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo asignar la rutina');
      setAssigningUserId(null);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al asignar rutina');
    }
  };

  const handleSaveExerciseName = async (exerciseId: string) => {
    if (!editingExName.trim()) return;
    setSavingExId(exerciseId);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingExName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el ejercicio');
      if (data.success && data.exercise) {
        setExercises((prev) =>
          prev.map((e) => (e.id === exerciseId ? data.exercise : e))
        );
        setEditingExId(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar nombre del ejercicio');
    } finally {
      setSavingExId(null);
    }
  };

  // Pantalla de Login de Admin
  if (isAuthenticated === false) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'var(--bg-main)',
      }}>
        <div className="card-clean" style={{ width: '100%', maxWidth: 390, textAlign: 'center', padding: '32px 24px', boxShadow: 'var(--shadow-card-hover)' }}>
          <div style={{
            position: 'relative',
            width: 56,
            height: 56,
            margin: '0 auto 14px auto',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            backgroundColor: '#000000',
          }}>
            <Image
              src="/images/emporio-logo.png"
              alt="Logo Emporio"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--gray-dark)' }}>
            Panel de Entrenador
          </h1>
          <p style={{ fontSize: 13, color: 'var(--gray-muted)', marginTop: 2, marginBottom: 20 }}>
            Emporio Gym & Fitness • Gestión y Rutinas
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <input
                type="password"
                placeholder="Contraseña de administración"
                aria-label="Contraseña de administración"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                autoFocus
              />
            </div>

            {loginError && (
              <p style={{ color: 'var(--red-primary)', fontSize: 13 }}>{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ fontSize: 15 }}
            >
              <span>{loading ? 'Verificando...' : 'Ingresar al Panel'}</span>
              <ArrowRight size={18} />
            </button>

            <Link href="/" style={{ fontSize: 13, color: 'var(--gray-muted)', marginTop: 10 }}>
              Volver a la web pública
            </Link>
          </form>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchExercise.toLowerCase()) ||
    (ex.equipment && ex.equipment.toLowerCase().includes(searchExercise.toLowerCase()))
  );

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-main)' }}>
      {/* Header del Panel */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            position: 'relative',
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            backgroundColor: '#000000',
          }}>
            <Image
              src="/images/emporio-logo.png"
              alt="Logo Emporio"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: 'var(--gray-dark)' }}>
              EMPORIO • Gestión & Entrenadores
            </h1>
            <p style={{ fontSize: 11, color: 'var(--gray-muted)', fontWeight: 600 }}>
              Asignación de rutinas y edición de ejercicios
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" className="btn-secondary" style={{ width: 'auto', padding: '7px 12px', fontSize: 12 }}>
            Ver Web Pública
          </Link>
          <button
            onClick={handleLogout}
            style={{
              color: 'var(--gray-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Selector de Pestañas del Panel */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 20 }}>
          <button
            onClick={() => setAdminTab('users')}
            style={{
              padding: '12px 6px',
              fontFamily: 'var(--font-heading)',
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '0.5px',
              color: adminTab === 'users' ? 'var(--red-primary)' : 'var(--gray-muted)',
              borderBottom: adminTab === 'users' ? '3px solid var(--red-primary)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Users size={16} />
            <span>SOCIOS ({users.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('exercises')}
            style={{
              padding: '12px 6px',
              fontFamily: 'var(--font-heading)',
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '0.5px',
              color: adminTab === 'exercises' ? 'var(--red-primary)' : 'var(--gray-muted)',
              borderBottom: adminTab === 'exercises' ? '3px solid var(--red-primary)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Dumbbell size={16} />
            <span>MODIFICAR EJERCICIOS ({exercises.length})</span>
          </button>
        </div>
      </div>

      {/* Contenido */}
      <main className="container-desktop" style={{ maxWidth: 1000, padding: '24px 20px' }}>
        {/* PESTAÑA 1: SOCIOS */}
        {adminTab === 'users' && (
          <div className="card-clean">
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginBottom: 18,
            }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--gray-dark)' }}>
                  Alumnos del Gimnasio
                </h2>
                <p style={{ fontSize: 13, color: 'var(--gray-muted)' }}>
                  Asigná o cambiá las rutinas de tus alumnos en un click
                </p>
              </div>

              {/* Buscador de Alumno */}
              <div style={{ position: 'relative', minWidth: 260 }}>
                <label className="sr-only" htmlFor="admin-user-search">Buscar socio</label>
                <input
                  id="admin-user-search"
                  type="search"
                  placeholder="Buscar socio por nombre..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="input-field"
                  style={{ padding: '8px 12px 8px 36px', fontSize: 13 }}
                />
                <Search size={16} color="var(--gray-light)" style={{ position: 'absolute', left: 12, top: 11 }} />
              </div>
            </div>

            {/* Tabla de Alumnos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredUsers.length === 0 ? (
                <p style={{ color: 'var(--gray-muted)', padding: 20, textAlign: 'center' }}>
                  No se encontraron socios con ese nombre.
                </p>
              ) : (
                filteredUsers.map((u) => {
                  const assigned = u.assignedRoutines?.[0]?.routine;
                  const isAssigning = assigningUserId === u.id;

                  return (
                    <div
                      key={u.id}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 16px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      {/* Info de Alumno */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--red-primary)',
                          color: '#fff',
                          fontWeight: 900,
                          fontSize: 18,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-heading)',
                        }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--gray-dark)' }}>{u.name}</span>
                            <span className={`badge ${u.gender === 'FEMALE' ? 'badge-amber' : 'badge-muted'}`}>
                              {u.gender === 'FEMALE' ? 'Mujer' : 'Hombre'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--gray-muted)', marginTop: 2, fontWeight: 600 }}>
                            {u._count?.workoutSessions || 0} entrenamientos completados
                          </div>
                        </div>
                      </div>

                      {/* Estado de Rutina y Botón Asignar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div>
                          {assigned ? (
                            <div style={{ textAlign: 'right' }}>
                              <span className="badge badge-green">Rutina Asignada</span>
                              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-dark)', marginTop: 2 }}>
                                {assigned.name}
                              </div>
                            </div>
                          ) : (
                            <span className="badge badge-muted">Sin rutina fija</span>
                          )}
                        </div>

                        {/* Botón o Selector */}
                        {isAssigning ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignRoutine(u.id, e.target.value);
                                }
                              }}
                              defaultValue=""
                              style={{
                                background: '#ffffff',
                                border: '1.5px solid var(--border-active)',
                                color: 'var(--gray-dark)',
                                padding: '7px 10px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 13,
                                outline: 'none',
                                fontWeight: 600,
                              }}
                            >
                              <option value="" disabled>Seleccionar rutina...</option>
                              {routines.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => setAssigningUserId(null)}
                              style={{ color: 'var(--gray-muted)', fontSize: 12, padding: 4 }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningUserId(u.id)}
                            className="btn-outline-red"
                            style={{ padding: '7px 12px', fontSize: 12 }}
                          >
                            <span>{assigned ? 'Cambiar Rutina' : 'Asignar Rutina'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: MODIFICAR EJERCICIOS */}
        {adminTab === 'exercises' && (
          <div className="card-clean">
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginBottom: 18,
            }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--gray-dark)' }}>
                  Modificar Nombres de Ejercicios
                </h2>
                <p style={{ fontSize: 13, color: 'var(--gray-muted)' }}>
                  Personalizá cómo se llaman los ejercicios para que coincidan con la jerga de tu gimnasio
                </p>
              </div>

              {/* Buscador de Ejercicio */}
              <div style={{ position: 'relative', minWidth: 260 }}>
                <label className="sr-only" htmlFor="admin-exercise-search">Buscar ejercicio</label>
                <input
                  id="admin-exercise-search"
                  type="search"
                  placeholder="Buscar ejercicio a modificar..."
                  value={searchExercise}
                  onChange={(e) => setSearchExercise(e.target.value)}
                  className="input-field"
                  style={{ padding: '8px 12px 8px 36px', fontSize: 13 }}
                />
                <Search size={16} color="var(--gray-light)" style={{ position: 'absolute', left: 12, top: 11 }} />
              </div>
            </div>

            {/* Lista de Ejercicios con edición */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredExercises.map((ex) => {
                const isEditing = editingExId === ex.id;
                const isSaving = savingExId === ex.id;

                return (
                  <div
                    key={ex.id}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <span className="badge badge-muted" style={{ marginBottom: 4 }}>
                        {ex.equipment} • {ex.muscles?.find((m: any) => m.isPrimary)?.muscleGroup?.name || 'General'}
                      </span>

                      {isEditing ? (
                        <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="text"
                            value={editingExName}
                            onChange={(e) => setEditingExName(e.target.value)}
                            className="input-field"
                            style={{ padding: '6px 10px', fontSize: 15, fontWeight: 700, maxWidth: 360 }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveExerciseName(ex.id)}
                            disabled={isSaving}
                            className="btn-primary"
                            style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
                          >
                            <Save size={14} />
                            <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                          </button>
                          <button
                            onClick={() => setEditingExId(null)}
                            className="btn-secondary"
                            style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-dark)', marginTop: 2 }}>
                          {ex.name}
                        </h4>
                      )}
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingExId(ex.id);
                          setEditingExName(ex.name);
                        }}
                        className="btn-secondary"
                        style={{ width: 'auto', padding: '7px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Edit2 size={13} color="var(--red-primary)" />
                        <span>Modificar Nombre</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
