import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';

interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_fr?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
  image_front_small_url?: string;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

export async function GET(request: NextRequest) {
  const authResult = await getAuthUser(request);
  if (authResult instanceof NextResponse) return authResult;

  const barcode = request.nextUrl.searchParams.get('barcode');
  if (!barcode || !/^\d{6,14}$/.test(barcode)) {
    return NextResponse.json({ error: 'Code-barre invalide' }, { status: 400 });
  }

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}?fields=product_name,product_name_fr,nutriments,image_front_small_url`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'H75/1.0 (contact@h75.app)' },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
  }

  const data = await res.json() as OpenFoodFactsResponse;

  if (data.status !== 1 || !data.product) {
    return NextResponse.json({ error: 'Produit non trouvé dans la base Open Food Facts' }, { status: 404 });
  }

  const p = data.product;
  const n = p.nutriments ?? {};

  return NextResponse.json({
    name: p.product_name_fr ?? p.product_name ?? 'Produit inconnu',
    calories_per_100g: n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0,
    protein_per_100g: n['proteins_100g'] ?? 0,
    carbs_per_100g: n['carbohydrates_100g'] ?? 0,
    fat_per_100g: n['fat_100g'] ?? 0,
    image_url: p.image_front_small_url ?? null,
  });
}
