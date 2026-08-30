"use client";

import React from "react";

type Props = {
  errors: string[];
  title?: string;
};

export function FormErrorSummary({
  errors,
  title = "Please fix the following issues:",
}: Props) {
  if (!errors.length) return null;

  return (
    <div className="rounded-2xl border border-red-200  p-4">
      <h3 className="font-semibold text-red-600 mb-2">
        {title}
      </h3>

      <ul className="list-disc pl-5 space-y-1 text-sm text-red-600">
        {errors.map((err, i) => (
          <li key={i}>{err}</li>
        ))}
      </ul>
    </div>
  );
}