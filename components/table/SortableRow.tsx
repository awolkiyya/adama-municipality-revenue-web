import React from "react";
import { Row } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SortableRowProps<T> = {
  row: Row<T>;
  children: React.ReactNode;
  as?: React.ElementType; // allows TableRow, div, tr, etc.
  getId?: (row: T) => string | number;
};

export function SortableRow<T>({
  row,
  children,
  as: Component = "tr",
  getId,
}: SortableRowProps<T>) {
  const id =
    getId?.(row.original) ??
    (row.original as any).id;

  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(id),
  });

  return (
    <Component
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "opacity-60" : ""}
    >
      {children}
    </Component>
  );
}