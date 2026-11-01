
"use client";

import React from "react";
import { Row } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SortableRowData = {
  id?: string | number;
};

type SortableRowProps<T extends SortableRowData> = {
  row: Row<T>;
  children: React.ReactNode;
  as?: React.ElementType;
  getId?: (row: T) => string | number;
};

export function SortableRow<T extends SortableRowData>({
  row,
  children,
  as: Component = "tr",
  getId,
}: SortableRowProps<T>) {
  const id = getId
    ? getId(row.original)
    : row.original.id;

  if (id === undefined || id === null || id === "") {
    throw new Error(
      "SortableRow requires a valid row ID. Provide getId or an id property."
    );
  }

  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
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
