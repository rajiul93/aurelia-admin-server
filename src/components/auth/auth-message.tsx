import { Alert, AlertDescription } from "@/components/ui/alert";

type AuthMessageProps = {
  error?: string | null;
  success?: string | null;
};

export function AuthMessage({ error, success }: AuthMessageProps) {
  if (!error && !success) {
    return null;
  }

  return (
    <Alert variant={error ? "destructive" : "default"}>
      <AlertDescription>{error ?? success}</AlertDescription>
    </Alert>
  );
}
