"use client";

import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { buildFaqAnswer, type FaqAnswerFields } from "@/modules/faq/faq.answer";
import { cn } from "@/lib/utils";

type QuillEditorProps = {
  valueHtml: string;
  onChange: (answer: FaqAnswerFields) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

export function QuillEditor({
  valueHtml,
  onChange,
  disabled = false,
  className,
  placeholder = "Write the answer…",
}: QuillEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  const skipSyncRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || quillRef.current) {
      return;
    }

    const editorHost = document.createElement("div");
    container.appendChild(editorHost);

    const quill = new Quill(editorHost, {
      theme: "snow",
      placeholder,
      modules: {
        toolbar: [
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link"],
          ["clean"],
        ],
      },
    });

    if (valueHtml) {
      quill.clipboard.dangerouslyPasteHTML(valueHtml);
    }

    quill.on("text-change", () => {
      skipSyncRef.current = true;
      onChangeRef.current(buildFaqAnswer(quill.root.innerHTML));
    });

    quillRef.current = quill;
    quill.enable(!disabled);

    return () => {
      quill.off("text-change");
      quillRef.current = null;
      container.innerHTML = "";
    };
    // Mount once; external value sync is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) {
      return;
    }

    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    const currentHtml = quill.root.innerHTML;
    const nextHtml = valueHtml || "";

    if (currentHtml === nextHtml) {
      return;
    }

    const selection = quill.getSelection();
    quill.setContents([]);
    if (nextHtml) {
      quill.clipboard.dangerouslyPasteHTML(nextHtml);
    }
    if (selection) {
      quill.setSelection(selection);
    }
  }, [valueHtml]);

  useEffect(() => {
    quillRef.current?.enable(!disabled);
  }, [disabled]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "faq-quill bg-background overflow-hidden rounded-lg border border-input",
        "[&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-input",
        "[&_.ql-container]:border-0 [&_.ql-editor]:min-h-32 [&_.ql-editor]:text-sm",
        "[&_.ql-editor.ql-blank::before]:text-muted-foreground [&_.ql-editor.ql-blank::before]:not-italic",
        className,
      )}
    />
  );
}
