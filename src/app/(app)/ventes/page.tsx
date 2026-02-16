'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatDate } from '@/lib/dates';
import type { Sale } from '@/types/database';

const SALES_TARGET = 30000;

export default function VentesPage() {
  const { userId, isEmma } = useUser();
  const [sales, setSales] = useState<Sale[]>([]);
  const [amount, setAmount] = useState('');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(true);

  if (isEmma) redirect('/dashboard');

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/sales?user_id=${userId}`);
    const data = await res.json();
    if (Array.isArray(data)) setSales(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
  const pct = Math.round((totalSales / SALES_TARGET) * 100);

  async function addSale() {
    if (!amount || !clientName.trim()) return;
    await fetch('/api/sales', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, amount: parseFloat(amount), client_name: clientName, date: new Date().toISOString().split('T')[0] }),
    });
    setAmount(''); setClientName(''); fetchSales();
  }

  async function deleteSale(id: string) {
    await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
    fetchSales();
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4">
        <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
        <span className="text-[13px] text-muted">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ventes" subtitle="Objectif $30K" />

      <Card glow={totalSales >= SALES_TARGET}>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-[11px] text-muted font-semibold uppercase tracking-[0.1em]">Total</div>
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-3xl font-bold text-green mt-1">${totalSales.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-muted">${SALES_TARGET.toLocaleString()}</div>
          </div>
        </div>
        <ProgressBar value={totalSales} max={SALES_TARGET} color="bg-green" />
        <div className="text-[11px] text-muted text-center mt-2 font-[family-name:var(--font-jetbrains-mono)]">{pct}%</div>
      </Card>

      <Card>
        <div className="text-[11px] font-bold text-accent/60 uppercase tracking-[0.12em] mb-3">Ajouter une vente</div>
        <div className="space-y-3">
          <Input label="Montant ($)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" />
          <Input label="Client" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Corp" />
          <Button className="w-full" onClick={addSale} disabled={!amount || !clientName.trim()}>Ajouter</Button>
        </div>
      </Card>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-[11px] font-bold text-accent/60 uppercase tracking-[0.12em]">Historique</div>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-accent/15 to-transparent" />
        </div>
        {sales.length === 0 ? (
          <Card className="text-center text-muted text-[13px] py-8">Aucune vente</Card>
        ) : (
          <div className="space-y-2">
            {sales.map((sale) => (
              <Card key={sale.id} className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-semibold">{sale.client_name}</div>
                  <div className="text-[11px] text-muted mt-0.5">{formatDate(sale.date)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-[family-name:var(--font-jetbrains-mono)] text-green font-bold">${sale.amount.toLocaleString()}</span>
                  <button onClick={() => deleteSale(sale.id)} className="text-muted hover:text-red transition-all w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red/8 text-sm">✕</button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
