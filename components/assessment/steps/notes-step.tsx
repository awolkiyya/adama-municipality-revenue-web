import {
    FileText,
  } from "lucide-react";
  
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  
  import {
    Label,
  } from "@/components/ui/label";
  
  import {
    Textarea,
  } from "@/components/ui/textarea";
  
  type NotesStepProps = {
    value: string;
    onChange: (
      value: string,
    ) => void;
  };
  
  export function NotesStep({
    value,
    onChange,
  }: NotesStepProps) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-4" />
            </div>
  
            <div>
              <CardTitle className="text-base">
                Assessment Notes
              </CardTitle>
  
              <p className="mt-1 text-sm text-muted-foreground">
                Add any supporting information
                that may help with reviewing this
                assessment.
              </p>
            </div>
          </div>
        </CardHeader>
  
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="assessment-notes">
              Notes
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (Optional)
              </span>
            </Label>
  
            <Textarea
              id="assessment-notes"
              value={value}
              onChange={(event) =>
                onChange(
                  event.target.value,
                )
              }
              placeholder="Enter site visit observations, measurements, supporting context, or other relevant information..."
              rows={8}
              className="resize-y"
            />
  
            <div className="flex justify-between gap-4 text-xs text-muted-foreground">
              <span>
                Notes are not used for tariff
                or amount calculation.
              </span>
  
              <span className="shrink-0">
                {value.length} characters
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }