import { formatCoordinate, type Coordinate } from "@/lib/canvas";

type CoordinateIndicatorProps = {
  coordinate: Coordinate;
};

export default function CoordinateIndicator({ coordinate }: CoordinateIndicatorProps) {
  return (
    <aside className="fixed bottom-5 left-5 z-30 hidden w-56 rounded-2xl border border-ocean-cyan/20 bg-slate-950/82 p-4 shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-xl md:block">
      <div className="relative mx-auto mb-3 h-32 w-32 border border-ocean-cyan/10 bg-[linear-gradient(rgba(59,199,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,199,255,0.08)_1px,transparent_1px)] bg-[size:12px_12px]">
        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-ocean-cyan/55" />
        <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-ocean-cyan/55" />
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-ocean-cyan shadow-neon" />
        <span className="absolute left-1/2 top-1 -translate-x-1/2 text-[10px] text-slate-400">N</span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-slate-400">S</span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">W</span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">E</span>
      </div>

      <p className="text-center font-mono text-xs text-ocean-cyan">{formatCoordinate(coordinate)}</p>
    </aside>
  );
}
