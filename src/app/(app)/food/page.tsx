'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useMeals, useMealHistory } from '@/hooks/useMeals';
import { useProfile } from '@/hooks/useProfile';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useFavorites, type FavMeal } from '@/hooks/useFavorites';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Counter } from '@/components/ui/Counter';
import { today } from '@/lib/dates';
import type { Meal } from '@/types/database';

type InputMode = 'text' | 'photo' | 'voice' | 'barcode';

interface AIResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ai_raw_response?: string;
}

interface BarcodeProduct {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  image_url: string | null;
}

const HISTORY_DAYS_LIMIT = 3; // nb de jours d'historique affichés (évite un scroll infini)

/* ─── Compression image côté client (évite la limite de payload ~4.5 Mo) ─── */
async function compressImage(file: File, maxDim = 1280, quality = 0.82): Promise<string> {
  // createImageBitmap respecte l'orientation EXIF des photos de téléphone.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null);
  let width: number, height: number;
  let source: CanvasImageSource;
  if (bitmap) {
    width = bitmap.width; height = bitmap.height; source = bitmap;
  } else {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = URL.createObjectURL(file);
    });
    width = img.naturalWidth; height = img.naturalHeight; source = img;
  }
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return dataUrl.split(',')[1];
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
        <Counter value={value} className="font-[family-name:var(--font-jetbrains-mono)] text-[28px] font-bold tracking-tight leading-none" />
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
  const { targets } = useProfile(userId);
  const [showHistory, setShowHistory] = useState(false);

  const [mode, setMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const barcodeFileRef = useRef<HTMLInputElement>(null);
  const { recording, supported: voiceSupported, start: startRec, stop: stopRec } = useAudioRecorder();

  const [addingRecent, setAddingRecent] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  // Barcode state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeProduct, setBarcodeProduct] = useState<BarcodeProduct | null>(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [barcodeGrams, setBarcodeGrams] = useState('100');

  // Favoris synchronisés par compte (Supabase)
  const { favorites, isFavorite, toggleFavorite } = useFavorites(userId);

  async function addFavoriteMeal(fav: FavMeal) {
    if (addingRecent) return;
    setAddingRecent(fav.name);
    try {
      await addMeal({
        user_id: userId, date: today(), name: fav.name,
        calories: fav.calories, protein: fav.protein, carbs: fav.carbs, fat: fav.fat,
        input_type: 'text', ai_raw_response: null, manually_adjusted: false,
      } as Omit<Meal, 'id' | 'created_at'>);
      setJustAdded(fav.name);
      setTimeout(() => setJustAdded(null), 1200);
    } catch { /* ignore */ } finally {
      setAddingRecent(null);
    }
  }

  // Segmented control animation
  const modeIndex = mode === 'text' ? 0 : mode === 'photo' ? 1 : mode === 'voice' ? 2 : 3;

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

  async function analyzeFood(
    input_type: InputMode,
    text?: string,
    image_base64?: string,
    image_media_type?: string,
    audio_base64?: string,
    audio_media_type?: string,
  ) {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/food-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_type, text, image_base64, image_media_type, audio_base64, audio_media_type }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiResult(data);
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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 1280, 0.82);
      analyzeFood('photo', undefined, base64, 'image/jpeg');
    } catch {
      alert("Impossible de lire cette photo.");
    } finally {
      e.target.value = '';
    }
  }

  async function handleStopVoice() {
    const audio = await stopRec();
    if (!audio) return;
    analyzeFood('voice', undefined, undefined, undefined, audio.base64, audio.mimeType);
  }

  async function lookupBarcode(code: string) {
    if (!code.trim()) return;
    setBarcodeLoading(true);
    setBarcodeError(null);
    setBarcodeProduct(null);
    try {
      const res = await fetch(`/api/barcode?barcode=${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Produit introuvable');
      setBarcodeProduct(data as BarcodeProduct);
      setBarcodeGrams('100');
    } catch (e) {
      setBarcodeError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBarcodeLoading(false);
    }
  }

  async function handleBarcodeImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBarcodeError(null);
    setBarcodeLoading(true);
    try {
      // 1) BarcodeDetector natif (Android / Chrome)
      if ('BarcodeDetector' in window) {
        try {
          const img = await createImageBitmap(file);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
          const barcodes = await detector.detect(img);
          if (barcodes.length > 0) { await lookupBarcode(barcodes[0].rawValue); return; }
        } catch { /* fallback zxing */ }
      }
      // 2) Fallback zxing — marche sur iOS Safari (décode l'image capturée)
      const { BrowserMultiFormatReader } = await import('@zxing/library');
      const reader = new BrowserMultiFormatReader();
      const url = URL.createObjectURL(file);
      try {
        const result = await reader.decodeFromImageUrl(url);
        const code = result?.getText();
        if (code) { await lookupBarcode(code); return; }
        setBarcodeError('Aucun code-barre détecté. Entre-le manuellement.');
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch {
      setBarcodeError('Impossible de lire le code-barre. Entre-le manuellement.');
    } finally {
      setBarcodeLoading(false);
      e.target.value = '';
    }
  }

  async function saveBarcodeResult() {
    if (!barcodeProduct) return;
    const g = parseFloat(barcodeGrams);
    if (isNaN(g) || g <= 0) return;
    const factor = g / 100;
    setSaving(true);
    await addMeal({
      user_id: userId,
      date: today(),
      name: `${barcodeProduct.name} (${g}g)`,
      calories: Math.round(barcodeProduct.calories_per_100g * factor),
      protein: Math.round(barcodeProduct.protein_per_100g * factor * 10) / 10,
      carbs: Math.round(barcodeProduct.carbs_per_100g * factor * 10) / 10,
      fat: Math.round(barcodeProduct.fat_per_100g * factor * 10) / 10,
      input_type: 'text',
      ai_raw_response: null,
      manually_adjusted: false,
    } as Omit<Meal, 'id' | 'created_at'>);
    setBarcodeProduct(null);
    setBarcodeInput('');
    setBarcodeGrams('100');
    setSaving(false);
  }

  async function saveResult() {
    if (!aiResult) return;
    setSaving(true);
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
    setAiResult(null);
    setTextInput('');
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Repas" subtitle="Suivi nutritionnel" />

      {/* ═══════ HERO MACROS ═══════ */}
      <div className="relative bg-card rounded-3xl border border-border p-5 overflow-hidden">
        {/* Subtle ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-accent/[0.06] rounded-full blur-[60px] pointer-events-none" />

        {/* Settings button */}
        <Link
          href="/profile"
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-foreground/[0.04] hover:bg-foreground/[0.08] flex items-center justify-center text-muted/50 hover:text-muted transition-all duration-200"
        >
          <Icon name="settings" size={16} />
        </Link>

        {/* Calorie ring centered */}
        <div className="flex justify-center mb-5">
          <CalorieRing value={totals.calories} target={targets.calories} />
        </div>

        {/* Macro bars */}
        <div className="space-y-3">
          <MacroBar label="Protéines" value={totals.protein} target={targets.protein} color="bg-blue" icon="P" />
          <MacroBar label="Glucides" value={totals.carbs} target={targets.carbs} color="bg-yellow" icon="G" />
          <MacroBar label="Lipides" value={totals.fat} target={targets.fat} color="bg-red" icon="L" />
        </div>
      </div>

      {/* ═══════ INPUT SECTION ═══════ */}
      <div className="space-y-4">
        {/* Segmented control — 4 modes */}
        <div className="relative flex bg-foreground/[0.05] rounded-2xl p-1 gap-0.5">
          <div
            className="absolute top-1 bottom-1 rounded-xl bg-accent transition-all duration-300 ease-out shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_-4px_var(--glow-strong)]"
            style={{ left: `calc(${modeIndex * 25}% + 4px)`, width: 'calc(25% - 6px)' }}
          />
          {(['text', 'photo', 'voice', 'barcode'] as const).map((m) => {
            const cfg = { text: ['pencil', 'Texte'], photo: ['camera', 'Photo'], voice: ['mic', 'Voix'], barcode: ['barcode', 'Scan'] } as const;
            return (
              <button key={m} onClick={() => setMode(m)}
                className={`relative z-10 flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-colors duration-300 inline-flex items-center justify-center gap-1.5 ${
                  mode === m ? 'text-white' : 'text-muted/50 hover:text-muted/80'
                }`}>
                <Icon name={cfg[m][0]} size={14} stroke={2} /> {cfg[m][1]}
              </button>
            );
          })}
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
                    <Icon name="camera" size={26} className="opacity-40" />
                    <span className="text-[13px] font-medium">Prendre ou choisir une photo</span>
                  </>
                )}
              </button>
            </div>
          )}

          {mode === 'voice' && (
            <div className="flex flex-col items-center py-4 gap-4">
              {analyzing ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <span className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  <span className="text-[13px] text-muted/60 font-medium">Analyse en cours...</span>
                </div>
              ) : recording ? (
                <>
                  <button onClick={handleStopVoice} className="relative w-20 h-20 flex items-center justify-center active:scale-95 transition-transform">
                    <span className="absolute inset-0 rounded-full bg-red/20 animate-breathe" />
                    <span className="relative w-20 h-20 rounded-full bg-red/10 border border-red/25 flex items-center justify-center text-red">
                      <span className="w-6 h-6 rounded-md bg-red" />
                    </span>
                  </button>
                  <p className="text-[13px] text-muted/60 font-medium">Décris ton repas… appuie pour arrêter</p>
                </>
              ) : voiceSupported ? (
                <>
                  <button
                    onClick={startRec}
                    className="w-20 h-20 rounded-full bg-foreground/[0.04] border border-border hover:border-accent/30 flex items-center justify-center text-muted transition-all duration-300 hover:bg-accent-soft active:scale-95"
                  >
                    <Icon name="mic" size={26} />
                  </button>
                  <p className="text-[13px] text-muted/50 font-medium">Appuie et décris ton repas à voix haute</p>
                </>
              ) : (
                <p className="text-[13px] text-muted/60 text-center py-4">Le micro n&apos;est pas disponible sur cet appareil. Utilise le mode Texte.</p>
              )}
            </div>
          )}
          {mode === 'barcode' && (
            <div className="space-y-4">
              {/* Scan via camera */}
              <input ref={barcodeFileRef} type="file" accept="image/*" capture="environment" onChange={handleBarcodeImage} className="hidden" />
              <button onClick={() => barcodeFileRef.current?.click()} disabled={barcodeLoading}
                className="w-full py-7 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-accent/30 text-muted hover:text-foreground transition-all flex flex-col items-center gap-2 disabled:opacity-30">
                <Icon name="barcode" size={26} className="opacity-60" />
                <span className="text-[13px] font-medium">Scanner un code-barre</span>
              </button>

              {/* Manual entry */}
              <div className="flex gap-2">
                <input type="text" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && lookupBarcode(barcodeInput)}
                  placeholder="Code-barre (ex: 3017624010701)"
                  className="flex-1 h-11 px-3 rounded-xl bg-foreground/[0.05] border border-[var(--border)] text-[14px] outline-none focus:border-accent/30 transition-all placeholder:text-muted/25" />
                <Button size="md" onClick={() => lookupBarcode(barcodeInput)} disabled={barcodeLoading || !barcodeInput.trim()}>
                  {barcodeLoading ? '...' : 'Chercher'}
                </Button>
              </div>

              {/* Error */}
              {barcodeError && <div className="text-[13px] text-red/80 bg-red/[0.06] border border-red/15 rounded-xl px-4 py-3">{barcodeError}</div>}

              {/* Product result */}
              {barcodeProduct && (
                <div className="bg-foreground/[0.04] rounded-xl border border-[var(--border)] p-4 space-y-4 animate-spring-pop">
                  <div>
                    <div className="text-[15px] font-semibold">{barcodeProduct.name}</div>
                    <div className="text-[11px] text-muted mt-0.5">Pour 100g : {barcodeProduct.calories_per_100g} kcal · P{Math.round(barcodeProduct.protein_per_100g)}g · G{Math.round(barcodeProduct.carbs_per_100g)}g · L{Math.round(barcodeProduct.fat_per_100g)}g</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-[13px] text-muted font-medium whitespace-nowrap">Quantité (g)</div>
                    <input type="number" value={barcodeGrams} onChange={e => setBarcodeGrams(e.target.value)}
                      className="w-24 h-10 px-3 rounded-xl bg-background border border-[var(--border)] text-[14px] text-center outline-none focus:border-accent/30 transition-all" />
                  </div>
                  {parseFloat(barcodeGrams) > 0 && (
                    <div className="text-[12px] text-muted/60 font-[family-name:var(--font-jetbrains-mono)]">
                      → {Math.round(barcodeProduct.calories_per_100g * parseFloat(barcodeGrams) / 100)} kcal ·
                      P{Math.round(barcodeProduct.protein_per_100g * parseFloat(barcodeGrams) / 100)}g ·
                      G{Math.round(barcodeProduct.carbs_per_100g * parseFloat(barcodeGrams) / 100)}g ·
                      L{Math.round(barcodeProduct.fat_per_100g * parseFloat(barcodeGrams) / 100)}g
                    </div>
                  )}
                  <Button onClick={saveBarcodeResult} disabled={saving} className="w-full">
                    {saving ? 'Enregistrement...' : 'Ajouter le repas'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════ AI RESULT — FULL PAGE VIEW ═══════ */}
      {aiResult && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="min-h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
              <button
                onClick={() => setAiResult(null)}
                className="text-muted hover:text-foreground transition-colors w-9 h-9 flex items-center justify-center rounded-xl hover:bg-foreground/[0.06]"
              >
                <Icon name="arrow-left" size={18} />
              </button>
              <h2 className="text-[15px] font-bold">Résultat de l&apos;analyse</h2>
              <div className="w-9" />
            </div>

            {/* Content + Button together */}
            <div className="px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
              <div className="max-w-[420px] mx-auto space-y-5">
                {/* Meal name */}
                <div className="text-center">
                  <div className="text-xl font-bold tracking-tight">{aiResult.name}</div>
                  <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-accent to-transparent mt-3 rounded-full mx-auto" />
                </div>

                {/* Nutrition rings */}
                <div className="flex justify-around py-3">
                  <MiniRing value={aiResult.calories} label="Calories" unit="kcal" color="var(--accent)" />
                  <MiniRing value={aiResult.protein} label="Prot." unit="g" color="var(--blue)" />
                  <MiniRing value={aiResult.carbs} label="Gluc." unit="g" color="var(--yellow)" />
                  <MiniRing value={aiResult.fat} label="Lip." unit="g" color="var(--red)" />
                </div>

                {/* Detail breakdown */}
                <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
                  {[
                    { label: 'Calories', value: `${Math.round(aiResult.calories)} kcal`, color: 'text-accent' },
                    { label: 'Protéines', value: `${Math.round(aiResult.protein)} g`, color: 'text-blue' },
                    { label: 'Glucides', value: `${Math.round(aiResult.carbs)} g`, color: 'text-yellow' },
                    { label: 'Lipides', value: `${Math.round(aiResult.fat)} g`, color: 'text-red' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-1.5">
                      <span className="text-[13px] text-muted">{item.label}</span>
                      <span className={`font-[family-name:var(--font-jetbrains-mono)] text-[14px] font-bold ${item.color}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Save button — right after content */}
                <button
                  onClick={saveResult}
                  disabled={saving}
                  className="w-full py-4 rounded-2xl font-bold text-[17px] bg-gradient-to-r from-accent to-accent-hover text-white transition-all duration-200 active:scale-[0.97] shadow-[0_4px_24px_-4px_var(--glow-strong)] flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enregistrement...
                    </span>
                  ) : (
                    <>
                      <Icon name="check" size={19} stroke={2.4} /> Enregistrer le repas
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ FAVORIS ═══════ */}
      {favorites.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-accent"><Icon name="star" size={14} fill /></span>
            <span className="text-[11px] font-bold text-accent/60 uppercase tracking-[0.12em]">Favoris</span>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-accent/10 to-transparent" />
            <span className="text-[11px] font-[family-name:var(--font-jetbrains-mono)] text-muted/30 font-bold">{favorites.length}</span>
          </div>
          <div className="space-y-2">
            {favorites.map(fav => (
              <div key={fav.name} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold truncate">{fav.name}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-accent/70 font-bold">{fav.calories}<span className="text-muted/30 font-normal ml-0.5">kcal</span></span>
                    <span className="text-border">·</span>
                    <div className="flex items-center gap-1.5 font-[family-name:var(--font-jetbrains-mono)] text-[10px] text-muted/40">
                      <span><span className="text-blue/60">P</span>{fav.protein}</span>
                      <span><span className="text-yellow/60">G</span>{fav.carbs}</span>
                      <span><span className="text-red/60">L</span>{fav.fat}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleFavorite(fav)} className="w-8 h-8 flex items-center justify-center rounded-lg text-accent">
                    <Icon name="star" size={15} fill />
                  </button>
                  <button onClick={() => addFavoriteMeal(fav)} disabled={addingRecent === fav.name}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                      justAdded === fav.name ? 'bg-green/15 text-green' : addingRecent === fav.name ? 'bg-accent/10 text-accent' : 'text-muted/30 hover:text-accent hover:bg-accent/8'
                    }`}>
                    {justAdded === fav.name ? <Icon name="check" size={15} stroke={2.4} /> : addingRecent === fav.name ? <span className="w-3 h-3 border-[1.5px] border-accent/30 border-t-accent rounded-full animate-spin" /> : <Icon name="plus" size={15} stroke={2.2} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <div className="w-9 h-9 rounded-xl bg-foreground/[0.04] flex items-center justify-center text-muted/50 flex-shrink-0">
                  <Icon name={meal.input_type === 'photo' ? 'camera' : meal.input_type === 'voice' ? 'mic' : 'pencil'} size={16} />
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
                  {/* Favori */}
                  <button
                    onClick={() => toggleFavorite(meal)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                      isFavorite(meal.name) ? 'text-accent' : 'text-muted/20 hover:text-accent hover:bg-accent/8'
                    }`}
                  >
                    <Icon name="star" size={15} fill={isFavorite(meal.name)} />
                  </button>
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
                    {justAdded === meal.id ? <Icon name="check" size={15} stroke={2.4} /> : addingRecent === meal.id ? (
                      <span className="w-3 h-3 border-[1.5px] border-accent/30 border-t-accent rounded-full animate-spin" />
                    ) : <Icon name="plus" size={15} stroke={2.2} />}
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => deleteMeal(meal.id)}
                    className="text-muted/20 hover:text-red transition-all w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red/8"
                  >
                    <Icon name="x" size={15} stroke={2.2} />
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
            <span className="text-accent/70 text-sm">◆</span>
            <span className="text-[11px] font-bold text-accent/60 uppercase tracking-[0.12em]">Historique</span>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-accent/10 to-transparent" />
            <span className={`text-muted/40 group-hover:text-muted transition-all ${showHistory ? 'rotate-180' : ''}`}>
              <Icon name="chevron-down" size={15} />
            </span>
          </button>
          {showHistory && (
            <div className="space-y-5 max-h-[60vh] overflow-y-auto">
              {Object.entries(history).slice(0, HISTORY_DAYS_LIMIT).map(([date, dateMeals]) => {
                const label = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                const dayTotal = dateMeals.reduce((s, m) => s + m.calories, 0);
                return (
                  <div key={date}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-muted/60 capitalize">{label}</span>
                      <span className="font-[family-name:var(--font-jetbrains-mono)] text-[10px] text-muted/30">{dayTotal} kcal</span>
                    </div>
                    <div className="space-y-2">
                      {dateMeals.map((meal) => (
                        <div
                          key={meal.id}
                          className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-border/80 group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-foreground/[0.04] flex items-center justify-center text-sm text-muted/40 flex-shrink-0">
                            {meal.input_type === 'photo' ? '📷' : meal.input_type === 'voice' ? '🎤' : '✏️'}
                          </div>
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
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => toggleFavorite(meal)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                                isFavorite(meal.name) ? 'text-accent' : 'text-muted/20 hover:text-accent hover:bg-accent/8'
                              }`}
                            >
                              <Icon name="star" size={15} fill={isFavorite(meal.name)} />
                            </button>
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
                              {justAdded === meal.id ? <Icon name="check" size={15} stroke={2.4} /> : addingRecent === meal.id ? (
                                <span className="w-3 h-3 border-[1.5px] border-accent/30 border-t-accent rounded-full animate-spin" />
                              ) : <Icon name="plus" size={15} stroke={2.2} />}
                            </button>
                          </div>
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
