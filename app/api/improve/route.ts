import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

let groq: Groq | null = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const IMPROVEMENT_PROMPTS = {
  improve: (text: string, field: string, mission: string) => `
    Améliore ce texte pour un formulaire ${mission} (champ: ${field}).
    Rends-le plus professionnel, clair et impactant.
    Garde le sens original.
    Texte à améliorer: "${text}"
    Réponds uniquement avec le texte amélioré, sans commentaires.
  `,
  rephrase: (text: string, field: string, mission: string) => `
    Reformule ce texte d'une manière différente pour un formulaire ${mission} (champ: ${field}).
    Garde exactement le même sens mais utilise des mots différents.
    Ne change pas les informations factuelles.
    Texte à reformuler: "${text}"
    Réponds uniquement avec le texte reformulé.
  `,
  correct: (text: string, field: string, mission: string) => `
    Corrige les fautes d'orthographe, de grammaire et de syntaxe dans ce texte pour un formulaire ${mission} (champ: ${field}).
    Garde le style et le ton d'origine.
    Ne change pas le sens.
    Texte à corriger: "${text}"
    Réponds uniquement avec le texte corrigé.
  `,
};

export async function POST(request: NextRequest) {
  try {
    const { text, action, field, mission } = await request.json();

    if (!text || !action || !field || !mission) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    if (!groq) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const prompt =
      IMPROVEMENT_PROMPTS[action as keyof typeof IMPROVEMENT_PROMPTS];
    if (!prompt) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: prompt(text, field, mission) },
        { role: "user", content: "Améliore ce texte s'il te plaît." },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 300,
    });

    const improvedText = completion.choices[0]?.message?.content?.trim();

    if (!improvedText) {
      return NextResponse.json(
        { error: "AI returned empty response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      improvedText,
      originalText: text,
      action,
      field,
      mission,
    });
  } catch (error: any) {
    console.error("Improvement API error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
