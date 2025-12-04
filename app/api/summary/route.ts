import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

let groq: Groq | null = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export async function POST(request: NextRequest) {
  try {
    const { mission, formData, intent, userName } = await request.json();

    if (!mission || !formData) {
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

    // Prepare data for AI
    const currentYear = new Date().getFullYear();

    const missionTitles = {
      donation: "Offrir un Don",
      volunteer: "Rejoindre la Guilde des Bénévoles",
      contact: "Établir le Contact",
      info: "Demander des Informations",
    };

    const missionTitle =
      missionTitles[mission as keyof typeof missionTitles] || mission;

    const systemPrompt = `Tu es un esprit numérique bienveillant du "Nexus". 
    Génère un message court, chaleureux et personnalisé pour remercier un utilisateur.
    
    CONTEXTE:
    - Mission: ${missionTitle}
    - Année: ${currentYear}
    - Intentions utilisateur: "${intent || "Non spécifiée"}"
    - Nom: ${userName || "Voyageur du Nexus"}
    
    DONNÉES:
    ${JSON.stringify(formData, null, 2)}
    
    RÈGLES:
    1. Mentionne le nom si disponible
    2. Référence la mission spécifique
    3. Mentionne l'année ${currentYear}
    4. Garde le message entre 15-25 mots
    5. Ton chaleureux et reconnaissant
    6. Termine avec un appel positif
    
    Exemples:
    - "Salutations, Marie ! Ton don de 50€ mensuel en 2024 est un cadeau précieux pour notre cause."
    - "Un immense merci, Jean, pour ta volonté de rejoindre nos rangs en 2024 !"
    
    Réponds UNIQUEMENT avec le message final, sans guillemets.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Génère le message de confirmation." },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.8,
      max_tokens: 150,
    });

    const aiMessage = completion.choices[0]?.message?.content?.trim();

    if (!aiMessage) {
      return NextResponse.json(
        { error: "AI returned empty response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: aiMessage,
      mission: mission,
      year: currentYear,
      userName: userName || "Voyageur du Nexus",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Summary API error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
