"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AxolotlOrb from "./AxolotlOrb";
import AIThinking from "./AIThinking";
import SweetAlert from "./SweetAlert";

// Mission details mapping (kept for manual selection)
const MISSION_DETAILS = {
  donation: {
    label: "Offrir un Don",
    icon: "💰",
  },
  volunteer: {
    label: "Rejoindre la Guilde",
    icon: "🛡️",
  },
  contact: {
    label: "Établir le Contact",
    icon: "📞",
  },
  info: {
    label: "Demander des Infos",
    icon: "❓",
  },
};

// Type for AI response
interface IntentResult {
  mission: keyof typeof MISSION_DETAILS;
  confidence: number;
  reasoning: string;
  extracted: Record<string, string>;
}

export default function IntentRecognizer() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    show: boolean;
    type: "error" | "warning" | "info" | "success";
    title: string;
    message: string;
  }>({
    show: false,
    type: "error",
    title: "",
    message: "",
  });
  const router = useRouter();

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: input }),
      });

      // 🚫 Gestion des erreurs de sécurité (403)
      if (res.status === 403) {
        const errorData = await res.json().catch(() => ({ 
          error: "Erreur de sécurité", 
          message: "Votre requête contient du contenu non autorisé." 
        }));
        
        // Afficher une alerte jolie pour HTML/JavaScript
        if (errorData.error === "Code HTML détecté" || errorData.error === "Code JavaScript détecté") {
          setAlert({
            show: true,
            type: "warning",
            title: "Code HTML/JavaScript détecté",
            message: "Le code HTML et JavaScript ne sont pas autorisés dans ce champ.\n\nVeuillez entrer uniquement du texte normal pour décrire votre intention.\n\nExemple : \"Je veux faire un don de 50€\"",
          });
        } else if (errorData.error === "Spam détecté") {
          setAlert({
            show: true,
            type: "error",
            title: "Spam détecté",
            message: "Votre requête a été identifiée comme suspecte.\n\nVeuillez réessayer avec un message valide.",
          });
        } else if (errorData.error === "Contenu invalide") {
          setAlert({
            show: true,
            type: "warning",
            title: "Contenu invalide",
            message: errorData.message || "Votre requête contient du contenu non autorisé.\n\nVeuillez entrer uniquement du texte normal.",
          });
        } else {
          setAlert({
            show: true,
            type: "error",
            title: "Erreur de sécurité",
            message: errorData.message || "Votre requête n'a pas pu être traitée pour des raisons de sécurité.",
          });
        }
        setLoading(false);
        return;
      }

      // 🚫 Gestion du rate limiting (429)
      if (res.status === 429) {
        const errorData = await res.json().catch(() => ({ 
          error: "Trop de requêtes",
          message: "Veuillez patienter avant de réessayer."
        }));
        setAlert({
          show: true,
          type: "warning",
          title: "Trop de requêtes",
          message: "Vous avez envoyé trop de requêtes en peu de temps.\n\nVeuillez patienter quelques instants avant de réessayer.",
        });
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Erreur serveur" }));
        setAlert({
          show: true,
          type: "error",
          title: "Erreur",
          message: (errorData.error || `Erreur ${res.status}: ${res.statusText}`) + "\n\nVeuillez réessayer.",
        });
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.error) {
        setAlert({
          show: true,
          type: "error",
          title: "Erreur",
          message: data.error + "\n\nVeuillez réessayer.",
        });
        setLoading(false);
        return;
      }

      // AUTO-REDIRECT to form with extracted data
      const params = new URLSearchParams();
      params.set("mission", data.mission);
      params.set("intent", input); // Keep original intent for context

      // Add extracted fields to URL
      if (data.extracted && Object.keys(data.extracted).length > 0) {
        Object.entries(data.extracted).forEach(([key, value]) => {
          if (value && typeof value === "string" && value.trim() !== "") {
            params.set(key, value);
          }
        });
      }

      // Redirect immediately to form
      router.push(`/form?${params.toString()}`);
    } catch (error: any) {
      console.error("Error detecting intent:", error);
      setAlert({
        show: true,
        type: "error",
        title: "Erreur de connexion",
        message: "Impossible de contacter le serveur.\n\nVérifiez votre connexion internet et réessayez.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSelection = (mission: string) => {
    const params = new URLSearchParams();
    params.set("mission", mission);
    router.push(`/form?${params.toString()}`);
  };

  return (
    <div className="relative">
      <div className="absolute -top-24 left-1/2 transform -translate-x-1/2">
        <AxolotlOrb loading={loading} />
      </div>

      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-[0_0_30px_rgba(73,215,192,0.1)]">
        {/* NIRD Badge */}
        <div className="flex items-center justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#49d7c0]/10 to-[#72f0e0]/10 border border-[#49d7c0]/30 rounded-full">
            <span className="text-[#49d7c0] text-xs font-medium">🌱</span>
            <span className="text-[#49d7c0] text-xs font-medium">NIRD</span>
            <span className="text-gray-400 text-xs">Numérique Inclusif, Responsable & Durable</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2 text-[#d9e2ec]">
          Décris ton intention
        </h1>
        <p className="text-sm text-center text-gray-400 mb-1">
          L'IA préparera automatiquement ton formulaire
        </p>
        <p className="text-xs text-center text-gray-500 mb-6">
          Pour un numérique plus inclusif, responsable et durable
        </p>

        <div className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Exemple : Je veux faire un don mensuel de 50€"
            className="w-full h-32 bg-black/30 border border-white/10 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all resize-none"
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && handleAnalyze()
            }
          />

          <button
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="w-full py-3 bg-gradient-to-r from-[#49d7c0] to-[#72f0e0] text-gray-900 font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <AIThinking />
                <span className="ml-2">Préparation du formulaire...</span>
              </>
            ) : (
              "Analyser et continuer →"
            )}
          </button>
        </div>

        {/* NIRD Values Footer */}
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span>🤝</span>
              <span>Inclusif</span>
            </div>
            <div className="w-px h-3 bg-gray-600"></div>
            <div className="flex items-center gap-1">
              <span>🌍</span>
              <span>Responsable</span>
            </div>
            <div className="w-px h-3 bg-gray-600"></div>
            <div className="flex items-center gap-1">
              <span>♻️</span>
              <span>Durable</span>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="mb-4">
              <AxolotlOrb loading={true} />
            </div>
            <p className="text-white text-lg font-medium">
              Préparation du formulaire intelligent...
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Redirection automatique
            </p>
          </div>
        </div>
      )}

      {/* Sweet Alert */}
      <SweetAlert
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, show: false })}
      />
    </div>
  );
}
