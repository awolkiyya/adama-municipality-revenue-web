import { TableRow, TableCell } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import React from "react";

interface TableLoadingProps {
  colSpan: number;
  message?: string;
}

export function TableLoading({
  colSpan,
  message = "Loading data...",
}: TableLoadingProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="p-10">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />

          <p className="text-sm text-muted-foreground font-medium">
            {message}
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}