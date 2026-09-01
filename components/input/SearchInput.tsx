"use client"
/* =====================================================
   SEARCH INPUT
===================================================== */

import { Search } from "lucide-react";
import { Input } from "../ui/input";

export function SearchInput({
    className,
    ...props
  }: React.ComponentProps<typeof Input>) {
    return (
      <div className="relative w-full max-w-md">
        <Search
          className="
            pointer-events-none
            absolute
            left-3
            top-1/2
            h-4
            w-4
            -translate-y-1/2
            text-muted-foreground
          "
        />
  
        <Input
          className={`pl-9 py-5 w-full ${className ?? ""}`}
          {...props}
        />
      </div>
    );
  }