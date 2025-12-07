export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 animate-pulse">Consulting the elves...</p>
    </div>
  );
}

