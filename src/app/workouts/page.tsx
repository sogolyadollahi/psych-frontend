"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { SignOutButton } from "@/components/sign-out-button";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import type { Workout } from "@/lib/contracts";

function todayLocal() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function WorkoutsPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [muscleGroup, setMuscleGroup] = useState("");
  const [duration, setDuration] = useState("45");
  const [date, setDate] = useState(todayLocal);
  const [calories, setCalories] = useState("");
  const [error, setError] = useState("");

  const query = useQuery({
    queryKey: ["workouts"],
    queryFn: () => api.get<Workout[]>("/workouts"),
    enabled: Boolean(user),
  });
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["workouts"] });
    await client.invalidateQueries({ queryKey: ["statistics"] });
    await client.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const create = useMutation({
    mutationFn: () => api.post<Workout>("/workouts", {
      muscle_group: muscleGroup.trim(),
      duration_minutes: Number(duration),
      workout_date: date,
      calories_burned: calories.trim() ? Number(calories) : null,
    }),
    onSuccess: async () => {
      setMuscleGroup("");
      setDuration("45");
      setCalories("");
      setError("");
      await refresh();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not save workout."),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete<void>(`/workouts/${id}`),
    onSuccess: refresh,
  });

  const workouts = query.data ?? [];
  const totalMinutes = workouts.reduce((sum, item) => sum + item.duration_minutes, 0);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!muscleGroup.trim()) return setError("Enter a workout or muscle group.");
    if (!Number.isInteger(Number(duration)) || Number(duration) < 1 || Number(duration) >= 1440) {
      return setError("Duration must be a whole number between 1 and 1439.");
    }
    if (calories.trim() && (!Number.isInteger(Number(calories)) || Number(calories) < 0)) {
      return setError("Calories must be a non-negative whole number.");
    }
    create.mutate();
  }

  return (
    <AuthGuard>
      <main className="app-shell">
        <aside className="sidebar">
          <Link className="brand" href="/"><span className="brand-mark">✳</span><span>psych<span className="brand-dot">.</span></span></Link>
          <div className="workspace-label">WORKSPACE</div>
          <nav className="nav-list" aria-label="Main navigation">
            <Link className="nav-item" href="/"><span>◫</span><span>Overview</span></Link>
            <Link className="nav-item active" href="/workouts"><span>▤</span><span>Workouts</span></Link>
          </nav>
          <div className="sidebar-bottom"><SignOutButton /></div>
        </aside>
        <section className="main-panel">
          <header className="topbar">
            <div className="breadcrumbs"><Link href="/">Workspace</Link><span className="crumb-slash">/</span><strong>Workouts</strong></div>
            <div className="today-label">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
          </header>
          <div className="dashboard-content">
            <section className="welcome-row">
              <div><p className="eyebrow"><span className="status-dot" /> TRAINING LOG</p><h1>Workouts</h1><p className="subheading">Record training sessions and review your workout history.</p></div>
              <Link className="secondary-button workout-back-link" href="/">Back to overview</Link>
            </section>
            <section className="stats-grid workout-stats">
              <article className="stat-card"><p className="stat-label">Recorded sessions</p><div className="stat-value-row"><strong>{workouts.length}</strong><span>total</span></div></article>
              <article className="stat-card"><p className="stat-label">Total workout time</p><div className="stat-value-row"><strong>{totalMinutes.toLocaleString()}</strong><span>minutes</span></div></article>
            </section>
            <section className="workout-layout">
              <article className="panel">
                <div className="panel-heading"><div><h2>Log a workout</h2><p>Save a completed training session</p></div></div>
                <form className="workout-form" onSubmit={submit}>
                  <label htmlFor="workout-group">Workout / muscle group</label>
                  <input id="workout-group" value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)} placeholder="e.g. Upper body, Legs, Push day" maxLength={100} required />
                  <div className="workout-form-row">
                    <div><label htmlFor="workout-duration">Duration (minutes)</label><input id="workout-duration" type="number" min="1" max="1439" value={duration} onChange={(e) => setDuration(e.target.value)} required /></div>
                    <div><label htmlFor="workout-date">Workout date</label><input id="workout-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
                  </div>
                  <label htmlFor="workout-calories">Calories burned (optional)</label>
                  <input id="workout-calories" type="number" min="0" step="1" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Leave blank if unknown" />
                  {error && <p className="auth-error" role="alert">{error}</p>}
                  <button className="primary-button workout-submit" type="submit" disabled={create.isPending}>{create.isPending ? "Saving…" : "Save workout"}</button>
                </form>
              </article>
              <article className="panel workout-history">
                <div className="panel-heading"><div><h2>Workout history</h2><p>Your saved sessions</p></div><button className="text-button" type="button" onClick={() => void query.refetch()}>Refresh ↻</button></div>
                {query.isLoading && <p className="muted-text" role="status">Loading workout history…</p>}
                {query.isError && <p className="auth-error" role="alert">Could not load workouts. Check the API connection and try again.</p>}
                {query.isSuccess && workouts.length === 0 && <p className="muted-text">No workouts recorded yet. Add your first session using the form.</p>}
                {workouts.map((item) => (
                  <div className="workout-record" key={item.id}>
                    <div className="workout-record-main"><strong>{item.muscle_group}</strong><span>{new Date(item.workout_date + "T12:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span></div>
                    <div className="workout-record-meta"><span>{item.duration_minutes} min</span><span>{item.calories_burned === null ? "Calories not set" : `${item.calories_burned} kcal`}</span></div>
                    <button className="workout-delete" type="button" disabled={remove.isPending} onClick={() => { if (window.confirm("Delete this workout record?")) remove.mutate(item.id); }}>Delete</button>
                  </div>
                ))}
                {remove.isError && <p className="auth-error" role="alert">Could not delete workout. Please try again.</p>}
              </article>
            </section>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
