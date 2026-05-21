export type ToastMessage = {
  id: number;
  type: "success" | "error";
  text: string;
};

type ToastProps = {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
};

export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-24 right-5 z-40 flex w-[min(92vw,330px)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm shadow-2xl backdrop-blur-xl transition ${
            toast.type === "success"
              ? "border-emerald-400/40 bg-emerald-950/70 text-emerald-50"
              : "border-red-400/45 bg-red-950/70 text-red-50"
          }`}
        >
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
              toast.type === "success"
                ? "border-emerald-300 text-emerald-300"
                : "border-red-300 text-red-300"
            }`}
          >
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <p className="flex-1 leading-5">{toast.text}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-lg leading-none text-white/55 transition hover:text-white"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
