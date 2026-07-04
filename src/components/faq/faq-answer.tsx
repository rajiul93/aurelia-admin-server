import { cn } from "@/lib/utils";

type FaqAnswerProps = {
  answerHtml: string;
  answerText: string;
  className?: string;
  /** Prefer rich HTML when present; fall back to plain text. */
  mode?: "rich" | "plain";
};

export function FaqAnswer({
  answerHtml,
  answerText,
  className,
  mode = "rich",
}: FaqAnswerProps) {
  if (mode === "plain" || !answerHtml) {
    return (
      <p className={cn("text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap", className)}>
        {answerText}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "faq-answer text-muted-foreground text-sm leading-relaxed",
        "[&_p]:mb-2 [&_p:last-child]:mb-0",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_a]:text-primary [&_a]:underline",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: answerHtml }}
    />
  );
}
