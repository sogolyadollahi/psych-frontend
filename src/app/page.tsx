"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import type { DashboardToday, UserProfile } from "@/lib/contracts";
import { AuthGuard } from "@/components/auth-guard";
import { SignOutButton } from "@/components/sign-out-button";
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Dumbbell,
  Flame,
  Leaf,
  Plus,
  Search,
  Settings2,
  Target,
  Utensils,
} from "lucide-react";

const navItems = [
  { label: "Overview", icon: Activity, active: true },
  { label: "Workouts", icon: Dumbbell },
  { label: "Nutrition", icon: Utensils },
  { label: "Supplements", icon: Leaf },
  { label: "Progress", icon: Target },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const todayQuery = useQuery({
    queryKey: ["dashboard", "today"],
    queryFn: () => api.get<DashboardToday>("/dashboard/today"),
    enabled: Boolean(user),
  });
  const profileQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => api.get<UserProfile>("/users/me"),
    enabled: Boolean(user),
  });
  const dashboard = todayQuery.data;
  const profile = profileQuery.data;
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "there";
  const avatarLabel = displayName.slice(0, 2).toUpperCase();
  const stats = [
    { label: "Calories consumed", value: dashboard ? Math.round(dashboard.calories).toLocaleString() : "—", unit: "kcal", meta: "Today", icon: Flame },
    { label: "Protein intake", value: dashboard ? Math.round(dashboard.protein).toString() : "—", unit: "g", meta: "Today", icon: Utensils },
    { label: "Workout time", value: dashboard ? dashboard.workout_duration_minutes.toString() : "—", unit: "min", meta: "Today", icon: Dumbbell },
    { label: "Active supplements", value: dashboard ? dashboard.active_supplements.toString() : "—", unit: dashboard ? "/ " + dashboard.total_supplements : "", meta: "Currently active", icon: Leaf },
  ];
  const todayLabel = dashboard
    ? new Date(dashboard.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : "Today";
  return (
    <AuthGuard>
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Psych home">
          <span className="brand-mark"><Activity size={21} strokeWidth={2.6} /></span>
          <span>psych<span className="brand-dot">.</span></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon, active }) => (
            <a className={`nav-item ${active ? "active" : ""}`} href="#" key={label}>
              <Icon size={18} />
              <span>{label}</span>
              {label === "Supplements" && <span className="nav-count">3</span>}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><Target size={18} /></div>
            <p className="upgrade-title">Stay consistent</p>
            <p className="upgrade-copy">Small steps. Measurable progress.</p>
            <div className="mini-progress"><span /></div>
            <div className="progress-caption"><span>Weekly goal</span><strong>4/5 days</strong></div>
          </div>
          <a className="nav-item muted" href="#"><Settings2 size={18} /><span>Settings</span></a>
          <a className="nav-item muted" href="#"><CircleHelp size={18} /><span>Help center</span></a>
          <SignOutButton />
          <div className="profile-mini">
            <div className="avatar">{avatarLabel}</div>
            <div className="profile-meta"><strong>{displayName}</strong><span>Psych account</span></div>
            <ChevronDown size={16} className="profile-chevron" />
          </div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>Overview</strong></div>
          <div className="topbar-actions">
            <button className="icon-button search-button" aria-label="Search"><Search size={18} /></button>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="topbar-divider" />
            <div className="today-label"><CalendarDays size={16} /><span>{todayLabel}</span></div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow"><span className="status-dot" /> YOUR PERSONAL HEALTH SPACE</p>
              <h1>Welcome, {displayName} <span className="wave">✳</span></h1>
              <p className="subheading">Here&apos;s your health snapshot for today. Keep your momentum going.</p>
            </div>
            <button className="primary-button"><Plus size={17} /> Log activity</button>
          </section>

          {todayQuery.isLoading && <p role="status">Loading your dashboard data…</p>}
          {todayQuery.isError && (
            <p className="auth-error" role="alert">
              Could not load dashboard data. {todayQuery.error instanceof Error ? todayQuery.error.message : "Please try again."}
            </p>
          )}
          <section className="stats-grid" aria-label="Daily statistics">
            {stats.map(({ label, value, unit, meta, icon: Icon }) => (
              <article className="stat-card" key={label}>
                <div className="stat-top"><span className="stat-icon"><Icon size={18} /></span><button className="more-button" aria-label={`More about ${label}`}>•••</button></div>
                <p className="stat-label">{label}</p>
                <div className="stat-value-row"><strong>{value}</strong><span>{unit}</span></div>
                <div className="stat-change"><span className="change-context">{meta}</span></div>
              </article>
            ))}
          </section>

          <section className="content-grid">
            <article className="panel activity-panel">
              <div className="panel-heading">
                <div><h2>Weekly activity</h2><p>Your movement at a glance</p></div>
                <button className="select-button">This week <ChevronDown size={15} /></button>
              </div>
              <div className="chart-summary"><strong>4h 32m</strong><span className="chart-pill"><ArrowUpRight size={13} /> 14.6%</span><span className="muted-text">vs. last week</span></div>
              <div className="chart-area">
                <div className="chart-y-labels"><span>5h</span><span>4h</span><span>3h</span><span>2h</span><span>1h</span><span>0</span></div>
                <div className="chart-plot">
                  {[0,1,2,3,4,5].map((n) => <div className="chart-gridline" key={n} />)}
                  <svg viewBox="0 0 600 190" preserveAspectRatio="none" role="img" aria-label="Illustrative weekly activity chart">
                    <defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#b8f34a" stopOpacity=".22" /><stop offset="100%" stopColor="#b8f34a" stopOpacity="0" /></linearGradient></defs>
                    <path d="M0 146 C35 140 45 110 85 122 S145 150 185 99 S250 116 285 75 S340 102 385 58 S440 84 475 45 S545 78 600 20 L600 190 L0 190 Z" fill="url(#areaFill)" />
                    <path d="M0 146 C35 140 45 110 85 122 S145 150 185 99 S250 116 285 75 S340 102 385 58 S440 84 475 45 S545 78 600 20" fill="none" stroke="#b8f34a" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="475" cy="45" r="5" fill="#b8f34a" stroke="#20231c" strokeWidth="3" />
                  </svg>
                  <div className="chart-x-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
                </div>
              </div>
              <div className="chart-footer"><span><i className="legend-dot" /> Active minutes</span><span className="chart-footnote">Sample dashboard preview · API connection pending</span></div>
            </article>

            <article className="panel goals-panel">
              <div className="panel-heading"><div><h2>Daily nutrition</h2><p>Fuel your day with intention</p></div><button className="more-button" aria-label="Nutrition options">•••</button></div>
              <div className="calorie-ring-wrap">
                <div className="calorie-ring"><div className="ring-center"><span>Calories</span><strong>1,640</strong><small>of 2,200 kcal</small></div></div>
              </div>
              <div className="nutrition-legend">
                <div className="nutrition-row"><span className="nutrition-name"><i className="protein-dot" /> Protein</span><strong>112 <small>/ 140 g</small></strong><div className="nutrition-track"><span className="protein-fill" /></div></div>
                <div className="nutrition-row"><span className="nutrition-name"><i className="carbs-dot" /> Carbs</span><strong>168 <small>/ 220 g</small></strong><div className="nutrition-track"><span className="carbs-fill" /></div></div>
                <div className="nutrition-row"><span className="nutrition-name"><i className="fat-dot" /> Fat</span><strong>48 <small>/ 70 g</small></strong><div className="nutrition-track"><span className="fat-fill" /></div></div>
              </div>
              <button className="secondary-button">View nutrition details <span>↗</span></button>
            </article>
          </section>

          <section className="content-grid lower-grid">
            <article className="panel schedule-panel">
              <div className="panel-heading"><div><h2>Today&apos;s plan</h2><p>Make the next action count</p></div><button className="text-button">View schedule <span>→</span></button></div>
              <div className="plan-item"><div className="plan-icon workout"><Dumbbell size={18} /></div><div className="plan-copy"><strong>Upper body strength</strong><span>Workout · 45 min</span></div><span className="plan-time">09:30 AM</span><span className="plan-status done">Completed</span></div>
              <div className="plan-item"><div className="plan-icon meal"><Utensils size={18} /></div><div className="plan-copy"><strong>Post-workout meal</strong><span>Nutrition · Protein-focused</span></div><span className="plan-time">11:00 AM</span><span className="plan-status upcoming">Upcoming</span></div>
              <div className="plan-item"><div className="plan-icon supplement"><Leaf size={18} /></div><div className="plan-copy"><strong>Daily supplements</strong><span>Routine · 2 items</span></div><span className="plan-time">01:00 PM</span><span className="plan-status upcoming">Upcoming</span></div>
            </article>
            <article className="panel consistency-panel">
              <div className="panel-heading"><div><h2>Consistency</h2><p>Progress comes from showing up</p></div><span className="streak-icon">✳</span></div>
              <div className="streak-number">12 <span>day streak</span></div>
              <div className="streak-copy">You&apos;ve checked in every day for almost two weeks. Keep it going.</div>
              <div className="week-dots">{["M","T","W","T","F","S","S"].map((day, i) => <div className="week-day" key={`${day}-${i}`}><span>{day}</span><i className={i < 5 ? "checked" : ""}>{i < 5 ? "✓" : ""}</i></div>)}</div>
              <div className="consistency-footer"><span className="status-dot" /> You&apos;re building a habit</div>
            </article>
          </section>
          <footer className="page-footer"><span>PSYCH <span className="brand-dot">/</span> HEALTH & PERFORMANCE</span><span>Designed for consistency, built for progress.</span></footer>
        </div>
      </section>
    </main>
    </AuthGuard>
  );
}
