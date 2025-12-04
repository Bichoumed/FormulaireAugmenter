import IntentRecognizer from "@/components/IntentRecognizer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0d1117] to-[#1a1f29] flex flex-col items-center justify-center p-4 relative">
      <IntentRecognizer />
      
      {/* NIRD Footer Text */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <p className="text-xs text-gray-600 text-center max-w-2xl px-4">
          Engagé pour un <span className="text-[#49d7c0]">numérique inclusif</span>, 
          qui respecte l'environnement et favorise l'accessibilité pour tous
        </p>
      </div>
    </main>
  );
}
