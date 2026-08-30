import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NotesCard({ notes }: { notes: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Notes</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {notes}
        </p>
      </CardContent>
    </Card>
  );
}
