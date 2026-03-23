import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 rounded-xl border border-error/20 bg-error/5 p-3"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-error" />
      <p className="text-[14px] text-error">{message}</p>
    </div>
  );
}
