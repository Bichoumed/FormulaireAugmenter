import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import {
  checkRateLimit,
  getClientIP,
  isHTTPS,
  validateUserInput,
  containsHTML,
  containsJavaScript,
  containsPHP,
  containsPython,
  containsCode,
  sanitizeInput,
} from "@/lib/security";

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
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { userInput, ...otherFields } = body;

    // 🔍 Debug: Log tous les champs reçus
    console.log("📥 Requête reçue - Champs:", {
      userInput: userInput?.substring(0, 50),
      otherFields: Object.keys(otherFields),
      otherFieldsValues: otherFields,
      clientIP,
    });

    // 🚫 Détection honeypot (champs anti-spam) - Liste complète
    const honeypotFields = [
      "honeypot_field",
      "website",
      "url",
      "homepage",
      "website_url",
      "url_field",
      "bot_check",
      "spam_check",
      "verification",
      "confirm_email",
      "email_confirm",
      "phone_confirm",
      "human_check",
      "captcha",
      "recaptcha",
      "hcaptcha",
    ];

    // 🚫 Détection de champs suspects supplémentaires
    const suspiciousFieldPatterns = [
      /^autre_/i, // "autre_champ", "autre_field", etc.
      /_field$/i, // Tout champ se terminant par "_field"
      /_check$/i, // Tout champ se terminant par "_check"
      /^spam_/i, // "spam_*"
      /^bot_/i, // "bot_*"
    ];

    // Vérifier les champs honeypot connus
    for (const field of honeypotFields) {
      if (otherFields[field] && otherFields[field].toString().trim() !== "") {
        console.warn(`🚫 Spam détecté (honeypot: ${field}) - IP: ${clientIP}`, {
          field,
          value: otherFields[field],
          userInput: userInput?.substring(0, 50),
          allFields: Object.keys(otherFields),
        });
        return NextResponse.json(
          { 
            error: "Spam détecté", 
            message: "Tentative de spam détectée et bloquée. Les champs de sécurité ont été remplis." 
          },
          { status: 403 }
        );
      }
    }

    // Vérifier les champs suspects avec patterns
    for (const fieldName of Object.keys(otherFields)) {
      // Si le champ correspond à un pattern suspect ET a une valeur
      if (suspiciousFieldPatterns.some(pattern => pattern.test(fieldName))) {
        const fieldValue = otherFields[fieldName];
        if (fieldValue && fieldValue.toString().trim() !== "") {
          console.warn(`🚫 Spam détecté (champ suspect: ${fieldName}) - IP: ${clientIP}`, {
            field: fieldName,
            value: fieldValue,
            userInput: userInput?.substring(0, 50),
            allFields: Object.keys(otherFields),
          });
          return NextResponse.json(
            { 
              error: "Spam détecté", 
              message: "Tentative de spam détectée et bloquée. Des champs suspects ont été détectés." 
            },
            { status: 403 }
          );
        }
      }
    }

    // 🚫 Détection si champs supplémentaires présents (normalement seul userInput devrait être présent)
    const extraFieldsCount = Object.keys(otherFields).length;
    if (extraFieldsCount > 0) {
      // Si des champs supplémentaires sont présents, c'est suspect
      // Vérifier d'abord si ce sont des champs suspects
      const hasSuspiciousFields = Object.keys(otherFields).some(fieldName => {
        // Vérifier si c'est un champ honeypot connu
        if (honeypotFields.includes(fieldName)) return true;
        // Vérifier si ça correspond à un pattern suspect
        if (suspiciousFieldPatterns.some(pattern => pattern.test(fieldName))) return true;
        return false;
      });

      if (hasSuspiciousFields) {
        // Déjà géré par les boucles précédentes, mais on log pour debug
        console.log("🔍 Champs suspects détectés mais déjà bloqués");
      } else {
        // Champs supplémentaires non suspects mais présents quand même
        console.warn(`🚫 Champs supplémentaires détectés (${extraFieldsCount}) - IP: ${clientIP}`, {
          fields: Object.keys(otherFields),
          fieldsValues: otherFields,
          userInput: userInput?.substring(0, 50),
        });
        return NextResponse.json(
          { 
            error: "Spam détecté", 
            message: "Tentative de spam détectée. Des champs supplémentaires non autorisés ont été envoyés." 
          },
          { status: 403 }
        );
      }
    }

    if (!userInput || typeof userInput !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // 🚫 Détection de code (tous types : PHP, Python, HTML, JavaScript, etc.)
    const codeDetection = containsCode(userInput);
    if (codeDetection.detected) {
      console.warn(`🚫 Code ${codeDetection.type} détecté - IP: ${clientIP}`, {
        type: codeDetection.type,
        inputPreview: userInput.substring(0, 100),
      });
      return NextResponse.json(
        { 
          error: `Code ${codeDetection.type} détecté`, 
          message: `Le code ${codeDetection.type || "malveillant"} n'est pas autorisé dans ce champ.` 
        },
        { status: 403 }
      );
    }

    // 🚫 Validation HTML/JavaScript (double vérification)
    const validation = validateUserInput(userInput);
    if (!validation.valid) {
      console.warn(`🚫 ${validation.reason} - IP: ${clientIP}`);
      return NextResponse.json(
        { error: "Contenu invalide", message: validation.reason },
        { status: 403 }
      );
    }

    if (containsPHP(userInput)) {
      return NextResponse.json(
        { error: "Code PHP détecté", message: "Le code PHP n'est pas autorisé." },
        { status: 403 }
      );
    }

    if (containsPython(userInput)) {
      return NextResponse.json(
        { error: "Code Python détecté", message: "Le code Python n'est pas autorisé." },
        { status: 403 }
      );
    }

    if (containsHTML(userInput)) {
      return NextResponse.json(
        { error: "Code HTML détecté", message: "Le code HTML n'est pas autorisé." },
        { status: 403 }
      );
    }

    if (containsJavaScript(userInput)) {
      return NextResponse.json(
        { error: "Code JavaScript détecté", message: "Le code JavaScript n'est pas autorisé." },
        { status: 403 }
      );
    }

    // 🧹 Sanitization
    const sanitizedInput = sanitizeInput(userInput);
    if (!sanitizedInput || sanitizedInput.trim() === "") {
      return NextResponse.json(
        { error: "Contenu invalide", message: "Votre requête contient du contenu non autorisé." },
        { status: 403 }
      );
    }

    if (!groq) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    console.log("Processing user input:", sanitizedInput);

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: sanitizedInput },
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
    return NextResponse.json(postProcessAIResult(aiResult, sanitizedInput));
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
