import { ExternalLink, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AssessmentServiceValue } from "@/types/revenue/assessment";

type EvidenceFile = NonNullable<AssessmentServiceValue["files"]>[number];

export function EvidenceFileRow({
  file,
  isOpening,
  onOpen,
}: {
  file: EvidenceFile;
  isOpening: boolean;
  onOpen: (file: EvidenceFile) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>

          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {file.mimeType && <span>{file.mimeType}</span>}

            {file.status && (
              <>
                <span>•</span>
                <span>{file.status}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isOpening}
        onClick={() => onOpen(file)}
        className="shrink-0"
      >
        {isOpening ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ExternalLink className="mr-2 h-4 w-4" />
        )}
        {isOpening ? "Opening..." : "Open File"}
      </Button>
    </div>
  );
}
