"use client";

import { useEffect } from "react";

interface SweetAlertProps {
  show: boolean;
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  onClose: () => void;
  confirmText?: string;
}

export default function SweetAlert({
  show,
  type,
  title,
  message,
  onClose,
  confirmText = "OK",
}: SweetAlertProps) {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [show]);

  if (!show) return null;

  // Toutes les alertes utilisent la couleur turquoise/teal du thème
  const turquoiseTheme = {
    bg: "from-[#49d7c0]/20 to-[#72f0e0]/20",
    border: "border-[#49d7c0]/50",
    iconBg: "bg-[#49d7c0]/20",
    iconColor: "text-[#49d7c0]",
    button: "bg-gradient-to-r from-[#49d7c0] to-[#72f0e0] hover:from-[#49d7c0]/90 hover:to-[#72f0e0]/90",
  };

  const typeStyles = {
    error: {
      icon: "🚫",
      ...turquoiseTheme,
    },
    warning: {
      icon: "⚠️",
      ...turquoiseTheme,
    },
    info: {
      icon: "ℹ️",
      ...turquoiseTheme,
    },
    success: {
      icon: "✅",
      ...turquoiseTheme,
    },
  };

  const style = typeStyles[type];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fadeIn"
        onClick={onClose}
      />

      {/* Alert Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`
            backdrop-blur-xl bg-gradient-to-br ${style.bg} 
            border ${style.border} rounded-2xl p-6 max-w-md w-full
            shadow-2xl pointer-events-auto
            animate-scaleIn
          `}
        >
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div
              className={`
                w-16 h-16 rounded-full ${style.iconBg} 
                flex items-center justify-center text-4xl
                animate-bounce
              `}
            >
              {style.icon}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white text-center mb-3">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-300 text-center mb-6 whitespace-pre-line">
            {message}
          </p>

          {/* Button */}
          <button
            onClick={onClose}
            className={`
              w-full py-3 px-6 ${style.button} 
              text-white font-semibold rounded-lg
              transition-all transform hover:scale-105
              active:scale-95
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

