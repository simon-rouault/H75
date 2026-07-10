import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const MESSAGES = [
  'As-tu validé ta journée ? Coche tes objectifs avant minuit.',
  'Ton streak compte sur toi — complète tes objectifs du jour.',
  'Encore quelques objectifs pour une journée parfaite.',
  'Eau, pas, sport, lecture… où en es-tu aujourd’hui ?',
  'N’oublie pas de valider ta journée H75.',
  'Un dernier effort : boucle tes objectifs avant ce soir.',
];
const pick = () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

interface Sub {
  endpoint: string;
  subscription: webpush.PushSubscription;
  reminder_time: string | null;
  timezone: string | null;
  last_sent: string | null;
}

export async function GET(request: NextRequest) {
  // Auth : Vercel Cron envoie `Authorization: Bearer <CRON_SECRET>` ; on accepte aussi ?secret=
  const secret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  if (
    secret &&
    request.headers.get('authorization') !== `Bearer ${secret}` &&
    url.searchParams.get('secret') !== secret
  ) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return NextResponse.json({ error: 'VAPID non configuré' }, { status: 500 });
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:contact@h75.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const supabase = db();
  const { data: subs } = await supabase.from('push_subscriptions').select('*');
  const now = new Date();
  let sent = 0;

  for (const sub of (subs ?? []) as Sub[]) {
    const tz = sub.timezone || 'Europe/Paris';
    const hhmm = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(now);
    const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now); // YYYY-MM-DD
    const nowMin = toMin(hhmm);
    const remMin = toMin(sub.reminder_time || '20:00');

    // On envoie au premier passage du cron après l'heure de rappel (fenêtre de 60 min),
    // une seule fois par jour grâce à last_sent.
    const due = nowMin >= remMin && nowMin < remMin + 60;
    if (!due || sub.last_sent === dateStr) continue;

    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify({ title: 'H75', body: pick() }));
      await supabase.from('push_subscriptions').update({ last_sent: dateStr }).eq('endpoint', sub.endpoint);
      sent++;
    } catch (e: unknown) {
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }

  return NextResponse.json({ ok: true, checked: subs?.length ?? 0, sent });
}
