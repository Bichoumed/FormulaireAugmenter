"use client";

import { useEffect, useState } from "react";

interface AxolotlOrbProps {
  loading?: boolean;
  mission?: string;
  celebrating?: boolean;
}

export default function AxolotlOrb({
  loading = false,
  mission,
  celebrating = false,
}: AxolotlOrbProps) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => (p + 0.05) % (2 * Math.PI));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const glowIntensity = celebrating
    ? 1
    : loading
    ? 0.8
    : 0.3 + Math.sin(pulse) * 0.2;

  const glowSize = celebrating ? "80px" : loading ? "60px" : "40px";

  const orbSize = celebrating ? "w-20 h-20" : "w-16 h-16";

  return (
    <div className="relative">
      {/* Main Orb Container */}
      <div
        className={`${orbSize} rounded-full relative overflow-hidden`}
        style={{
          background: `radial-gradient(circle at 30% 30%, rgba(73,215,192,${glowIntensity}) 0%, rgba(73,215,192,0.1) 70%)`,
          boxShadow: `0 0 ${glowSize} rgba(73,215,192,${glowIntensity * 0.5})`,
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Inner Glow */}
        <div
          className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-white/40 blur-sm"
          style={{
            animation: loading || celebrating ? "pulse 1s infinite" : "none",
          }}
        />

        {/* Additional Glow Spots for Celebration */}
        {celebrating && (
          <>
            <div
              className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-cyan-300/50 blur-sm animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-teal-300/40 blur-sm animate-pulse"
              style={{ animationDelay: "0.4s" }}
            />
          </>
        )}
      </div>

      {/* Celebration Ping Effect */}
      {celebrating && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#49d7c0] via-teal-400 to-cyan-400 animate-ping opacity-30" />
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-[#49d7c0] to-teal-400 animate-ping opacity-20"
            style={{ animationDelay: "0.5s" }}
          />
        </div>
      )}

      {/* Loading Ping Effect */}
      {loading && !celebrating && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 rounded-full bg-[#49d7c0] animate-ping opacity-20" />
        </div>
      )}

      {/* Floating Particles for Celebration */}
      {celebrating && (
        <div className="absolute -inset-8 -z-20 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-[#49d7c0] to-teal-400 rounded-full animate-float"
              style={{
                left: `${20 + (i % 4) * 20}%`,
                top: `${10 + Math.floor(i / 2) * 30}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${2 + i * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Mission Label */}
      {mission && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-[#49d7c0] font-medium opacity-80">
          {mission === "donation"
            ? "💰 Don"
            : mission === "volunteer"
            ? "🛡️ Bénévole"
            : mission === "contact"
            ? "📞 Contact"
            : "❓ Info"}
        </div>
      )}

      {/* Add CSS Animation */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-15px) rotate(180deg);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}
