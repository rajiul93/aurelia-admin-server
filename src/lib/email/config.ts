export function isOtpEmailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.OTP_EMAIL_FROM?.trim(),
  );
}
