import { Resend } from "resend";

import { isOtpEmailConfigured } from "./config";

type SendOtpEmailInput = {
  to: string;
  code: string;
  expiresInMinutes: number;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  return new Resend(apiKey);
}

export async function sendOtpEmail({
  to,
  code,
  expiresInMinutes,
}: SendOtpEmailInput) {
  const from = process.env.OTP_EMAIL_FROM?.trim();

  if (!isOtpEmailConfigured() || !from) {
    throw new Error("OTP email sender is not configured");
  }

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Your Aurelia sign-in code",
    text: [
      "Use this code to sign in to the Aurelia app:",
      "",
      code,
      "",
      `This code expires in ${expiresInMinutes} minutes.`,
      "If you did not request this code, you can ignore this email.",
    ].join("\n"),
    html: `
      <p>Use this code to sign in to the Aurelia app:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.2em; margin: 24px 0; color: #810b38;">
        ${code}
      </p>
      <p>This code expires in ${expiresInMinutes} minutes.</p>
      <p style="color: #541a1a;">If you did not request this code, you can ignore this email.</p>
    `.trim(),
  });

  if (error) {
    throw new Error(error.message);
  }
}
