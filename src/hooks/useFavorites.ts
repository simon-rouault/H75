'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface FavMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Favoris de repas synchronisés par compte (table Supabase `meal_favorites`).
 * Chaque utilisateur (simon/emma) a ses propres favoris, visibles sur tous ses
 * appareils. Mises à jour optimistes.
 */
export function useFavorites(userId: string) {
  const [favorites, setFavorites] = useState<FavMeal[]>([]);
  const supabase = createClient();

  const fetchFavorites = useCallback(async () => {
    const { data } = await supabase
      .from('meal_favorites')
      .select('name, calories, protein, carbs, fat')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setFavorites(data as FavMeal[]);
  }, [userId, supabase]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const isFavorite = useCallback((name: string) => favorites.some(f => f.name === name), [favorites]);

  const toggleFavorite = useCallback(async (m: FavMeal) => {
    const fav: FavMeal = { name: m.name, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat };
    if (favorites.some(f => f.name === m.name)) {
      setFavorites(prev => prev.filter(f => f.name !== m.name));
      await supabase.from('meal_favorites').delete().eq('user_id', userId).eq('name', m.name);
    } else {
      setFavorites(prev => [fav, ...prev]);
      await supabase.from('meal_favorites').insert({ user_id: userId, ...fav });
    }
  }, [favorites, userId, supabase]);

  return { favorites, isFavorite, toggleFavorite };
}
