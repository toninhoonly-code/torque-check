import { useRef, useState } from "react";
import { Camera, Check, Loader2, Trash2 } from "lucide-react";

export function FotoItem({
  label,
  url,
  onSelect,
  onRemove,
}: {
  label: string;
  url?: string;
  onSelect: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  async function handle(file?: File | null) {
    if (!file) return;
    setBusy(true);
    try {
      await onSelect(file);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-card flex items-center gap-3 p-3">
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary">
        {url ? (
          <img src={url} alt={label} className="size-full object-cover" />
        ) : (
          <Camera className="size-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">
          {url ? (
            <span className="inline-flex items-center gap-1 text-[color:var(--color-success)]">
              <Check className="size-3" /> Registrada
            </span>
          ) : (
            "Pendente"
          )}
        </p>
      </div>
      {url && onRemove && (
        <button
          onClick={() => onRemove()}
          className="grid size-10 place-items-center rounded-lg bg-secondary text-muted-foreground"
          aria-label={`Remover foto ${label}`}
        >
          <Trash2 className="size-4" />
        </button>
      )}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="h-11 shrink-0 rounded-lg bg-primary px-4 text-xs font-bold uppercase text-primary-foreground disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : url ? "Trocar" : "Tirar foto"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
