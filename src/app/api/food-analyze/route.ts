import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAuthUser, rateLimit } from '@/lib/api-auth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `Tu es un nutritionniste expert. Analyse l'aliment ou le repas décrit et estime les macronutriments.

Réponds UNIQUEMENT en JSON valide avec ce format exact:
{
  "name": "Nom du plat/aliment",
  "calories": nombre,
  "protein": nombre en grammes,
  "carbs": nombre en grammes,
  "fat": nombre en grammes
}

Sois précis et réaliste dans tes estimations. Si c'est une photo, décris ce que tu vois et estime les portions. Si l'input est vague, fais une estimation raisonnable basée sur une portion standard.`;

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const auth = getAuthUser(request);
    if (auth instanceof NextResponse) return auth;

    // Rate limit: 50 analyses per day per user
    const limited = rateLimit(auth, 50);
    if (limited) return limited;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Clé API Gemini manquante.' }, { status: 500 });
    }

    const body = await request.json();
    const { input_type, text, image_base64, image_media_type } = body;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let result;

    if (input_type === 'photo' && image_base64) {
      result = await model.generateContent([
        SYSTEM_PROMPT,
        {
          inlineData: {
            mimeType: image_media_type || 'image/jpeg',
            data: image_base64,
          },
        },
        'Analyse cette photo de nourriture et estime les macronutriments.',
      ]);
    } else if (text) {
      result = await model.generateContent([
        SYSTEM_PROMPT,
        `Analyse cet aliment/repas et estime les macronutriments: ${text}`,
      ]);
    } else {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    const rawText = result.response.text();

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
    }

    const macros = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      ...macros,
      ai_raw_response: rawText,
    });
  } catch (error: unknown) {
    console.error('Food analyze error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Erreur analyse: ${message}` }, { status: 500 });
  }
}
