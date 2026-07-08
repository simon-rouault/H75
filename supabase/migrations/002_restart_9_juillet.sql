-- ═══════════════════════════════════════════════════════════
-- 75 Jours — Redémarrage du challenge au 9 juillet 2026
-- À exécuter dans Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1) Base vierge : on efface tout ce qui précède le nouveau départ.
delete from daily_logs  where date < '2026-07-09';
delete from meals       where date < '2026-07-09';
delete from weight_logs where date < '2026-07-09';

-- 2) Fonctionnalités retirées → tables vidées.
delete from justifications;   -- page « Valider » supprimée
delete from streaks;          -- streaks désormais recalculés à la volée depuis daily_logs

-- 3) (Optionnel) Colonnes que l'app n'utilise plus. Décommente si tu veux nettoyer le schéma.
-- alter table daily_logs drop column if exists alcohol;
-- alter table daily_logs drop column if exists study_minutes;
-- alter table daily_logs drop column if exists study_mode;
