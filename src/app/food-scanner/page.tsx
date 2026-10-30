"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { SignOutButton } from "@/components/sign-out-button";
import { useAuth } from "@/components/auth-provider";
import { api, apiRequest } from "@/lib/api";
import type { Meal } from "@/lib/contracts";

interface Detection { name: string }
interface ScanResponse { detections: Detection[] }
interface FoodCandidate {
  fdc_id: number;
  description: string;
  data_type: string | null;
  brand_owner: string | null;
}
interface CandidateResponse {
  detected_food: string;
  candidates: FoodCandidate[];
}
interface MealItem {
  id: number;
  meal_id: number;
  name: string;
  quantity: string | number;
  unit: string;
  calories: string | number;
  protein: string | number;
  carbs: string | number;
  fat: string | number;
  source: string | null;
  source_food_id: string | null;
}

const formatNumber = (value: string | number) =>
  Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });

function FoodScannerContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedDetection, setSelectedDetection] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<FoodCandidate | null>(null);
  const [grams, setGrams] = useState("100");
  const [mealId, setMealId] = useState("");
  const [error, setError] = useState("");

  const mealsQuery = useQuery({
    queryKey: ["meals"],
    queryFn: () => api.get<Meal[]>("/meals"),
    enabled: Boolean(user),
  });
  const meals = useMemo(() => mealsQuery.data ?? [], [mealsQuery.data]);

  const scanMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Select an image first.");
      const formData = new FormData();
      formData.append("image", file);
      return apiRequest<ScanResponse>("/food-scanner/scan", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (result) => {
      setSelectedDetection("");
      setSelectedCandidate(null);
      setError("");
      if (result.detections.length === 0) setError("No food items were detected. Try a clearer image.");
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Image scan failed."),
  });

  const candidatesQuery = useQuery({
    queryKey: ["food-scanner", "candidates", selectedDetection],
    queryFn: () =>
      api.get<CandidateResponse>(
        `/food-scanner/candidates?detected_food=${encodeURIComponent(selectedDetection)}&page_size=10`,
      ),
    enabled: Boolean(user && selectedDetection),
    retry: false,
  });

  const addMutation = useMutation({
    mutationFn: () => api.post<MealItem>("/food-scanner/items", {
      meal_id: Number(mealId),
      fdc_id: selectedCandidate!.fdc_id,
      quantity_grams: Number(grams),
    }),
    onSuccess: async () => {
      setSelectedCandidate(null);
      setSelectedDetection("");
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["meals"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["statistics"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not add scanned food."),
  });

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setError("");
    setSelectedDetection("");
    setSelectedCandidate(null);
    setFile(nextFile);
    scanMutation.reset();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : "");
  }

  function submitScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!file) return setError("Choose an image to scan.");
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) return setError("Use a JPEG, PNG, or WebP image.");
    if (file.size > 5 * 1024 * 1024) return setError("Image must be 5 MB or smaller.");
    scanMutation.mutate();
  }

  function addScannedFood() {
    if (!mealId) return setError("Select a meal before adding food.");
    if (!selectedCandidate) return setError("Select a USDA food candidate.");
    const amount = Number(grams);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      return setError("Enter a quantity between 0 and 100,000 grams.");
    }
    setError("");
    addMutation.mutate();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/"><span className="brand-mark">✳</span><span>psych<span className="brand-dot">.</span></span></Link>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          <Link className="nav-item" href="/"><span>◫</span><span>Overview</span></Link>
          <Link className="nav-item" href="/workouts"><span>▤</span><span>Workouts</span></Link>
          <Link className="nav-item" href="/nutrition"><span>◉</span><span>Nutrition</span></Link>
          <Link className="nav-item active" href="/food-scanner"><span>⌕</span><span>Food Scanner</span></Link>
        </nav>
        <div className="sidebar-bottom"><SignOutButton /></div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs"><Link href="/">Workspace</Link><span className="crumb-slash">/</span><strong>Food Scanner</strong></div>
          <div className="today-label">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow"><span className="status-dot" /> FOOD RECOGNITION</p>
              <h1>Food Scanner</h1>
              <p className="subheading">Upload a meal photo, review detected foods, then select verified nutrition data.</p>
            </div>
            <Link className="secondary-button workout-back-link" href="/nutrition">Open nutrition tracker</Link>
          </section>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <section className="scanner-layout">
            <article className="panel">
              <div className="panel-heading"><div><h2>1. Upload a food image</h2><p>JPEG, PNG or WebP · maximum 5 MB</p></div></div>
              <form className="workout-form" onSubmit={submitScan}>
                <label htmlFor="food-image">Food photo</label>
                <input id="food-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} />
                {previewUrl && <img className="scanner-preview" src={previewUrl} alt="Selected food preview" />}
                {file && <p className="muted-text">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
                <button className="primary-button workout-submit" type="submit" disabled={!file || scanMutation.isPending}>
                  {scanMutation.isPending ? "Analyzing image…" : "Scan image"}
                </button>
              </form>
              <p className="scanner-note">The AI identifies visible food names only. Nutrition values are retrieved separately from USDA after you select a candidate.</p>
            </article>

            <article className="panel">
              <div className="panel-heading"><div><h2>2. Review detected foods</h2><p>Select one item to find matching USDA records</p></div></div>
              {scanMutation.isPending && <p className="muted-text">Waiting for the image recognition service…</p>}
              {scanMutation.data?.detections.map((detection, index) => (
                <button
                  type="button"
                  key={`${detection.name}-${index}`}
                  className={`food-result ${selectedDetection === detection.name ? "selected" : ""}`}
                  onClick={() => { setSelectedDetection(detection.name); setSelectedCandidate(null); setError(""); }}
                >
                  <span><strong>{detection.name}</strong><small>AI-detected food · select to search USDA</small></span><span>›</span>
                </button>
              ))}
              {!scanMutation.data && !scanMutation.isPending && <p className="muted-text">Detected foods will appear here after scanning.</p>}
              {selectedDetection && (
                <div className="scanner-candidates">
                  <div className="panel-heading"><div><h3>USDA matches for “{selectedDetection}”</h3><p>Choose the closest food description</p></div></div>
                  {candidatesQuery.isFetching && <p className="muted-text">Searching USDA…</p>}
                  {candidatesQuery.isError && <p className="auth-error">Could not retrieve candidates. Check the USDA API configuration.</p>}
                  {candidatesQuery.data?.candidates.map((candidate) => (
                    <button
                      type="button"
                      key={candidate.fdc_id}
                      className={`food-result ${selectedCandidate?.fdc_id === candidate.fdc_id ? "selected" : ""}`}
                      onClick={() => { setSelectedCandidate(candidate); setError(""); }}
                    >
                      <span><strong>{candidate.description}</strong><small>{candidate.data_type ?? "USDA food"}{candidate.brand_owner ? ` · ${candidate.brand_owner}` : ""} · ID {candidate.fdc_id}</small></span><span>›</span>
                    </button>
                  ))}
                  {candidatesQuery.isSuccess && candidatesQuery.data.candidates.length === 0 && <p className="muted-text">No USDA matches found for this detection.</p>}
                </div>
              )}
            </article>

            <article className="panel scanner-confirm-panel">
              <div className="panel-heading"><div><h2>3. Add to a meal</h2><p>Confirm the food, quantity and destination</p></div></div>
              <div className="workout-form">
                <label htmlFor="scanner-meal">Destination meal</label>
                <select id="scanner-meal" value={mealId} onChange={(e) => setMealId(e.target.value)}>
                  <option value="">Select a meal</option>
                  {meals.map((meal) => <option key={meal.id} value={meal.id}>{meal.name} · {meal.meal_date}</option>)}
                </select>
                {mealsQuery.isError && <p className="auth-error">Could not load meals.</p>}
                {meals.length === 0 && mealsQuery.isSuccess && <p className="muted-text">Create a meal in Nutrition before adding scanned food.</p>}
                <label htmlFor="scanner-grams">Quantity (grams)</label>
                <input id="scanner-grams" type="number" min="0.01" max="100000" step="0.01" value={grams} onChange={(e) => setGrams(e.target.value)} />
                {selectedCandidate && <div className="scanner-selection"><strong>{selectedCandidate.description}</strong><small>USDA FDC ID: {selectedCandidate.fdc_id}</small></div>}
                <button className="primary-button workout-submit" type="button" disabled={!selectedCandidate || !mealId || addMutation.isPending} onClick={addScannedFood}>
                  {addMutation.isPending ? "Saving…" : "Add food to meal"}
                </button>
              </div>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}

export default function FoodScannerPage() {
  return <AuthGuard><FoodScannerContent /></AuthGuard>;
}
