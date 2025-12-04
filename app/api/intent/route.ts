import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

let groq: Groq | null = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const SYSTEM_PROMPT = `Tu es un assistant qui analyse l'intention d'un utilisateur pour une association.
Ta mission: Détecter la catégorie et extraire les informations pertinentes.

--- RÈGLES DE DÉTECTION ---
1. "donation": si le texte contient DON, ARGENT, EURO, €, SOUTENIR, FINANCIER, CONTRIBUTION
2. "volunteer": si le texte contient BÉNÉVOLE, VOLONTAIRE, AIDER, IMPLIQUER, REJOINDRE, PARTICIPER, AIDE
3. "contact": si le texte contient CONTACTER, PARLER, SIGNALER, PROBLÈME, DIRE, ADRESSER, ÉCRIRE
4. "info": si le texte contient INFORMATION, QUESTION, SAVOIR, DEMANDER, RENSEIGNEMENT, PLUS D'INFOS

--- RÈGLES D'EXTRACTION ---
EXTRACTION OBLIGATOIRE:
- "name": si "je m'appelle", "mon nom est", "nom:", "prénom:" 
- "email": si "@" est présent ou "email", "courriel"
- "amount": tout nombre suivi de €, $, euros, dollars, ou "k" (ex: "50k" → "50000")
- "frequency": "mensuel" → "monthly", "chaque mois" → "monthly", "annuel" → "yearly", "unique" → "once"
- "skills": compétences mentionnées (développeur, graphiste, etc.)
- "availability": disponibilités mentionnées
- "message": texte après "pour", "concernant", "au sujet de"
- "topic": sujet après "sur", "à propos de", "concernant"

IMPORTANT: "J'ai un problème technique à signaler" → C'est CONTACT, pas INFO car "signaler" = contact.

Réponds UNIQUEMENT en JSON valide:
{
  "mission": "donation" | "volunteer" | "contact" | "info",
  "confidence": 0.95,
  "reasoning": "Court explication en français",
  "extracted": {
    "name": "string" | null,
    "email": "string" | null,
    "amount": "string" | null,
    "frequency": "string" | null,
    "skills": "string" | null,
    "availability": "string" | null,
    "message": "string" | null,
    "topic": "string" | null
  }
}`;

export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json();

    if (!userInput || typeof userInput !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (!groq) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    console.log("Processing user input:", userInput);

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userInput },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      console.error("AI returned empty content");
      return NextResponse.json(
        { error: "AI returned empty response" },
        { status: 500 }
      );
    }

    console.log("Raw AI response:", content);

    let aiResult;
    try {
      // Clean the response
      const cleanedContent = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      aiResult = JSON.parse(cleanedContent);
      console.log("Successfully parsed AI result:", aiResult);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Failed content:", content);

      // Fallback: Manual detection
      return manualDetection(userInput);
    }

    // Post-process the AI response
    return NextResponse.json(postProcessAIResult(aiResult, userInput));
  } catch (error: any) {
    console.error("API error:", error);
    return manualDetection(error.message || "Unknown error");
  }
}

