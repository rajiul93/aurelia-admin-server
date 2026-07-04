"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { AUTH_ROUTES } from "@/lib/auth/routes";

export function VerifyEmailPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const token = searchParams.get("token");

  const [emailDraft, setEmailDraft] = useState("");
  const email = emailDraft || emailParam;
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVerifyingLink, setIsVerifyingLink] = useState(Boolean(token));
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    async function verifyWithLink() {
      if (!token) {
        return;
      }

      setIsVerifyingLink(true);
      setError(null);

      try {
        const response = await authClient.verifyEmail({
          query: {
            token,
            callbackURL: AUTH_ROUTES.login,
          },
        });

        if (response.error) {
          setError(response.error.message ?? "Unable to verify email.");
          return;
        }

        setSuccess("Email verified successfully. You can now sign in.");
        router.replace(AUTH_ROUTES.login);
      } catch {
        setError("Unable to verify your email. The link may have expired.");
      } finally {
        setIsVerifyingLink(false);
      }
    }

    void verifyWithLink();
  }, [router, token]);

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    if (!otp.trim()) {
      setError("Enter the verification code from your email.");
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const response = await authClient.emailOtp.verifyEmail({
        email: email.trim(),
        otp: otp.trim(),
      });

      if (response.error) {
        setError(response.error.message ?? "Invalid or expired verification code.");
        return;
      }

      setSuccess("Email verified successfully. You can now sign in.");
      router.replace(AUTH_ROUTES.login);
    } catch {
      setError("Unable to verify the code. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function handleResendOtp() {
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "email-verification",
      });

      if (response.error) {
        setError(response.error.message ?? "Unable to resend verification code.");
        return;
      }

      setSuccess("A new verification code has been sent to your email.");
    } catch {
      setError("Unable to resend verification code.");
    } finally {
      setIsResending(false);
    }
  }

  if (isVerifyingLink) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Verifying your email...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AuthMessage error={error} success={success} />

      <p className="text-muted-foreground text-sm">
        Enter the verification code sent to your email. You can also open the
        verification link if you received one.
      </p>

      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmailDraft(event.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp">Verification code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            placeholder="123456"
            maxLength={8}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isVerifyingOtp || !email.trim() || !otp.trim()}
        >
          {isVerifyingOtp ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify email"
          )}
        </Button>
      </form>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isResending || !email.trim()}
        onClick={handleResendOtp}
      >
        {isResending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Sending code...
          </>
        ) : (
          "Resend verification code"
        )}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        <Link href={AUTH_ROUTES.login} className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
