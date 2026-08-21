import { useRef, useState } from "react";
import { Camera, Check, Images, Loader2, Trash2 } from "lucide-react";

export function FotoItem({
  label,
  url,
  onSelect,
  onRemove,
}: {
  label: string;
  url?: string | undefined;
  onSelect: (file: File) => Promise<void>;
  onRemove?: (() => Promise<void>) | undefined;
}) {
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const galeriaRef = useRef<HTMLInputElement | null>(null);
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
    <div className="surface-card space-y-3 p-3">
      <div className="flex items-center gap-3">
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
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={busy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-bold uppercase text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          Tirar foto
        </button>
        <button
          onClick={() => galeriaRef.current?.click()}
          disabled={busy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-secondary px-3 text-xs font-bold uppercase text-foreground disabled:opacity-60"
        >
          <Images className="size-4" /> Galeria
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={galeriaRef}
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
