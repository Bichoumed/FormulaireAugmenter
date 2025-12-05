/**
 * Utilitaires de sécurité pour la protection anti-spam et validation des données
 */

// Rate limiting en mémoire (en production, utiliser Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Détection de code PHP
 */
export function containsPHP(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  const phpPatterns = [
    /<\?php/i,
    /<\?=/i,
    /<\?/i,
    /\$[a-zA-Z_][a-zA-Z0-9_]*\s*=/i, // Variables PHP $var =
    /getenv\s*\(/i,
    /curl_init/i,
    /curl_exec/i,
    /curl_setopt/i,
    /file_get_contents/i,
    /fopen\s*\(/i,
    /fwrite\s*\(/i,
    /exec\s*\(/i,
    /system\s*\(/i,
    /shell_exec/i,
    /passthru/i,
    /proc_open/i,
    /popen/i,
    /->/i, // Méthodes PHP $obj->method
    /::/i, // Méthodes statiques Class::method
    /array\s*\(/i,
    /function\s+\w+\s*\(/i, // Fonctions PHP
  ];
  return phpPatterns.some(pattern => pattern.test(input));
}

/**
 * Détection de code Python
 */
export function containsPython(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  const pythonPatterns = [
    /^import\s+\w+/m,
    /^from\s+\w+\s+import/m,
    /def\s+\w+\s*\(/i,
    /class\s+\w+/i,
    /__init__/i,
    /if\s+__name__/i,
    /print\s*\(/i,
    /import\s+os/i,
    /import\s+sys/i,
    /import\s+subprocess/i,
    /\.py$/i,
  ];
  return pythonPatterns.some(pattern => pattern.test(input));
}

/**
 * Détection de code HTML/JavaScript - Version améliorée
 */
export function containsHTML(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  const htmlPatterns = [
    /<!DOCTYPE\s+html/i,
    /<!doctype\s+html/i,
    /<html[\s>]/i,
    /<\/html>/i,
    /<head[\s>]/i,
    /<\/head>/i,
    /<body[\s>]/i,
    /<\/body>/i,
    /<script[\s>]/i,
    /<\/script>/i,
    /<style[\s>]/i,
    /<\/style>/i,
    /<meta[\s>]/i,
    /<link[\s>]/i,
    /<img[\s>]/i,
    /<iframe[\s>]/i,
    /<object[\s>]/i,
    /<embed[\s>]/i,
    /<form[\s>]/i,
    /<input[\s>]/i,
    /<textarea[\s>]/i,
    /<button[\s>]/i,
    /<div[\s>]/i,
    /<span[\s>]/i,
    /<p[\s>]/i,
    /<a[\s>]/i,
    /<h[1-6][\s>]/i,
    /<ul[\s>]/i,
    /<ol[\s>]/i,
    /<li[\s>]/i,
    /<table[\s>]/i,
    /<tr[\s>]/i,
    /<td[\s>]/i,
    /<th[\s>]/i,
    /<\/?[a-z][a-z0-9]*[\s>]/i, // Toute balise HTML
    /&lt;[a-z]/i, // Encodage HTML &lt;
    /&gt;/i, // Encodage HTML &gt;
    /&#\d+;/i, // Entités HTML numériques
    /&[a-z]+;/i, // Entités HTML nommées
  ];
  return htmlPatterns.some(pattern => pattern.test(input));
}

export function containsJavaScript(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  const jsPatterns = [
    /javascript:/i,
    /<script[\s\S]*?>/i,
    /<\/script>/i,
    /on\w+\s*=\s*["'][^"']*["']/i, // Event handlers onclick="...", onload="..."
    /on\w+\s*=\s*[^>\s]+/i, // Event handlers sans quotes
    /eval\s*\(/i,
    /function\s*\(/i,
    /document\./i,
    /window\./i,
    /\.innerHTML/i,
    /\.outerHTML/i,
    /\.insertAdjacentHTML/i,
    /document\.write/i,
    /document\.writeln/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /XMLHttpRequest/i,
    /fetch\s*\(/i,
    /\.addEventListener/i,
    /\.removeEventListener/i,
    /console\./i,
    /alert\s*\(/i,
    /confirm\s*\(/i,
    /prompt\s*\(/i,
    /location\./i,
    /history\./i,
    /localStorage\./i,
    /sessionStorage\./i,
  ];
  return jsPatterns.some(pattern => pattern.test(input));
}

/**
 * Détection de code malveillant (tous types)
 */
export function containsCode(input: string): { detected: boolean; type?: string } {
  if (!input || typeof input !== "string") {
    return { detected: false };
  }

  if (containsPHP(input)) {
    return { detected: true, type: "PHP" };
  }
  if (containsPython(input)) {
    return { detected: true, type: "Python" };
  }
  if (containsHTML(input)) {
    return { detected: true, type: "HTML" };
  }
  if (containsJavaScript(input)) {
    return { detected: true, type: "JavaScript" };
  }

  // Détection de code générique
  const codePatterns = [
    /curl\s+-X/i, // Commandes curl
    /curl_init/i,
    /curl_exec/i,
    /api\.openai\.com/i, // URLs d'API
    /apiKey\s*=/i,
    /API_KEY/i,
    /getenv\s*\(/i,
    /process\.env/i,
    /require\s*\(/i,
    /import\s+.*from/i,
    /const\s+\w+\s*=/i,
    /let\s+\w+\s*=/i,
    /var\s+\w+\s*=/i,
    /function\s*\w*\s*\(/i,
    /class\s+\w+/i,
    /\/\/.*api/i, // Commentaires avec "api"
    /\/\*.*\*\//i, // Commentaires multi-lignes
  ];

  if (codePatterns.some(pattern => pattern.test(input))) {
    return { detected: true, type: "Code" };
  }

  return { detected: false };
}

/**
 * Validation stricte des inputs utilisateur
 */
export function validateUserInput(input: string): { valid: boolean; reason?: string } {
  if (!input || typeof input !== "string") {
    return { valid: false, reason: "Input invalide" };
  }
  if (input.length > 500) {
    return { valid: false, reason: "Contenu trop long (maximum 500 caractères)" };
  }

  // Détection de code (tous types)
  const codeDetection = containsCode(input);
  if (codeDetection.detected) {
    return { 
      valid: false, 
      reason: `Code ${codeDetection.type || "malveillant"} détecté et bloqué` 
    };
  }

  if (containsHTML(input)) {
    return { valid: false, reason: "Code HTML détecté et bloqué" };
  }
  if (containsJavaScript(input)) {
    return { valid: false, reason: "Code JavaScript détecté et bloqué" };
  }
  return { valid: true };
}

/**
 * Sanitization des données
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";
  
  // Rejeter tout type de code
  if (containsCode(input).detected) return "";
  if (containsHTML(input)) return "";
  if (containsPHP(input)) return "";
  if (containsPython(input)) return "";
  
  return input
    .trim()
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/\$[a-zA-Z_]/g, "") // Supprimer variables PHP
    .replace(/<\?php/gi, "")
    .replace(/<\?/g, "")
    .slice(0, 500);
}

/**
 * Rate limiting par IP
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  rateLimitStore.set(identifier, record);
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

/**
 * Extraction de l'IP client
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;
  return "unknown";
}

/**
 * Vérification HTTPS
 */
export function isHTTPS(request: Request): boolean {
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  return protocol === "https";
}

/**
 * Validation d'email
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
