export default function LoadingScreen() {
  return (
    <div className="flex-1 flex items-center justify-center bg-surface-base">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-olive border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-zinc-400">Carregando dados CMV...</p>
      </div>
    </div>
  );
}
