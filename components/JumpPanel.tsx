import type { FormEvent } from "react";

type JumpPanelProps = {
  jumpX: string;
  jumpY: string;
  isLoadingRandom: boolean;
  onJumpXChange: (value: string) => void;
  onJumpYChange: (value: string) => void;
  onJump: () => void;
  onRandom: () => void;
};

export default function JumpPanel({
  jumpX,
  jumpY,
  isLoadingRandom,
  onJumpXChange,
  onJumpYChange,
  onJump,
  onRandom
}: JumpPanelProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onJump();
  }

  return (
    <section className="fixed right-5 top-5 z-30 w-[min(92vw,330px)] rounded-2xl border border-white/10 bg-slate-950/84 p-4 shadow-[0_0_34px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Jump to Coordinate</h2>
        <span className="text-slate-500">×</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-2">
            <span className="text-xs text-slate-500">X Coordinate</span>
            <input
              value={jumpX}
              onChange={(event) => onJumpXChange(event.target.value)}
              inputMode="numeric"
              className="h-10 w-full rounded-lg border border-ocean-cyan/20 bg-black/40 px-3 font-mono text-sm text-slate-100 outline-none transition focus:border-ocean-cyan"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs text-slate-500">Y Coordinate</span>
            <input
              value={jumpY}
              onChange={(event) => onJumpYChange(event.target.value)}
              inputMode="numeric"
              className="h-10 w-full rounded-lg border border-ocean-cyan/20 bg-black/40 px-3 font-mono text-sm text-slate-100 outline-none transition focus:border-ocean-cyan"
            />
          </label>
        </div>

        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-ocean-cyan text-sm font-semibold text-slate-950 shadow-neon-strong transition hover:bg-cyan-300"
        >
          Jump
        </button>
      </form>

      <button
        type="button"
        onClick={onRandom}
        disabled={isLoadingRandom}
        className="mt-4 h-11 w-full rounded-lg border border-violet-400/20 bg-violet-500/10 text-sm font-medium text-violet-200 transition hover:border-violet-300/50 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoadingRandom ? "Finding..." : "Random Coordinate"}
      </button>
    </section>
  );
}
