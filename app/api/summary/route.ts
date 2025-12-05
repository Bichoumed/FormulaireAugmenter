import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import {
  checkRateLimit,
  getClientIP,
  isHTTPS,
  sanitizeInput,
  containsHTML,
  containsPHP,
  containsPython,
  containsCode,
  validateEmail,
} from "@/lib/security";

let groq: Groq | null = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export async function POST(request: NextRequest) {
  try {
    // 🔐 Vérification HTTPS en production
    if (process.env.NODE_ENV === "production" && !isHTTPS(request)) {
      return NextResponse.json(
        { error: "HTTPS requis en production" },
        { status: 403 }
      );
    }

    // 📍 Rate limiting (10 requêtes par 15 minutes)
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, 10, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez patienter." },
        { status: 429 }
      );
    }

    const { mission, formData, intent, userName } = await request.json();

    if (!mission || !formData) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    // 🚫 Détection honeypot
    if (formData.website && formData.website.trim() !== "") {
      console.warn(`🚫 Spam détecté (honeypot) - IP: ${clientIP}`);
      return NextResponse.json(
        { error: "Spam détecté" },
        { status: 403 }
      );
    }

    // 🚫 Validation de code (PHP, Python, HTML, JavaScript) dans tous les champs texte
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === "string") {
        const codeDetection = containsCode(value);
        if (codeDetection.detected) {
          console.warn(`🚫 Code ${codeDetection.type} détecté dans ${key} - IP: ${clientIP}`, {
            type: codeDetection.type,
            field: key,
            valuePreview: value.substring(0, 100),
          });
          return NextResponse.json(
            { 
              error: `Code ${codeDetection.type} détecté`, 
              message: `Le code ${codeDetection.type || "malveillant"} n'est pas autorisé dans le champ ${key}.` 
            },
            { status: 403 }
          );
        }
        
        if (containsPHP(value)) {
          console.warn(`🚫 PHP détecté dans ${key} - IP: ${clientIP}`);
          return NextResponse.json(
            { error: "Code PHP détecté", message: "Le code PHP n'est pas autorisé." },
            { status: 403 }
          );
        }
        
        if (containsPython(value)) {
          console.warn(`🚫 Python détecté dans ${key} - IP: ${clientIP}`);
          return NextResponse.json(
            { error: "Code Python détecté", message: "Le code Python n'est pas autorisé." },
            { status: 403 }
          );
        }
        
        if (containsHTML(value)) {
          console.warn(`🚫 HTML détecté dans ${key} - IP: ${clientIP}`);
          return NextResponse.json(
            { error: "Code HTML détecté", message: "Le code HTML n'est pas autorisé." },
            { status: 403 }
          );
        }
      }
    }

    // ✅ Validation email si présent
    if (formData.email && !validateEmail(formData.email)) {
      return NextResponse.json(
        { error: "Email invalide" },
        { status: 400 }
      );
    }

    // 🧹 Sanitization des données
    const sanitizedFormData: Record<string, any> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === "string") {
        sanitizedFormData[key] = sanitizeInput(value);
      } else {
        sanitizedFormData[key] = value;
      }
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

    // Extract NIRD domain for donations
    const nirdDomain = formData.nirdDomain || "";
    const nirdDomainLabels: Record<string, string> = {
      "education-numerique": "éducation numérique",
      "inclusion-digitale": "inclusion digitale",
      "ecologie-numerique": "écologie numérique",
    };
    const nirdDomainLabel = nirdDomainLabels[nirdDomain] || "";

    const systemPrompt = `Tu es un esprit numérique bienveillant du "Nexus" qui promeut le NIRD (Numérique Inclusif, Responsable et Durable).
    Génère un message court, chaleureux et personnalisé pour remercier un utilisateur.
    
    CONTEXTE:
    - Mission: ${missionTitle}
    - Année: ${currentYear}
    - Intentions utilisateur: "${intent || "Non spécifiée"}"
    - Nom: ${userName || "Voyageur du Nexus"}
    ${nirdDomainLabel ? `- Domaine NIRD: ${nirdDomainLabel}` : ""}
    
    DONNÉES:
    ${JSON.stringify(sanitizedFormData, null, 2)}
    
    RÈGLES:
    1. Mentionne le nom si disponible
    2. Référence la mission spécifique
    3. Mentionne l'année ${currentYear}
    4. Intègre le thème NIRD (Numérique Inclusif, Responsable et Durable) dans le message
    5. Si un domaine NIRD est spécifié (éducation numérique, inclusion digitale, écologie numérique), mentionne-le
    6. Garde le message entre 20-30 mots
    7. Ton chaleureux, reconnaissant et orienté vers un numérique inclusif, responsable et durable
    8. Termine avec un appel positif pour rester connecté tout au long de l'année ${currentYear}
    9. Utilise des emojis appropriés (🏆, 🌱, etc.)
    
    FORMAT ATTENDU:
    "Un immense merci, [Nom] ! 🏆 Ton action en [Année] renforce un numérique inclusif, responsable et durable 🌱. Reste connecté pour suivre nos projets tout au long de l'année [Année] !"
    
    Exemples:
    - "Un immense merci, Marie ! 🏆 Ton don en ${currentYear} renforce l'éducation numérique inclusive 🌱. Reste connectée pour suivre nos projets tout au long de l'année ${currentYear} !"
    - "Un immense merci, Jean ! 🏆 Ton engagement en ${currentYear} renforce un numérique inclusif, responsable et durable 🌱. Reste connecté pour suivre nos projets tout au long de l'année ${currentYear} !"
    
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
