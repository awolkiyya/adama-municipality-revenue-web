import { ReactNode } from "react";

type ToolbarProps = {
  search?: ReactNode;
  right?: ReactNode;
  className?: string;
};

export function Toolbar({ search, right, className }: ToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
  
    {/* LEFT */}
    <div className="flex-1">
      <div className="w-full max-w-md">
        {search}
      </div>
    </div>
  
    {/* RIGHT */}
    <div className="flex items-center gap-2">
      {right}
    </div>
  
  </div>
  );
}