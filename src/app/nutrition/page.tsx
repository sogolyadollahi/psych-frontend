"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { SignOutButton } from "@/components/sign-out-button";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import type { FoodNutrition, FoodSearchResult, Meal, MealDetail } from "@/lib/contracts";

function todayLocal() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
const number = (value: string | number) => Number(value || 0);
const fmt = (value: string | number) => number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });

export default function NutritionPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [mealName, setMealName] = useState("Breakfast");
  const [mealDate, setMealDate] = useState(todayLocal);
  const [selectedMealId, setSelectedMealId] = useState<number | null>(null);
  const [foodQuery, setFoodQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [grams, setGrams] = useState("100");
  const [nutrition, setNutrition] = useState<FoodNutrition | null>(null);
  const [error, setError] = useState("");

  const mealsQuery = useQuery({
    queryKey: ["meals"],
    queryFn: () => api.get<Meal[]>("/meals"),
    enabled: Boolean(user),
  });
  const meals = useMemo(() => mealsQuery.data ?? [], [mealsQuery.data]);
  const activeMealId = selectedMealId ?? meals[0]?.id ?? null;
  const detailQuery = useQuery({
    queryKey: ["meals", activeMealId],
    queryFn: () => api.get<MealDetail>(`/meals/${activeMealId}`),
    enabled: Boolean(user && activeMealId),
  });
  const searchQuery = useQuery({
    queryKey: ["food-search", submittedQuery],
    queryFn: () => api.get<FoodSearchResult[]>(`/meals/foods/search?query=${encodeURIComponent(submittedQuery)}`),
    enabled: Boolean(user && submittedQuery.length > 1),
    retry: false,
  });

  const invalidateMeals = async () => {
    await client.invalidateQueries({ queryKey: ["meals"] });
    await client.invalidateQueries({ queryKey: ["dashboard"] });
    await client.invalidateQueries({ queryKey: ["statistics"] });
  };
  const createMeal = useMutation({
    mutationFn: () => api.post<Meal>("/meals", { name: mealName.trim(), meal_date: mealDate }),
    onSuccess: async (meal) => {
      setSelectedMealId(meal.id);
      setMealName("Breakfast");
      setError("");
      await invalidateMeals();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not create meal."),
  });
  const getNutrition = useMutation({
    mutationFn: () => api.post<FoodNutrition>("/meals/foods/nutrition", {
      fdc_id: selectedFood!.fdc_id,
      quantity_grams: Number(grams),
    }),
    onSuccess: (data) => { setNutrition(data); setError(""); },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not load nutrition data."),
  });
  const addFood = useMutation({
    mutationFn: () => api.post(`/meals/${activeMealId}/items`, {
      name: selectedFood!.description,
      quantity: Number(grams),
      unit: "g",
      calories: nutrition!.calories,
      protein: nutrition!.protein,
      carbs: nutrition!.carbs,
      fat: nutrition!.fat,
      source: "usda",
      source_food_id: String(selectedFood!.fdc_id),
    }),
    onSuccess: async () => {
      setSelectedFood(null);
      setNutrition(null);
      setFoodQuery("");
      setSubmittedQuery("");
      setError("");
      await invalidateMeals();
      await client.invalidateQueries({ queryKey: ["meals", activeMealId] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not add food."),
  });
  const deleteItem = useMutation({
    mutationFn: (itemId: number) => api.delete<void>(`/meals/${activeMealId}/items/${itemId}`),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["meals", activeMealId] });
      await invalidateMeals();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not remove food."),
  });
  const deleteMeal = useMutation({
    mutationFn: (mealId: number) => api.delete<void>(`/meals/${mealId}`),
    onSuccess: async () => {
      setSelectedMealId(null);
      await invalidateMeals();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not delete meal."),
  });

  const totals = detailQuery.data?.nutrition_totals;
  const selectedMeal = useMemo(() => meals.find((meal) => meal.id === activeMealId), [meals, activeMealId]);

  function submitMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!mealName.trim()) return setError("Enter a meal name.");
    createMeal.mutate();
  }
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSelectedFood(null);
    setNutrition(null);
    setError("");
    setSubmittedQuery(foodQuery.trim());
  }
  function loadNutrition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFood) return;
    if (!Number.isFinite(Number(grams)) || Number(grams) <= 0) return setError("Enter a weight greater than zero grams.");
    getNutrition.mutate();
  }

  return (
    <AuthGuard>
      <main className="app-shell">
        <aside className="sidebar">
          <Link className="brand" href="/"><span className="brand-mark">✳</span><span>psych<span className="brand-dot">.</span></span></Link>
          <div className="workspace-label">WORKSPACE</div>
          <nav className="nav-list" aria-label="Main navigation">
            <Link className="nav-item" href="/"><span>◫</span><span>Overview</span></Link>
            <Link className="nav-item" href="/workouts"><span>▤</span><span>Workouts</span></Link>
            <Link className="nav-item active" href="/nutrition"><span>◉</span><span>Nutrition</span></Link>
          </nav>
          <div className="sidebar-bottom"><SignOutButton /></div>
        </aside>
        <section className="main-panel">
          <header className="topbar">
            <div className="breadcrumbs"><Link href="/">Workspace</Link><span className="crumb-slash">/</span><strong>Nutrition</strong></div>
            <div className="today-label">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
          </header>
          <div className="dashboard-content">
            <section className="welcome-row">
              <div><p className="eyebrow"><span className="status-dot" /> NUTRITION TRACKER</p><h1>Nutrition</h1><p className="subheading">Search verified food data and record meals with calculated macros.</p></div>
              <Link className="secondary-button workout-back-link" href="/">Back to overview</Link>
            </section>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <section className="nutrition-layout">
              <article className="panel">
                <div className="panel-heading"><div><h2>Create a meal</h2><p>Start a meal record for a specific date</p></div></div>
                <form className="workout-form" onSubmit={submitMeal}>
                  <label htmlFor="meal-name">Meal name</label>
                  <input id="meal-name" value={mealName} onChange={(e) => setMealName(e.target.value)} maxLength={100} required />
                  <label htmlFor="meal-date">Meal date</label>
                  <input id="meal-date" type="date" value={mealDate} onChange={(e) => setMealDate(e.target.value)} required />
                  <button className="primary-button workout-submit" type="submit" disabled={createMeal.isPending}>{createMeal.isPending ? "Creating…" : "Create meal"}</button>
                </form>
                <div className="nutrition-meal-list">
                  <div className="panel-heading"><div><h2>Your meals</h2><p>Choose a meal to add food</p></div><button className="text-button" type="button" onClick={() => void mealsQuery.refetch()}>Refresh ↻</button></div>
                  {mealsQuery.isLoading && <p className="muted-text">Loading meals…</p>}
                  {mealsQuery.isError && <p className="auth-error">Could not load meals.</p>}
                  {meals.map((meal) => <button type="button" key={meal.id} className={`nutrition-meal-choice ${activeMealId === meal.id ? "selected" : ""}`} onClick={() => { setSelectedMealId(meal.id); setError(""); }}>
                    <span><strong>{meal.name}</strong><small>{new Date(meal.meal_date + "T12:00:00").toLocaleDateString()}</small></span><span>›</span>
                  </button>)}
                  {mealsQuery.isSuccess && meals.length === 0 && <p className="muted-text">No meals yet. Create your first meal above.</p>}
                </div>
              </article>
              <div className="nutrition-right-column">
                <article className="panel">
                  <div className="panel-heading"><div><h2>Food database</h2><p>Search foods from the USDA database</p></div></div>
                  <form className="nutrition-search" onSubmit={submitSearch}>
                    <input aria-label="Search food" value={foodQuery} onChange={(e) => setFoodQuery(e.target.value)} placeholder="e.g. chicken breast, oats, banana" minLength={2} required />
                    <button className="primary-button" type="submit" disabled={foodQuery.trim().length < 2 || searchQuery.isFetching}>Search</button>
                  </form>
                  {searchQuery.isFetching && <p className="muted-text">Searching food database…</p>}
                  {searchQuery.isError && <p className="auth-error">Food search failed. Check the backend USDA API configuration and try again.</p>}
                  {searchQuery.data?.map((food) => <button className={`food-result ${selectedFood?.fdc_id === food.fdc_id ? "selected" : ""}`} type="button" key={food.fdc_id} onClick={() => { setSelectedFood(food); setNutrition(null); setError(""); }}>
                    <span><strong>{food.description}</strong><small>{food.data_type ?? "USDA food"} · ID {food.fdc_id}</small></span><span>›</span>
                  </button>)}
                  {searchQuery.isSuccess && (searchQuery.data?.length ?? 0) === 0 && <p className="muted-text">No matching foods found.</p>}
                  {selectedFood && <form className="nutrition-quantity" onSubmit={loadNutrition}>
                    <div><strong>{selectedFood.description}</strong><small>Nutrition will be calculated for your entered weight.</small></div>
                    <label htmlFor="food-grams">Quantity (grams)</label>
                    <div className="nutrition-search"><input id="food-grams" type="number" min="0.01" step="0.01" value={grams} onChange={(e) => { setGrams(e.target.value); setNutrition(null); }} required /><button className="secondary-button" type="submit" disabled={getNutrition.isPending}>{getNutrition.isPending ? "Calculating…" : "Calculate"}</button></div>
                    {nutrition && <div className="nutrition-preview">
                      <div><span>Calories</span><strong>{fmt(nutrition.calories)} kcal</strong></div><div><span>Protein</span><strong>{fmt(nutrition.protein)} g</strong></div><div><span>Carbs</span><strong>{fmt(nutrition.carbs)} g</strong></div><div><span>Fat</span><strong>{fmt(nutrition.fat)} g</strong></div>
                      <button className="primary-button workout-submit" type="button" disabled={!activeMealId || addFood.isPending} onClick={() => addFood.mutate()}>{addFood.isPending ? "Adding…" : activeMealId ? "Add to selected meal" : "Create a meal first"}</button>
                    </div>}
                  </form>}
                </article>
                <article className="panel">
                  <div className="panel-heading"><div><h2>{selectedMeal?.name ?? "Meal details"}</h2><p>{selectedMeal ? new Date(selectedMeal.meal_date + "T12:00:00").toLocaleDateString() : "Select a meal to see its contents"}</p></div>
                    {selectedMeal && <button className="workout-delete" type="button" disabled={deleteMeal.isPending} onClick={() => { if (window.confirm("Delete this meal and all its food items?")) deleteMeal.mutate(selectedMeal.id); }}>Delete meal</button>}
                  </div>
                  {detailQuery.isLoading && <p className="muted-text">Loading meal details…</p>}
                  {detailQuery.isError && <p className="auth-error">Could not load this meal.</p>}
                  {detailQuery.data && <>
                    <div className="nutrition-preview meal-totals">
                      <div><span>Calories</span><strong>{fmt(totals?.calories ?? 0)} kcal</strong></div><div><span>Protein</span><strong>{fmt(totals?.protein ?? 0)} g</strong></div><div><span>Carbs</span><strong>{fmt(totals?.carbs ?? 0)} g</strong></div><div><span>Fat</span><strong>{fmt(totals?.fat ?? 0)} g</strong></div>
                    </div>
                    {detailQuery.data.items.map((item) => <div className="nutrition-item" key={item.id}>
                      <div><strong>{item.name}</strong><small>{fmt(item.quantity)} {item.unit} · {fmt(item.calories)} kcal · P {fmt(item.protein)}g · C {fmt(item.carbs)}g · F {fmt(item.fat)}g</small></div>
                      <button className="workout-delete" type="button" disabled={deleteItem.isPending} onClick={() => { if (window.confirm("Remove this food item?")) deleteItem.mutate(item.id); }}>Remove</button>
                    </div>)}
                    {detailQuery.data.items.length === 0 && <p className="muted-text">No food items in this meal yet.</p>}
                  </>}
                </article>
              </div>
            </section>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
