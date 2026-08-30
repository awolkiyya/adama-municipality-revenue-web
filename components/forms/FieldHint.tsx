export function FieldHint({
    text,
    required,
  }: {
    text: string;
    required?: boolean;
  }) {
    return (
      <p className="text-xs text-muted-foreground mt-1">
        {required ? (
          <span className="text-red-500 font-medium">Required • </span>
        ) : (
          <span className="text-muted-foreground">Optional • </span>
        )}
        {text}
      </p>
    );
  }