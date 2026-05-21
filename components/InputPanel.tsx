import type { FormEvent } from "react";
import { formatCoordinate, type Coordinate } from "@/lib/canvas";

type InputPanelProps = {
  coordinate: Coordinate;
  author: string;
  message: string;
  isSubmitting: boolean;
  onAuthorChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
};

export default function InputPanel({
  coordinate,
  author,
  message,
  isSubmitting,
  onAuthorChange,
  onMessageChange,
  onSubmit
}: InputPanelProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-5 left-1/2 z-30 w-[min(92vw,760px)] -translate-x-1/2 rounded-2xl border border-ocean-cyan/45 bg-slate-950/82 p-4 shadow-neon backdrop-blur-2xl"
    >
      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
        <label className="space-y-2">
          <span className="text-xs text-slate-400">Author (optional)</span>
          <input
            value={author}
            onChange={(event) => onAuthorChange(event.target.value)}
            maxLength={40}
            placeholder="@yourname"
            className="h-11 w-full rounded-lg border border-ocean-cyan/25 bg-black/35 px-3 text-sm text-slate-100 outline-none transition focus:border-ocean-cyan focus:shadow-neon"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs text-slate-400">Message</span>
          <textarea
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            maxLength={500}
            placeholder="Write your message here..."
            className="h-24 w-full resize-none rounded-lg border border-ocean-cyan/25 bg-black/35 px-3 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-ocean-cyan focus:shadow-neon"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-xs text-ocean-cyan">{formatCoordinate(coordinate)}</p>
          <p className="text-xs text-slate-500">{message.length} / 500</p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className="rounded-lg bg-ocean-cyan px-6 py-3 text-sm font-semibold text-slate-950 shadow-neon-strong transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isSubmitting ? "Posting..." : "Post Message"}
        </button>
      </div>
    </form>
  );
}
