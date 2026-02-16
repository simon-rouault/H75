'use client';

import { useState, useRef } from 'react';
import { useUser } from '@/hooks/useUser';
import { useMeals, useMealHistory } from '@/hooks/useMeals';
import { useProfile } from '@/hooks/useProfile';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { today } from '@/lib/dates';
import { calculateMacros, ACTIVITY_LABELS, GOAL_LABELS, type UserProfile } from '@/lib/macros';
import type { Meal } from '@/types/database';

type InputMode = 'text' | 'photo' | 'voice';

interface AIResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ai_raw_response?: string;
}

/* ─── SVG Ring Chart ─── */
function CalorieRing({ value, target }: { value: number; target: number }) {
  const radius = 65;
  const stroke = 7;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / target, 1);
  const offset = circumference * (1 - pct);
  const remaining = Math.max(target - value, 0);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
        {/* Track */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--border)" strokeWidth={stroke} opacity={0.5} />
        {/* Fill */}
        <circle
          cx="80" cy="80" r={radius} fill="none"
          stroke={pct >= 1 ? 'var(--green)' : 'var(--accent)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1), stroke 0.5s ease', '--ring-circumference': circumference } as React.CSSProperties}
        />
        {/* Glow overlay */}
        <circle
          cx="80" cy="80" r={radius} fill="none"
          stroke={pct >= 1 ? 'var(--green)' : 'var(--accent)'}
          strokeWidth={stroke + 6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          opacity={0.15}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)', filter: 'blur(6px)' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-[family-name:var(--font-jetbrains-mono)] text-[28px] font-bold tracking-tight leading-none">
          {Math.round(value)}
        </span>
        <span className="text-[10px] text-muted/50 mt-1 uppercase tracking-[0.15em] font-semibold">
          {remaining > 0 ? `${Math.round(remaining)} restant` : 'Objectif atteint'}
        </span>
      </div>
    </div>
  );
}

/* ─── Macro Bar (horizontal) ─── */
function MacroBar({ label, value, target, color, icon }: { label: string; value: number; target: number; color: string; icon: string }) {
  const pct = Math.min((value / target) * 100, 100);
  const done = value >= target;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${color.replace('bg-', 'bg-')}/10`}>
        <span className={`${color.replace('bg-', 'text-')}`}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[11px] text-muted font-semibold uppercase tracking-[0.1em]">{label}</span>
          <div className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] font-bold">
            {Math.round(value)}<span className="text-muted/30 font-normal text-[11px]">/{target}g</span>
          </div>
        </div>
        <div className="w-full h-[5px] bg-foreground/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${done ? 'bg-green' : color}`}
            style={{ width: `${pct}%`, boxShadow: pct > 5 ? `0 0 12px -2px currentColor` : 'none' }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Mini Ring for Modal ─── */
function MiniRing({ value, label, unit, color }: { value: number; label: string; unit: string; color: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pctVisual = Math.min(value / (label === 'Calories' ? 800 : 80), 1);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth={3.5} opacity={0.4} />
          <circle
            cx="28" cy="28" r={r} fill="none"
            stroke={color}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pctVisual)}
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-[11px] font-bold">{Math.round(value)}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[10px] text-muted font-semibold uppercase tracking-[0.08em]">{label}</div>
        <div className="text-[9px] text-muted/40">{unit}</div>
      </div>
    </div>
  );
}

