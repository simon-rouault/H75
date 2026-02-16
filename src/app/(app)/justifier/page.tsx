'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/hooks/useUser';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { today, formatDate } from '@/lib/dates';
import { createClient } from '@/lib/supabase/client';
import type { Justification } from '@/types/database';

const CATEGORIES = [
  { id: 'workout', label: 'Pas de workout', icon: '💪' },
  { id: 'water', label: "Pas assez d'eau", icon: '💧' },
  { id: 'steps', label: 'Pas assez de pas', icon: '👟' },
  { id: 'stretching', label: 'Pas de stretching', icon: '🧘' },
  { id: 'reinforcement', label: 'Pas de renforcement', icon: '🏋️' },
  { id: 'reading', label: 'Pas de lecture', icon: '📖' },
  { id: 'study', label: 'Pas de revision', icon: '📚' },
  { id: 'alcohol', label: 'Alcool consomme', icon: '🍺' },
];

type Tab = 'submit' | 'review';

export default function JustifierPage() {
  const { userId, userName } = useUser();
  const otherUserId = userId === 'simon' ? 'emma' : 'simon';
  const otherUserName = userId === 'simon' ? 'Emma' : 'Simon';

  const [tab, setTab] = useState<Tab>('submit');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myJustifications, setMyJustifications] = useState<Justification[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Justification[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchMyJustifications = useCallback(async () => {
    const { data } = await supabase.from('justifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setMyJustifications(data as Justification[]);
  }, [userId, supabase]);

  const fetchPendingReviews = useCallback(async () => {
    const { data } = await supabase.from('justifications').select('*').eq('user_id', otherUserId).eq('verdict', 'pending').order('created_at', { ascending: false });
    if (data) setPendingReviews(data as Justification[]);
  }, [otherUserId, supabase]);

  useEffect(() => { fetchMyJustifications(); fetchPendingReviews(); }, [fetchMyJustifications, fetchPendingReviews]);

  async function handleSubmit() {
    if (!reason.trim() || !selectedCategory) return;
    setSubmitting(true);
    const categoryLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label || selectedCategory;
    await supabase.from('justifications').insert({
      user_id: userId, date: today(), category: selectedCategory, reason: reason.trim(),
      verdict: 'pending', ai_explanation: `[${categoryLabel}] En attente de validation par ${otherUserName}`,
    });
    setReason(''); setSelectedCategory(''); setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    fetchMyJustifications(); setSubmitting(false);
  }

  async function handleReview(justificationId: string, verdict: 'accepted' | 'rejected') {
    setReviewingId(justificationId);
    await supabase.from('justifications').update({
      verdict, reviewed_by: userId,
      ai_explanation: verdict === 'accepted' ? `Accepte par ${userName}` : `Rejete par ${userName}`,
    }).eq('id', justificationId);

    if (verdict === 'rejected') {
      const justification = pendingReviews.find(j => j.id === justificationId);
      const dateStr = justification?.date || today();
      await supabase.from('streaks').update({ active: false, end_date: dateStr }).eq('user_id', otherUserId).eq('active', true);
      await supabase.from('streaks').insert({ user_id: otherUserId, start_date: dateStr, length: 0, active: true });
    }
    setReviewingId(null); fetchPendingReviews();
  }

  async function deleteJustification(id: string) {
    await supabase.from('justifications').delete().eq('id', id);
    fetchMyJustifications(); fetchPendingReviews();
  }

  function getCategoryInfo(categoryId: string | null) {
    if (!categoryId) return null;
    return CATEGORIES.find(c => c.id === categoryId);
  }

  function getVerdictBadge(verdict: string) {
    switch (verdict) {
      case 'accepted': return <Badge variant="success">Accepte</Badge>;
      case 'rejected': return <Badge variant="danger">Rejete</Badge>;
      default: return <Badge variant="warning">En attente</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Justifier"
        subtitle={tab === 'submit' ? 'Justifie un objectif manque' : `Valide les justifications de ${otherUserName}`}
      />

      {/* Tab switcher */}
      <div className="flex bg-card rounded-2xl border border-border p-1.5 gap-1">
        <button onClick={() => setTab('submit')}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 ${tab === 'submit' ? 'bg-accent text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_16px_-4px_var(--glow-strong)]' : 'text-muted/60 hover:text-foreground'}`}
        >Soumettre</button>
        <button onClick={() => setTab('review')}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 relative ${tab === 'review' ? 'bg-accent text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_16px_-4px_var(--glow-strong)]' : 'text-muted/60 hover:text-foreground'}`}
        >
          A valider
          {pendingReviews.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-[0_0_8px_-1px_var(--red)]">
              {pendingReviews.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'submit' && (
        <>
          {submitted && (
            <Card className="border-accent/20 animate-scale-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/8 flex items-center justify-center text-lg">📩</div>
                <p className="text-[13px]">Justification envoyee ! {otherUserName} doit maintenant la valider.</p>
              </div>
            </Card>
          )}

          <Card>
            <label className="block text-[11px] font-bold text-accent/60 uppercase tracking-[0.12em] mb-3">Quel objectif ?</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-accent/8 text-accent border border-accent/30'
                      : 'bg-foreground/[0.03] border border-border/60 hover:border-muted/30'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="text-[12px] font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </Card>

          {selectedCategory && (
            <Card className="animate-slide-up">
              <label className="block text-[11px] font-bold text-accent/60 uppercase tracking-[0.12em] mb-2">Pourquoi ?</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explique ta situation..."
                rows={3} className="w-full bg-foreground/[0.04] border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 focus:bg-accent-soft transition-all resize-none" />
              <div className="flex justify-end mt-3">
                <Button onClick={handleSubmit} disabled={submitting || !reason.trim()}>
                  {submitting ? 'Envoi...' : `Envoyer a ${otherUserName}`}
                </Button>
              </div>
            </Card>
          )}

          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-[11px] font-bold text-accent/60 uppercase tracking-[0.12em]">Mes justifications</div>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-accent/15 to-transparent" />
            </div>
            {myJustifications.length === 0 ? (
              <Card className="text-center text-muted text-[13px] py-8">Aucune justification</Card>
            ) : (
              <div className="space-y-2">
                {myJustifications.map((j) => {
                  const cat = getCategoryInfo(j.category);
                  return (
                    <Card key={j.id}>
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {cat && <span>{cat.icon}</span>}
                          <span className="text-[11px] text-muted">{formatDate(j.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getVerdictBadge(j.verdict)}
                          <button onClick={() => deleteJustification(j.id)} className="text-muted hover:text-red transition-all w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red/8 text-sm">✕</button>
                        </div>
                      </div>
                      <p className="text-[13px]">{j.reason}</p>
                      {j.verdict !== 'pending' && j.ai_explanation && <p className="text-[11px] text-muted mt-1">{j.ai_explanation}</p>}
                      {j.verdict === 'rejected' && <p className="text-[11px] text-red mt-1 font-medium">Ton streak a ete reinitialise.</p>}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'review' && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-[11px] font-bold text-accent/60 uppercase tracking-[0.12em]">Justifications de {otherUserName}</div>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-accent/15 to-transparent" />
          </div>
          {pendingReviews.length === 0 ? (
            <Card className="text-center text-muted text-[13px] py-12">
              <div className="text-4xl mb-3 opacity-60">✨</div>
              Aucune justification en attente
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((j) => {
                const cat = getCategoryInfo(j.category);
                const isReviewing = reviewingId === j.id;
                return (
                  <Card key={j.id} className="border-yellow/15">
                    <div className="flex items-center gap-3 mb-3">
                      {cat && (
                        <div className="w-9 h-9 rounded-xl bg-yellow/8 flex items-center justify-center">
                          <span className="text-lg">{cat.icon}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[14px] font-semibold">{cat?.label || 'Justification'}</span>
                        <div className="text-[11px] text-muted">{formatDate(j.date)}</div>
                      </div>
                    </div>
                    <div className="bg-foreground/[0.03] rounded-xl p-4 mb-3 border border-border/60">
                      <p className="text-[13px] italic text-muted">&ldquo;{j.reason}&rdquo;</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleReview(j.id, 'accepted')} disabled={isReviewing}
                        className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-green/8 text-green border border-green/15 hover:bg-green/15 transition-all disabled:opacity-30">
                        {isReviewing ? '...' : 'Accepter'}
                      </button>
                      <button onClick={() => handleReview(j.id, 'rejected')} disabled={isReviewing}
                        className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-red/8 text-red border border-red/15 hover:bg-red/15 transition-all disabled:opacity-30">
                        {isReviewing ? '...' : 'Rejeter'}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted/60 mt-2 text-center">Rejeter = reset du streak de {otherUserName}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