// Manual fallback detection
function manualDetection(userInput: string) {
  const input = userInput.toLowerCase();

  let mission = "contact";
  let reasoning = "Message de contact général";
  const extracted: any = {};

  // Extract email
  const emailMatch = input.match(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  );
  if (emailMatch) {
    extracted.email = emailMatch[0];
  }

  // Extract name
  if (input.includes("je m'appelle")) {
    const nameMatch = input.match(/je m'appelle\s+([^\s,.]+(?:\s+[^\s,.]+)*)/i);
    if (nameMatch) extracted.name = nameMatch[1];
  } else if (input.includes("mon nom est")) {
    const nameMatch = input.match(/mon nom est\s+([^\s,.]+(?:\s+[^\s,.]+)*)/i);
    if (nameMatch) extracted.name = nameMatch[1];
  }

  // Extract amount with "k"
  const amountMatch = input.match(/(\d+(?:[.,]\d+)?)\s*(?:k|K)/);
  if (amountMatch) {
    const num = parseFloat(amountMatch[1].replace(",", "."));
    extracted.amount = (num * 1000).toString();
    mission = "donation";
    reasoning = "Don avec montant en milliers";
  }
  // Regular amount
  else if (input.match(/\d+\s*(?:€|\$|euros?|dollars?)/)) {
    const match = input.match(/(\d+(?:[.,]\d+)?)\s*(?:€|\$|euros?|dollars?)/);
    if (match) {
      extracted.amount = match[1].replace(",", ".");
      mission = "donation";
      reasoning = "Don avec montant spécifié";
    }
  }

  // Extract frequency
  if (
    input.includes("mensuel") ||
    input.includes("chaque mois") ||
    input.includes("mensuelle")
  ) {
    extracted.frequency = "monthly";
    mission = "donation";
  } else if (input.includes("annuel") || input.includes("chaque an")) {
    extracted.frequency = "yearly";
    mission = "donation";
  } else if (input.includes("unique") || input.includes("une fois")) {
    extracted.frequency = "once";
    mission = "donation";
  }

  // Mission detection (simple keywords)
  if (
    input.includes("don") ||
    input.includes("argent") ||
    input.includes("soutenir") ||
    extracted.amount
  ) {
    mission = "donation";
    reasoning = "Intention de don détectée";
  } else if (
    input.includes("bénévole") ||
    input.includes("volontaire") ||
    input.includes("aider") ||
    input.includes("rejoindre")
  ) {
    mission = "volunteer";
    reasoning = "Intention de bénévolat détectée";

    // Extract skills/availability
    if (
      input.includes("compétence") ||
      input.includes("expérience") ||
      input.includes("développeur") ||
      input.includes("graphiste")
    ) {
      extracted.skills = "Compétences mentionnées";
    }
    if (
      input.includes("disponible") ||
      input.includes("weekend") ||
      input.includes("soirée") ||
      input.includes("jour")
    ) {
      extracted.availability = "Disponibilités mentionnées";
    }
  } else if (
    input.includes("signaler") ||
    input.includes("problème") ||
    input.includes("contacter") ||
    input.includes("parler")
  ) {
    mission = "contact";
    reasoning = "Demande de contact détectée";

    if (
      input.includes("technique") ||
      input.includes("bug") ||
      input.includes("erreur")
    ) {
      extracted.message = "Problème technique";
    }
  } else if (
    input.includes("information") ||
    input.includes("question") ||
    input.includes("savoir") ||
    input.includes("renseignement")
  ) {
    mission = "info";
    reasoning = "Demande d'information détectée";

    if (
      input.includes("événement") ||
      input.includes("projet") ||
      input.includes("activité")
    ) {
      extracted.topic =
        input.match(/(?:sur|à propos de|concernant)\s+([^.,!?]+)/i)?.[1] ||
        "Sujet mentionné";
    }
  }

  // Clean extracted object
  Object.keys(extracted).forEach((key) => {
    if (!extracted[key]) delete extracted[key];
  });

  return NextResponse.json({
    mission,
    confidence: 0.8,
    reasoning,
    extracted,
    source: "fallback",
  });
}

// Post-process AI result
function postProcessAIResult(aiResult: any, userInput: string) {
  // Ensure mission is valid
  const validMissions = ["donation", "volunteer", "contact", "info"];
  if (!aiResult.mission || !validMissions.includes(aiResult.mission)) {
    aiResult.mission = "contact";
  }

  // Ensure extracted object exists
  aiResult.extracted = aiResult.extracted || {};

  // Post-process amount with "k"
  if (aiResult.extracted.amount) {
    let amount = aiResult.extracted.amount.toString();

    // Handle "k" suffix
    if (amount.toLowerCase().includes("k") && !amount.includes("000")) {
      const numMatch = amount.match(/(\d+(?:[.,]\d+)?)/);
      if (numMatch) {
        const num = parseFloat(numMatch[1].replace(",", "."));
        aiResult.extracted.amount = (num * 1000).toString();
      }
    }

    // Clean amount (remove €, $, etc.)
    aiResult.extracted.amount = aiResult.extracted.amount
      .toString()
      .replace(/[€\$\s]/g, "")
      .replace(",", ".");
  }

  // Post-process frequency
  if (aiResult.extracted.frequency) {
    const freq = aiResult.extracted.frequency.toLowerCase();
    if (freq.includes("mensuel") || freq.includes("mois")) {
      aiResult.extracted.frequency = "monthly";
    } else if (freq.includes("annuel") || freq.includes("an")) {
      aiResult.extracted.frequency = "yearly";
    } else if (freq.includes("unique") || freq.includes("une fois")) {
      aiResult.extracted.frequency = "once";
    }
  }

  // Extract email from input if AI missed it
  if (!aiResult.extracted.email) {
    const emailMatch = userInput.match(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
    );
    if (emailMatch) {
      aiResult.extracted.email = emailMatch[0];
    }
  }

  // Clean null/empty values
  Object.keys(aiResult.extracted).forEach((key) => {
    if (
      aiResult.extracted[key] === null ||
      aiResult.extracted[key] === undefined ||
      aiResult.extracted[key] === "" ||
      aiResult.extracted[key] === "null"
    ) {
      delete aiResult.extracted[key];
    }
  });

  // Ensure confidence is valid
  aiResult.confidence = Math.min(
    1,
    Math.max(0.1, Number(aiResult.confidence) || 0.8)
  );

  return {
    mission: aiResult.mission,
    confidence: aiResult.confidence,
    reasoning: aiResult.reasoning || "Intention détectée",
    extracted: aiResult.extracted,
    source: "ai",
  };
}
