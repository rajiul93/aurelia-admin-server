export type FaqAnswerFields = {
  answer_html: string;
  answer_text: string;
};

/**
 * Derive plain text from Quill HTML. Prefer DOM parsing in the browser;
 * fall back to tag stripping on the server.
 */
export function htmlToPlainText(html: string): string {
  if (!html) {
    return "";
  }

  if (typeof document !== "undefined") {
    const element = document.createElement("div");
    element.innerHTML = html;
    return (element.textContent ?? element.innerText ?? "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Quill empty states like `<p><br></p>` should not count as content. */
export function isEmptyQuillHtml(html: string): boolean {
  return htmlToPlainText(html).length === 0;
}

/**
 * Single source of truth: Quill HTML in, both answer fields out.
 * Always build `answer_text` from `answer_html` — never edit them separately.
 */
export function buildFaqAnswer(html: string): FaqAnswerFields {
  if (isEmptyQuillHtml(html)) {
    return {
      answer_html: "",
      answer_text: "",
    };
  }

  return {
    answer_html: html,
    answer_text: htmlToPlainText(html),
  };
}
