import type { Prisma } from "@/generated/prisma/client";
import {
  buildFaqAnswer,
  isEmptyQuillHtml,
  type FaqAnswerFields,
} from "@/modules/faq/faq.answer";

export type QuillContentJson = {
  html: string;
  text: string;
};

export function buildQuillJson(html: string): QuillContentJson {
  const answer = buildFaqAnswer(html);

  return {
    html: answer.answer_html,
    text: answer.answer_text,
  };
}

export function buildQuillJsonValue(html: string): Prisma.InputJsonValue {
  return buildQuillJson(html) as Prisma.InputJsonValue;
}

export function isEmptyQuillContent(html: string) {
  return isEmptyQuillHtml(html);
}

export function buildSpotFaqAnswer(html: string): FaqAnswerFields & {
  answerJson: QuillContentJson;
} {
  const answer = buildFaqAnswer(html);

  return {
    ...answer,
    answerJson: {
      html: answer.answer_html,
      text: answer.answer_text,
    },
  };
}
