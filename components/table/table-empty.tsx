import { ReactNode } from "react";

interface Props {
  colSpan: number;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function TableEmptyState({
  colSpan,
  title,
  description,
  action,
}: Props) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-14">
        <div className="flex flex-col items-center justify-center text-center gap-3">
          <h3 className="text-sm font-semibold">{title}</h3>

          {description && (
            <p className="text-xs text-muted-foreground max-w-md">
              {description}
            </p>
          )}

          {/* 👇 optional action */}
          {action && <div className="mt-2">{action}</div>}
        </div>
      </td>
    </tr>
  );
}