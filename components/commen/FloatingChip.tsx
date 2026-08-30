/* ═══════════════════════ SUBCOMPONENTS ═══════════════════════ */

export function FloatingChip({
    icon,
    label,
    className,
  }: {
    icon: React.ReactNode;
    label: string;
    className?: string;
  }) {
    return (
      <div
        className={`absolute flex items-center gap-2 rounded-xl border bg-background/90 px-3 py-2 text-xs font-medium shadow-sm backdrop-blur ${className ?? ""}`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        {label}
      </div>
    );
  }