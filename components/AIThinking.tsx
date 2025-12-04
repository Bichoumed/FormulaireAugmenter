export default function AIThinking({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center ${
        small ? "space-x-1" : "space-x-2"
      }`}
    >
      <div
        className={`${
          small ? "w-1.5 h-1.5" : "w-2 h-2"
        } rounded-full bg-[#49d7c0] animate-pulse`}
      />
      <div
        className={`${
          small ? "w-1.5 h-1.5" : "w-2 h-2"
        } rounded-full bg-[#49d7c0] animate-pulse delay-150`}
      />
      <div
        className={`${
          small ? "w-1.5 h-1.5" : "w-2 h-2"
        } rounded-full bg-[#49d7c0] animate-pulse delay-300`}
      />
    </div>
  );
}
