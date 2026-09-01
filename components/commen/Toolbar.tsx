import { ReactNode } from "react";

type ToolbarProps = {
  search?: ReactNode;
  right?: ReactNode;
  className?: string;
};

export function Toolbar({ search, right, className }: ToolbarProps) {
  return (
    <div className="flex flex-col  md:flex-row items-center justify-between gap-3">
  
    {/* LEFT */}
    <div className="flex-1">
      <div className="w-full max-w-full">
        {search}
      </div>
    </div>
  
    {/* RIGHT */}
    <div className="flex items-center gap-1">
      {right}
    </div>
  
  </div>
  );
}