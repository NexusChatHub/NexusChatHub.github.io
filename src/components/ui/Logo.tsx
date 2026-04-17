type LogoProps = {
  className?: string;
  compact?: boolean;
};

export function Logo({ className = '', compact = false }: LogoProps) {
  return (
    <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'} ${className}`}>
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[#d0d7de] bg-[linear-gradient(180deg,#2f81f7_0%,#1769ff_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
        <span className="absolute inset-[6px] rounded-[8px] border border-white/35" />
        <span className="h-2 w-2 rounded-full bg-white" />
      </div>

      <div className="flex flex-col leading-none">
        <span className={`${compact ? 'text-base' : 'text-lg'} font-semibold tracking-tight text-[var(--text)]`}>
          Nexus
        </span>
        <span className="font-[family-name:var(--font-geist-mono)] text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted)]">
          realtime chat
        </span>
      </div>
    </div>
  );
}