export default function FoodPage() {
  const { userId } = useUser();
  const { meals, totals, addMeal, deleteMeal } = useMeals(userId);
  const { history } = useMealHistory(userId);
  const { profile, targets, saveProfile } = useProfile(userId);
  const [showHistory, setShowHistory] = useState(false);

  const [mode, setMode] = useState<InputMode>('text');
  const [showProfile, setShowProfile] = useState(false);
  const [editProfile, setEditProfile] = useState<UserProfile>(profile);
  const [textInput, setTextInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { transcript, listening, start: startVoice, stop: stopVoice } = useVoiceInput();

  const [addingRecent, setAddingRecent] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  // Segmented control animation
  const modeIndex = mode === 'text' ? 0 : mode === 'photo' ? 1 : 2;

  async function quickAddMeal(meal: Meal) {
    if (addingRecent) return;
    setAddingRecent(meal.id);
    try {
      await addMeal({
        user_id: userId,
        date: today(),
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        input_type: 'text',
        ai_raw_response: null,
        manually_adjusted: false,
      } as Omit<Meal, 'id' | 'created_at'>);
      setJustAdded(meal.id);
      setTimeout(() => setJustAdded(null), 1200);
    } catch {
      // silently fail — the meal won't appear in today's list
    } finally {
      setAddingRecent(null);
    }
  }

  async function analyzeFood(input_type: InputMode, text?: string, image_base64?: string, image_media_type?: string) {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/food-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_type, text, image_base64, image_media_type }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiResult(data);
      setShowResult(true);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'analyse');
    } finally {
      setAnalyzing(false);
    }
  }

  function handleTextSubmit() {
    if (!textInput.trim()) return;
    analyzeFood('text', textInput);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      analyzeFood('photo', undefined, base64, file.type);
    };
    reader.readAsDataURL(file);
  }

  function handleVoiceSubmit() {
    if (!transcript.trim()) return;
    analyzeFood('voice', transcript);
  }

  async function saveResult() {
    if (!aiResult) return;
    await addMeal({
      user_id: userId,
      date: today(),
      name: aiResult.name,
      calories: aiResult.calories,
      protein: aiResult.protein,
      carbs: aiResult.carbs,
      fat: aiResult.fat,
      input_type: mode,
      ai_raw_response: aiResult.ai_raw_response || null,
      manually_adjusted: false,
    } as Omit<Meal, 'id' | 'created_at'>);
    setShowResult(false);
    setAiResult(null);
    setTextInput('');
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Repas" subtitle="Suivi nutritionnel" />

      {/* ═══════ HERO MACROS ═══════ */}
      <div className="relative bg-card rounded-3xl border border-border p-6 overflow-hidden">
        {/* Subtle ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-accent/[0.06] rounded-full blur-[60px] pointer-events-none" />

        {/* Settings button */}
        <button
          onClick={() => { setEditProfile(profile); setShowProfile(true); }}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-foreground/[0.04] hover:bg-foreground/[0.08] flex items-center justify-center text-muted/40 hover:text-muted transition-all duration-200 text-[13px]"
        >
          ⚙
        </button>

        {/* Calorie ring centered */}
        <div className="flex justify-center mb-6">
          <CalorieRing value={totals.calories} target={targets.calories} />
        </div>

        {/* Macro bars */}
        <div className="space-y-4">
          <MacroBar label="Protéines" value={totals.protein} target={targets.protein} color="bg-blue" icon="P" />
          <MacroBar label="Glucides" value={totals.carbs} target={targets.carbs} color="bg-yellow" icon="G" />
          <MacroBar label="Lipides" value={totals.fat} target={targets.fat} color="bg-red" icon="L" />
        </div>
      </div>

      {/* ═══════ INPUT SECTION ═══════ */}
      <div className="space-y-4">
        {/* Segmented control */}
        <div className="relative flex bg-card rounded-2xl border border-border p-1.5">
          {/* Sliding pill indicator */}
          <div
            className="absolute top-1.5 bottom-1.5 rounded-xl bg-accent transition-all duration-300 ease-out shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_16px_-4px_var(--glow-strong)]"
            style={{ left: `calc(${modeIndex * 33.333}% + 6px)`, width: 'calc(33.333% - 8px)' }}
          />
          {(['text', 'photo', 'voice'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`relative z-10 flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors duration-300 ${
                mode === m ? 'text-white' : 'text-muted/50 hover:text-muted'
              }`}
            >
              {m === 'text' ? '✎ Texte' : m === 'photo' ? '◉ Photo' : '♫ Voix'}
            </button>
          ))}
        </div>

        {/* Input card */}
        <div className="bg-card rounded-2xl border border-border p-5">
          {mode === 'text' && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                  placeholder="Poulet grillé, riz, légumes..."
                  className="w-full bg-foreground/[0.03] border border-border/60 rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted/30 focus:outline-none focus:border-accent/40 focus:bg-accent-soft/50 transition-all duration-200 text-[14px]"
                />
              </div>
              <button
                onClick={handleTextSubmit}
                disabled={analyzing || !textInput.trim()}
                className="w-full py-3 rounded-xl font-semibold text-[14px] bg-gradient-to-r from-accent to-accent-hover text-white transition-all duration-200 active:scale-[0.97] disabled:opacity-20 disabled:pointer-events-none shadow-[0_2px_16px_-4px_var(--glow-strong)]"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyse en cours...
                  </span>
                ) : 'Analyser'}
              </button>
            </div>
          )}

          {mode === 'photo' && (
            <div className="space-y-3">
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={analyzing}
                className="w-full py-10 rounded-xl border-2 border-dashed border-border/80 hover:border-accent/30 text-muted hover:text-foreground transition-all duration-300 flex flex-col items-center gap-3 disabled:opacity-20"
              >
                {analyzing ? (
                  <>
                    <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    <span className="text-[13px] font-medium">Analyse en cours...</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl opacity-40">📷</span>
                    <span className="text-[13px] font-medium">Prendre ou choisir une photo</span>
                  </>
                )}
              </button>
            </div>
          )}

          {mode === 'voice' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4">
                {listening ? (
                  <div className="space-y-4 flex flex-col items-center">
                    <div className="relative">
                      <div className="absolute inset-0 w-20 h-20 rounded-full bg-red/20 animate-breathe" />
                      <div className="relative w-20 h-20 rounded-full bg-red/10 border border-red/20 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-red animate-breathe" />
                      </div>
                    </div>
                    <p className="text-[13px] text-muted/60 font-medium">Écoute en cours...</p>
                    <Button size="sm" variant="danger" onClick={stopVoice}>Arrêter</Button>
                  </div>
                ) : (
                  <button
                    onClick={startVoice}
                    disabled={analyzing}
                    className="w-20 h-20 rounded-full bg-foreground/[0.04] border border-border hover:border-accent/30 flex items-center justify-center transition-all duration-300 hover:bg-accent-soft active:scale-95 disabled:opacity-20"
                  >
                    <span className="text-2xl opacity-50">🎙</span>
                  </button>
                )}
              </div>
              {transcript && (
                <div className="space-y-3">
                  <div className="bg-foreground/[0.03] rounded-xl p-4 text-[14px] border border-border/40 italic text-muted/80 leading-relaxed">
                    &ldquo;{transcript}&rdquo;
                  </div>
                  <button
                    onClick={handleVoiceSubmit}
                    disabled={analyzing}
                    className="w-full py-3 rounded-xl font-semibold text-[14px] bg-gradient-to-r from-accent to-accent-hover text-white transition-all duration-200 active:scale-[0.97] disabled:opacity-20 shadow-[0_2px_16px_-4px_var(--glow-strong)]"
                  >
                    {analyzing ? 'Analyse en cours...' : 'Analyser'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════ AI RESULT MODAL ═══════ */}
      <Modal open={showResult} onClose={() => setShowResult(false)} title="Résultat">
        {aiResult && (
          <div className="space-y-5">
            {/* Meal name with accent underline */}
            <div>
              <div className="text-lg font-bold tracking-tight">{aiResult.name}</div>
              <div className="h-[2px] w-12 bg-gradient-to-r from-accent to-transparent mt-2 rounded-full" />
            </div>

            {/* Mini rings row */}
            <div className="flex justify-around py-2">
              <MiniRing value={aiResult.calories} label="Calories" unit="kcal" color="var(--accent)" />
              <MiniRing value={aiResult.protein} label="Prot." unit="g" color="var(--blue)" />
              <MiniRing value={aiResult.carbs} label="Gluc." unit="g" color="var(--yellow)" />
              <MiniRing value={aiResult.fat} label="Lip." unit="g" color="var(--red)" />
            </div>

            <button
              onClick={saveResult}
              className="w-full py-3.5 rounded-xl font-semibold text-[14px] bg-gradient-to-r from-accent to-accent-hover text-white transition-all duration-200 active:scale-[0.97] shadow-[0_2px_16px_-4px_var(--glow-strong)]"
            >
              Sauvegarder
            </button>
          </div>
        )}
      </Modal>

      {/* ═══════ PROFILE SETTINGS MODAL ═══════ */}
      <Modal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        title="Mon profil"
        footer={
          <button
            onClick={() => { saveProfile(editProfile); setShowProfile(false); }}
            className="w-full py-3.5 rounded-xl font-semibold text-[14px] bg-gradient-to-r from-accent to-accent-hover text-white transition-all duration-200 active:scale-[0.97] shadow-[0_2px_16px_-4px_var(--glow-strong)]"
          >
            Enregistrer
          </button>
        }
      >
        <div className="space-y-5">
          {/* Sex */}
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.1em] mb-2">Sexe</label>
            <div className="flex gap-2">
              {(['male', 'female'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setEditProfile({ ...editProfile, sex: s })}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                    editProfile.sex === s
                      ? 'bg-accent text-white shadow-[0_2px_12px_-4px_var(--glow-strong)]'
                      : 'bg-foreground/[0.04] text-muted/60 hover:text-foreground border border-border/60'
                  }`}
                >
                  {s === 'male' ? 'Homme' : 'Femme'}
                </button>
              ))}
            </div>
          </div>

          {/* Age / Height / Weight */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'age', label: 'Âge', unit: 'ans', min: 14, max: 80 },
              { key: 'height_cm', label: 'Taille', unit: 'cm', min: 120, max: 220 },
              { key: 'weight_kg', label: 'Poids', unit: 'kg', min: 30, max: 200 },
            ] as const).map((field) => (
              <div key={field.key}>
                <label className="block text-[10px] font-semibold text-muted uppercase tracking-[0.1em] mb-1.5">{field.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={field.min}
                    max={field.max}
                    value={editProfile[field.key]}
                    onChange={(e) => setEditProfile({ ...editProfile, [field.key]: Number(e.target.value) })}
                    className="w-full bg-foreground/[0.04] border border-border/60 rounded-xl px-3 py-2.5 text-foreground text-center font-[family-name:var(--font-jetbrains-mono)] text-[14px] font-bold focus:outline-none focus:border-accent/40 transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted/30 font-medium">{field.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Activity level */}
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.1em] mb-2">Activité</label>
            <div className="space-y-1.5">
              {(Object.entries(ACTIVITY_LABELS) as [UserProfile['activity_level'], string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setEditProfile({ ...editProfile, activity_level: key })}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                    editProfile.activity_level === key
                      ? 'bg-accent/10 text-accent border border-accent/20'
                      : 'bg-foreground/[0.03] text-muted/60 border border-transparent hover:text-foreground hover:bg-foreground/[0.05]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.1em] mb-2">Objectif</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(GOAL_LABELS) as [UserProfile['goal'], string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setEditProfile({ ...editProfile, goal: key })}
                  className={`py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 ${
                    editProfile.goal === key
                      ? 'bg-accent text-white shadow-[0_2px_12px_-4px_var(--glow-strong)]'
                      : 'bg-foreground/[0.04] text-muted/60 hover:text-foreground border border-border/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Calculated preview */}
          <div className="bg-foreground/[0.03] rounded-xl p-4 border border-border/40">
            <div className="text-[10px] font-bold text-muted/40 uppercase tracking-[0.12em] mb-3">Objectifs calculés</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Cal', value: calculateMacros(editProfile).calories, color: 'text-accent' },
                { label: 'Prot', value: calculateMacros(editProfile).protein, color: 'text-blue' },
                { label: 'Gluc', value: calculateMacros(editProfile).carbs, color: 'text-yellow' },
                { label: 'Lip', value: calculateMacros(editProfile).fat, color: 'text-red' },
              ].map((m) => (
                <div key={m.label}>
                  <div className={`font-[family-name:var(--font-jetbrains-mono)] text-[15px] font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-[9px] text-muted/40 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </Modal>

      {/* ═══════ TODAY'S MEALS ═══════ */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-accent/70 text-sm">◆</span>
          <span className="text-[11px] font-bold text-accent/60 uppercase tracking-[0.12em]">Repas du jour</span>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-accent/10 to-transparent" />
          {meals.length > 0 && (
            <span className="text-[11px] font-[family-name:var(--font-jetbrains-mono)] text-muted/30 font-bold">{meals.length}</span>
          )}
        </div>
        {meals.length === 0 ? (
          <div className="text-center text-muted/40 text-[13px] py-10 bg-card rounded-2xl border border-border">
            Aucun repas enregistré
          </div>
        ) : (
          <div className="space-y-2">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-border/80 group"
              >
                {/* Input type icon */}
                <div className="w-9 h-9 rounded-xl bg-foreground/[0.04] flex items-center justify-center text-sm text-muted/40 flex-shrink-0">
                  {meal.input_type === 'photo' ? '◉' : meal.input_type === 'voice' ? '♫' : '✎'}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold truncate">{meal.name}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-accent/70 font-bold">
                      {meal.calories}<span className="text-muted/30 font-normal ml-0.5">kcal</span>
                    </span>
                    <span className="text-border">·</span>
                    <div className="flex items-center gap-1.5 font-[family-name:var(--font-jetbrains-mono)] text-[10px] text-muted/40">
                      <span><span className="text-blue/60">P</span>{meal.protein}</span>
                      <span><span className="text-yellow/60">G</span>{meal.carbs}</span>
                      <span><span className="text-red/60">L</span>{meal.fat}</span>
                    </div>
                  </div>
                  {/* Mini macro bars */}
                  <div className="flex gap-1 mt-2">
                    {[
                      { val: meal.protein, max: targets.protein, color: 'bg-blue' },
                      { val: meal.carbs, max: targets.carbs, color: 'bg-yellow' },
                      { val: meal.fat, max: targets.fat, color: 'bg-red' },
                    ].map((m, i) => (
                      <div key={i} className="flex-1 h-[2px] bg-foreground/[0.04] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${m.color} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min((m.val / m.max) * 100, 100)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Re-add */}
                  <button
                    onClick={() => quickAddMeal(meal)}
                    disabled={addingRecent === meal.id}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] transition-all duration-300 ${
                      justAdded === meal.id
                        ? 'bg-green/15 text-green'
                        : addingRecent === meal.id
                          ? 'bg-accent/10 text-accent'
                          : 'text-muted/20 hover:text-accent hover:bg-accent/8'
                    }`}
                  >
                    {justAdded === meal.id ? '✓' : addingRecent === meal.id ? (
                      <span className="w-3 h-3 border-[1.5px] border-accent/30 border-t-accent rounded-full animate-spin" />
                    ) : '+'}
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => deleteMeal(meal.id)}
                    className="text-muted/20 hover:text-red transition-all w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red/8 text-[12px]"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════ MEAL HISTORY ═══════ */}
      {Object.keys(history).length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-3 mb-4 w-full group"
          >
            <span className="text-muted/50 text-sm">◇</span>
            <span className="text-[11px] font-bold text-muted/50 uppercase tracking-[0.12em]">Historique</span>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-border/30 to-transparent" />
            <span className="text-[11px] text-muted/30 font-medium group-hover:text-muted transition-colors">
              {showHistory ? '▲' : '▼'}
            </span>
          </button>
          {showHistory && (
            <div className="space-y-5 max-h-[60vh] overflow-y-auto">
              {Object.entries(history).map(([date, dateMeals]) => {
                const d = new Date(date + 'T00:00:00');
                const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                const dayTotal = dateMeals.reduce((s, m) => s + m.calories, 0);
                return (
                  <div key={date}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-muted/60 capitalize">{label}</span>
                      <span className="font-[family-name:var(--font-jetbrains-mono)] text-[10px] text-muted/30">{dayTotal} kcal</span>
                    </div>
                    <div className="space-y-1.5">
                      {dateMeals.map((meal) => (
                        <div
                          key={meal.id}
                          className="bg-card/50 border border-border/50 rounded-xl p-3 flex items-center gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium truncate">{meal.name}</div>
                            <div className="flex items-center gap-1.5 mt-1 font-[family-name:var(--font-jetbrains-mono)] text-[10px] text-muted/40">
                              <span className="text-accent/60">{meal.calories}kcal</span>
                              <span className="text-border">·</span>
                              <span><span className="text-blue/50">P</span>{meal.protein}</span>
                              <span><span className="text-yellow/50">G</span>{meal.carbs}</span>
                              <span><span className="text-red/50">L</span>{meal.fat}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => quickAddMeal(meal)}
                            disabled={addingRecent === meal.id}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] transition-all duration-300 flex-shrink-0 ${
                              justAdded === meal.id
                                ? 'bg-green/15 text-green'
                                : addingRecent === meal.id
                                  ? 'bg-accent/10 text-accent'
                                  : 'text-muted/20 hover:text-accent hover:bg-accent/8'
                            }`}
                          >
                            {justAdded === meal.id ? '✓' : addingRecent === meal.id ? (
                              <span className="w-2.5 h-2.5 border-[1.5px] border-accent/30 border-t-accent rounded-full animate-spin" />
                            ) : '+'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
