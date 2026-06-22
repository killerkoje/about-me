export default function DesignPreviewLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-3 h-14 rounded-sm border-2 border-[#2a2a2a]/20 bg-[#c8e64a]/40 animate-pulse"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
        <p className="text-[10px] font-black tracking-[0.28em] uppercase text-[#2a2a2a]/35">
          Loading shelf
        </p>
      </div>
    </div>
  )
}
