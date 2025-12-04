"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AxolotlOrb from "@/components/AxolotlOrb";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mission = searchParams?.get("mission");
  const encodedMessage = searchParams?.get("message");
  const year = searchParams?.get("year");
  const encodedUserName = searchParams?.get("userName");

  const [aiMessage, setAiMessage] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [celebrating, setCelebrating] = useState(true);

  useEffect(() => {
    setIsClient(true);

    if (encodedMessage) {
      setAiMessage(decodeURIComponent(encodedMessage));
    }

    if (encodedUserName) {
      setUserName(decodeURIComponent(encodedUserName));
    }

    // Celebration animation
    const timer = setTimeout(() => {
      setCelebrating(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [encodedMessage, encodedUserName]);

  const missionTitles = {
    donation: "Mission Don Accomplie 💰",
    volunteer: "Guilde des Bénévoles Rejointe 🛡️",
    contact: "Contact Établi 📞",
    info: "Informations Demandées ❓",
  };

  const missionDetails = {
    donation: {
      title: "Mission Don Accomplie",
      icon: "💰",
      color: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-400/30",
      impact:
        "Ton soutien financier permettra de financer nos projets essentiels.",
    },
    volunteer: {
      title: "Guilde des Bénévoles Rejointe",
      icon: "🛡️",
      color: "from-blue-500/20 to-indigo-500/20",
      borderColor: "border-blue-400/30",
      impact:
        "Tes compétences et ta motivation sont précieuses pour notre communauté.",
    },
    contact: {
      title: "Contact Établi",
      icon: "📞",
      color: "from-purple-500/20 to-violet-500/20",
      borderColor: "border-purple-400/30",
      impact: "Notre équipe te répondra dans les plus brefs délais.",
    },
    info: {
      title: "Informations Demandées",
      icon: "❓",
      color: "from-yellow-500/20 to-amber-500/20",
      borderColor: "border-yellow-400/30",
      impact: "Nous préparons les informations les plus pertinentes pour toi.",
    },
  };

  const missionInfo = mission
    ? missionDetails[mission as keyof typeof missionDetails]
    : missionDetails.donation;

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#49d7c0] to-[#72f0e0] animate-pulse mx-auto mb-4"></div>
          <p className="text-white">Préparation de ta confirmation...</p>
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Confirmation non trouvée
          </h1>
          <p className="text-gray-400">Retournez à la page d'accueil.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 inline-block py-2 px-6 bg-gradient-to-r from-[#49d7c0] to-[#72f0e0] text-gray-900 font-semibold rounded-lg"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Celebration Orb */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <AxolotlOrb loading={celebrating} mission={mission} />
            {celebrating && (
              <div className="absolute inset-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#49d7c0] to-teal-400 animate-ping opacity-20"></div>
              </div>
            )}
          </div>
        </div>

        {/* Main Card */}
        <div
          className={`backdrop-blur-lg bg-gradient-to-br ${missionInfo.color} border ${missionInfo.borderColor} rounded-2xl p-8 shadow-2xl`}
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              {missionInfo.icon} {missionInfo.title}
            </h1>
            {userName && (
              <p className="text-xl text-[#49d7c0] font-semibold mb-2">
                {userName}
              </p>
            )}
            <p className="text-gray-300">
              Ton intention a été transmise au Nexus
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-full">
              <span className="text-green-400 font-medium text-sm">
                🌱 NIRD {year || new Date().getFullYear()}
              </span>
              <span className="text-gray-400 text-xs">
                Numérique Inclusif, Responsable et Durable
              </span>
            </div>
          </div>

          {/* AI Message Card */}
          <div className="mb-8 p-6 bg-black/40 border border-white/10 rounded-xl">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse mr-3"></div>
              <span className="text-cyan-300 font-medium">
                Écho Personnalisé de l'IA
              </span>
            </div>

            <div className="text-center">
              <p className="text-xl text-white italic mb-4">
                "{aiMessage || "Chargement du message personnalisé..."}"
              </p>

              <div className="flex flex-col items-center gap-2 mt-4">
                {userName && (
                  <p className="text-gray-300 text-sm">
                    Message généré spécialement pour <span className="font-semibold text-[#49d7c0]">{userName}</span>
                  </p>
                )}
                <p className="text-gray-400 text-xs">
                  Mission: {missionInfo.title} • Année: {year || new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>

          {/* Year & Impact Section */}
          <div className="mb-8 p-6 bg-gradient-to-r from-cyan-500/10 to-teal-400/10 border border-cyan-400/20 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <span className="mr-2">📈</span>
              Impact NIRD en {year || new Date().getFullYear()}
            </h3>

            <p className="text-gray-300 mb-4">{missionInfo.impact}</p>

            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-400 mr-3"></div>
                <span className="text-white">
                  Ton action en{" "}
                  <span className="font-bold">
                    {year || new Date().getFullYear()}
                  </span>{" "}
                  renforce un numérique inclusif, responsable et durable 🌱
                </span>
              </div>

              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mr-3"></div>
                <span className="text-white">
                  Grâce à toi, nous pouvons avancer sur nos projets NIRD cette année
                </span>
              </div>

              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mr-3"></div>
                <span className="text-white">
                  Reste connecté pour suivre nos projets tout au long de
                  l'année {year || new Date().getFullYear()} !
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-8 p-6 bg-black/30 border border-gray-700 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4">
              Prochaines étapes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl mb-2">📧</div>
                <h4 className="font-medium text-white mb-2">
                  Confirmation par email
                </h4>
                <p className="text-gray-400 text-sm">
                  Tu recevras une confirmation dans les prochaines minutes
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl mb-2">🔄</div>
                <h4 className="font-medium text-white mb-2">
                  Suivi personnalisé
                </h4>
                <p className="text-gray-400 text-sm">
                  Notre équipe te contactera pour la suite du processus
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex-1 py-3 bg-gradient-to-r from-[#49d7c0] to-[#72f0e0] text-gray-900 font-bold rounded-lg hover:opacity-90 transition-all"
            >
              Retourner au Portail Principal
            </button>

            <button
              onClick={() => router.push(`/form?mission=${mission}`)}
              className="flex-1 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all border border-white/20"
            >
              Nouvelle Mission
            </button>
          </div>

          {/* Celebration Particles (optional) */}
          {celebrating && (
            <div className="fixed inset-0 pointer-events-none z-50">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-gradient-to-r from-[#49d7c0] to-teal-400 rounded-full animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Merci de faire partie de notre communauté. Ton engagement fait la
            différence.
          </p>
          <p className="text-gray-600 text-xs mt-2">
            © Nexus Connecté {new Date().getFullYear()} • Tous les chemins
            mènent au Nexus
          </p>
        </div>
      </div>

      {/* Add animation to globals.css */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.5;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
}
