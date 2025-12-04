"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function SimpleIAButton({
  fieldName,
  currentValue,
  onImprove,
  mission,
}: {
  fieldName: string;
  currentValue: string;
  onImprove: (newValue: string) => void;
  mission: string;
}) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const hasText = currentValue.trim().length > 0;

  const handleImprove = async (action: "improve" | "rephrase" | "correct") => {
    if (!hasText) return;

    setLoading(true);
    setShowMenu(false);

    try {
      const res = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: currentValue,
          action,
          field: fieldName,
          mission,
        }),
      });

      if (!res.ok) throw new Error("Improvement failed");

      const data = await res.json();
      if (data.improvedText) {
        onImprove(data.improvedText);
      }
    } catch (error) {
      console.error("Text improvement error:", error);
      alert("Erreur lors de l'amélioration. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (!hasText) return;
    setShowMenu(!showMenu);
  };

  return (
    <div className="relative inline-block ml-2">
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={loading || !hasText}
        className={`
          inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all
          ${
            loading
              ? "bg-gray-800 text-gray-400 cursor-not-allowed"
              : !hasText
              ? "bg-gray-800/30 text-gray-500 cursor-not-allowed"
              : "bg-[#49d7c0]/10 text-[#49d7c0] hover:bg-[#49d7c0]/20"
          }
        `}
        title={hasText ? "Améliorer avec l'IA" : "Champ vide"}
      >
        {loading ? (
          <>
            <div className="w-3 h-3 border-2 border-[#49d7c0]/30 border-t-[#49d7c0] rounded-full animate-spin"></div>
            <span>IA...</span>
          </>
        ) : (
          <>
            <span>✏️</span>
            <span>IA</span>
          </>
        )}
      </button>

      {/* Dropdown Menu - Only show if there's text */}
      {showMenu && !loading && hasText && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 w-48">
            <div className="p-2">
              <p className="text-xs text-gray-400 px-2 py-1">
                Améliorer avec IA:
              </p>
              <button
                type="button"
                onClick={() => handleImprove("improve")}
                className="w-full text-left px-3 py-2 hover:bg-[#49d7c0]/10 rounded text-sm text-[#49d7c0] transition-all flex items-center"
              >
                <span className="mr-2">✨</span>
                Améliorer le style
              </button>
              <button
                type="button"
                onClick={() => handleImprove("rephrase")}
                className="w-full text-left px-3 py-2 hover:bg-blue-500/10 rounded text-sm text-blue-400 transition-all flex items-center"
              >
                <span className="mr-2">🔄</span>
                Reformuler
              </button>
              <button
                type="button"
                onClick={() => handleImprove("correct")}
                className="w-full text-left px-3 py-2 hover:bg-green-500/10 rounded text-sm text-green-400 transition-all flex items-center"
              >
                <span className="mr-2">✓</span>
                Corriger les fautes
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function FormPage() {
  const searchParams = useSearchParams();
  const mission = searchParams?.get("mission");
  const intent = searchParams?.get("intent");

  const [isClient, setIsClient] = useState(() => typeof window !== "undefined");
  const [prefilled, setPrefilled] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(() => ({
    message: "",
    skills: "",
    availability: "",
    motivation: "",
    question: "",
    amount: "",
    frequency: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    topic: "",
    subject: "",
    infoType: "",
    contactMethod: "",
    anonymous: "false",
    newsletter: "false",
    urgent: "false",
    domains: "",
  }));

  useEffect(() => {
    if (!searchParams) return;

    const extracted: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      if (key !== "mission" && key !== "intent") {
        extracted[key] = value;
      }
    }

    setPrefilled(extracted);

    setFormData((prev) => {
      const next = {
        ...prev,
        message: extracted.message || "",
        skills: extracted.skills || "",
        availability: extracted.availability || "",
        motivation: "",
        question: "",
        amount: extracted.amount || "",
        frequency: extracted.frequency || "",
        firstName: extracted.firstName || extracted.name?.split(" ")[0] || "",
        last:
          extracted.lastName ||
          extracted.name?.split(" ").slice(1).join(" ") ||
          "",
        email: extracted.email || "",
        phone: prev.phone || "",
        topic: extracted.topic || "",
        subject: prev.subject || "",
        infoType: prev.infoType || "",
        contactMethod: prev.contactMethod || "",
        anonymous: prev.anonymous ?? "false",
        newsletter: prev.newsletter ?? "false",
        urgent: prev.urgent ?? "false",
        domains: prev.domains || "",
      };

      if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
      return next;
    });
  }, [searchParams]);

  const handleInputChange = (fieldName: string, value: string | boolean) => {
    const stringValue = typeof value === "boolean" ? value.toString() : value;
    setFormData((prev) => ({ ...prev, [fieldName]: stringValue }));
  };

  const handleTextareaChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleTextImprove = (fieldName: string, newValue: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: newValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build submission data
    const submissionData = {
      mission: mission!,
      intent: intent || "",
      formData: formData,
      userName:
        `${formData.firstName} ${formData.lastName}`.trim() ||
        "Voyageur du Nexus",
    };

    console.log("Submitting form:", submissionData);

    try {
      const summaryRes = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (!summaryRes.ok) throw new Error("Summary generation failed");

      const summaryData = await summaryRes.json();

      if (summaryData.error) {
        throw new Error(summaryData.error);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "lastSubmission",
          JSON.stringify({
            ...submissionData,
            aiMessage: summaryData.message,
            year: summaryData.year,
          })
        );
      }

      const params = new URLSearchParams({
        mission: mission!,
        message: encodeURIComponent(summaryData.message),
        year: summaryData.year.toString(),
        userName: encodeURIComponent(submissionData.userName),
      });

      window.location.href = `/confirmation?${params.toString()}`;
    } catch (error) {
      console.error("Submission error:", error);
      alert("Erreur lors de l'envoi. Veuillez réessayer.");
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#49d7c0] to-[#72f0e0] animate-pulse mx-auto mb-4"></div>
          <p className="text-white">Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Formulaire non trouvé
          </h1>
          <p className="text-gray-400">
            Aucune mission spécifiée. Retournez à la page d'accueil.
          </p>
          <a
            href="/"
            className="mt-4 inline-block py-2 px-6 bg-gradient-to-r from-[#49d7c0] to-[#72f0e0] text-gray-900 font-semibold rounded-lg"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">
          {mission === "donation"
            ? "Formulaire de Don"
            : mission === "volunteer"
            ? "Rejoindre la Guilde des Bénévoles"
            : mission === "contact"
            ? "Nous Contacter"
            : "Demande d'Informations"}
        </h1>

        {intent && (
          <p className="text-gray-400 mb-6">
            <span className="inline-block mr-2">💡</span>
            Basé sur : <span className="italic">"{intent}"</span>
          </p>
        )}

        {Object.keys(prefilled).length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/10 to-teal-400/10 border border-cyan-400/30 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse mr-2"></div>
              <span className="text-cyan-300 font-medium">
                Champs pré-remplis automatiquement
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(prefilled).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center bg-black/20 p-2 rounded"
                >
                  <span className="text-sm text-cyan-300 capitalize mr-2 min-w-[120px]">
                    {key === "amount"
                      ? "Montant"
                      : key === "frequency"
                      ? "Fréquence"
                      : key === "skills"
                      ? "Compétences"
                      : key === "availability"
                      ? "Disponibilité"
                      : key === "message"
                      ? "Message"
                      : key === "topic"
                      ? "Sujet"
                      : key === "name"
                      ? "Nom"
                      : key === "email"
                      ? "Email"
                      : key}
                    :
                  </span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Form */}
        <form
          onSubmit={handleSubmit}
          className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6"
        >
          {/* DONATION FORM */}
          {mission === "donation" && (
            <>
              <h2 className="text-xl font-bold text-white mb-2">
                Faire un Don
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">
                    Montant (€) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                    className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                    placeholder="Ex: 50"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">
                    Fréquence *
                  </label>
                  <select
                    name="frequency"
                    value={formData.frequency || ""}
                    onChange={(e) =>
                      handleInputChange("frequency", e.target.value)
                    }
                    className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                    required
                  >
                    <option value="">Choisir une fréquence</option>
                    <option value="once">Une fois</option>
                    <option value="monthly">Mensuel</option>
                    <option value="yearly">Annuel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || ""}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                    placeholder="Votre prénom"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ""}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    Message d'accompagnement (optionnel)
                  </label>
                  <SimpleIAButton
                    fieldName="message"
                    currentValue={formData.message || ""}
                    onImprove={(newValue) =>
                      handleTextImprove("message", newValue)
                    }
                    mission={mission}
                  />
                </div>
                <textarea
                  name="message"
                  value={formData.message || ""}
                  onChange={(e) =>
                    handleTextareaChange("message", e.target.value)
                  }
                  placeholder="Un message pour l'association..."
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                  rows={4}
                />
                <p className="text-gray-500 text-xs mt-1">
                  500 caractères maximum
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="anonymous"
                  checked={formData.anonymous === "true"}
                  onChange={(e) =>
                    handleInputChange("anonymous", e.target.checked)
                  }
                  className="w-4 h-4 text-[#49d7c0] bg-black/30 border-gray-700 rounded focus:ring-[#49d7c0]"
                />
                <label
                  htmlFor="anonymous"
                  className="ml-2 text-gray-300 text-sm"
                >
                  Faire un don anonyme
                </label>
              </div>
            </>
          )}

          {/* VOLUNTEER FORM */}
          {mission === "volunteer" && (
            <>
              <h2 className="text-xl font-bold text-white mb-2">
                Devenir Bénévole
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || ""}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                    placeholder="Votre prénom"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ""}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                  placeholder="06 12 34 56 78"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    Compétences *
                  </label>
                  <SimpleIAButton
                    fieldName="skills"
                    currentValue={formData.skills || ""}
                    onImprove={(newValue) =>
                      handleTextImprove("skills", newValue)
                    }
                    mission={mission}
                  />
                </div>
                <textarea
                  name="skills"
                  value={formData.skills || ""}
                  onChange={(e) =>
                    handleTextareaChange("skills", e.target.value)
                  }
                  placeholder="Vos compétences, formations, expériences..."
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                  rows={4}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    Disponibilité *
                  </label>
                  <SimpleIAButton
                    fieldName="availability"
                    currentValue={formData.availability || ""}
                    onImprove={(newValue) =>
                      handleTextImprove("availability", newValue)
                    }
                    mission={mission}
                  />
                </div>
                <textarea
                  name="availability"
                  value={formData.availability || ""}
                  onChange={(e) =>
                    handleTextareaChange("availability", e.target.value)
                  }
                  placeholder="Vos disponibilités (jours, heures, durée...)"
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                  rows={4}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    Motivation *
                  </label>
                  <SimpleIAButton
                    fieldName="motivation"
                    currentValue={formData.motivation || ""}
                    onImprove={(newValue) =>
                      handleTextImprove("motivation", newValue)
                    }
                    mission={mission}
                  />
                </div>
                <textarea
                  name="motivation"
                  value={formData.motivation || ""}
                  onChange={(e) =>
                    handleTextareaChange("motivation", e.target.value)
                  }
                  placeholder="Pourquoi souhaitez-vous devenir bénévole ?"
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-gray-300 text-sm font-medium">
                  Domaines d'intérêt *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Événementiel",
                    "Communication",
                    "Logistique",
                    "Animation",
                    "Administratif",
                    "Technique",
                  ].map((domain) => (
                    <div key={domain} className="flex items-center">
                      <input
                        type="checkbox"
                        name="domains"
                        value={domain.toLowerCase()}
                        checked={
                          formData.domains?.includes(domain.toLowerCase()) ||
                          false
                        }
                        onChange={(e) => {
                          const currentDomains =
                            formData.domains?.split(",").filter(Boolean) || [];
                          const newDomains = e.target.checked
                            ? [...currentDomains, domain.toLowerCase()]
                            : currentDomains.filter(
                                (d) => d !== domain.toLowerCase()
                              );
                          handleInputChange("domains", newDomains.join(","));
                        }}
                        className="w-4 h-4 text-[#49d7c0] bg-black/30 border-gray-700 rounded focus:ring-[#49d7c0]"
                      />
                      <label className="ml-2 text-gray-300 text-sm">
                        {domain}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* CONTACT FORM */}
          {mission === "contact" && (
            <>
              <h2 className="text-xl font-bold text-white mb-2">
                Nous Contacter
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || ""}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                    placeholder="Votre prénom"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ""}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Sujet *
                </label>
                <select
                  name="subject"
                  value={formData.subject || ""}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                  required
                >
                  <option value="">Choisir un sujet</option>
                  <option value="partnership">Partenariat</option>
                  <option value="project">Projet</option>
                  <option value="general">Question générale</option>
                  <option value="technical">Problème technique</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    Message *
                  </label>
                  <SimpleIAButton
                    fieldName="message"
                    currentValue={formData.message || ""}
                    onImprove={(newValue) =>
                      handleTextImprove("message", newValue)
                    }
                    mission={mission}
                  />
                </div>
                <textarea
                  name="message"
                  value={formData.message || ""}
                  onChange={(e) =>
                    handleTextareaChange("message", e.target.value)
                  }
                  placeholder="Votre message..."
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                  rows={6}
                  required
                />
                <p className="text-gray-500 text-xs mt-1">
                  Minimum 10 caractères
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={formData.newsletter === "true"}
                  onChange={(e) =>
                    handleInputChange("newsletter", e.target.checked)
                  }
                  className="w-4 h-4 text-[#49d7c0] bg-black/30 border-gray-700 rounded focus:ring-[#49d7c0]"
                />
                <label className="ml-2 text-gray-300 text-sm">
                  Je souhaite recevoir la newsletter
                </label>
              </div>
            </>
          )}

          {/* INFO FORM */}
          {mission === "info" && (
            <>
              <h2 className="text-xl font-bold text-white mb-2">
                Demande d'Informations
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || ""}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                    placeholder="Votre prénom"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ""}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Sujet de votre demande *
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic || ""}
                  onChange={(e) => handleInputChange("topic", e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                  placeholder="Ex: Vos événements à venir"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Type d'information recherchée *
                </label>
                <select
                  name="infoType"
                  value={formData.infoType || ""}
                  onChange={(e) =>
                    handleInputChange("infoType", e.target.value)
                  }
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                  required
                >
                  <option value="">Choisir un type</option>
                  <option value="events">Événements</option>
                  <option value="projects">Projets en cours</option>
                  <option value="participation">Comment participer</option>
                  <option value="stats">Statistiques et rapports</option>
                  <option value="team">L'équipe et l'organisation</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    Votre question *
                  </label>
                  <SimpleIAButton
                    fieldName="question"
                    currentValue={formData.question || ""}
                    onImprove={(newValue) =>
                      handleTextImprove("question", newValue)
                    }
                    mission={mission}
                  />
                </div>
                <textarea
                  name="question"
                  value={formData.question || ""}
                  onChange={(e) =>
                    handleTextareaChange("question", e.target.value)
                  }
                  placeholder="Détaillez votre demande d'information..."
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#49d7c0] focus:ring-1 focus:ring-[#49d7c0] transition-all"
                  rows={6}
                  required
                />
                <p className="text-gray-500 text-xs mt-1">
                  Minimum 20 caractères
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-gray-300 text-sm font-medium">
                  Comment souhaitez-vous être contacté ? *
                </label>
                <div className="space-y-2">
                  {["Email", "Téléphone", "Les deux"].map((method) => (
                    <div key={method} className="flex items-center">
                      <input
                        type="radio"
                        name="contactMethod"
                        value={method.toLowerCase()}
                        checked={
                          formData.contactMethod === method.toLowerCase()
                        }
                        onChange={(e) =>
                          handleInputChange("contactMethod", e.target.value)
                        }
                        className="w-4 h-4 text-[#49d7c0] bg-black/30 border-gray-700 focus:ring-[#49d7c0]"
                        required
                      />
                      <label className="ml-2 text-gray-300 text-sm">
                        {method}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="urgent"
                  checked={formData.urgent === "true"}
                  onChange={(e) =>
                    handleInputChange("urgent", e.target.checked)
                  }
                  className="w-4 h-4 text-[#49d7c0] bg-black/30 border-gray-700 rounded focus:ring-[#49d7c0]"
                />
                <label className="ml-2 text-gray-300 text-sm">
                  Cette demande est urgente
                </label>
              </div>
            </>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="mt-8 w-full py-3 bg-gradient-to-r from-[#49d7c0] to-[#72f0e0] text-gray-900 font-bold rounded-lg hover:opacity-90 transition-all"
          >
            Envoyer le formulaire
          </button>
        </form>
      </div>
    </div>
  );
}
