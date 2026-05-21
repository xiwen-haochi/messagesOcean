import type { Message } from "@/lib/api";

type MessageCardProps = {
  message: Message;
  style?: React.CSSProperties;
};

export default function MessageCard({ message, style }: MessageCardProps) {
  const displayAuthor = message.author?.trim() ? `@${message.author}` : "@anonymous";
  const displayTime = new Date(message.timestamp).toLocaleString();

  return (
    <article
      className="pointer-events-none absolute z-20 w-72 rounded-xl border border-ocean-cyan/70 bg-slate-950/80 p-4 text-sm text-slate-100 shadow-neon backdrop-blur-xl transition-all duration-300"
      style={style}
    >
      <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-medium text-ocean-cyan">
        <span className="rounded-md border border-ocean-cyan/30 bg-ocean-cyan/10 px-2 py-1 font-mono">
          ( x : {message.x}, y : {message.y} )
        </span>
        <span className="h-5 w-4 rounded border border-ocean-cyan/40" />
      </div>

      <p className="leading-6 text-slate-50">{message.content}</p>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <span className="text-violet-300">{displayAuthor}</span>
        <time className="font-mono text-[11px] text-slate-500">{displayTime}</time>
      </div>

      {/* 小三角让卡片像从发光坐标点漂浮出来。 */}
      <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-ocean-cyan/70 bg-slate-950/80" />
    </article>
  );
}
