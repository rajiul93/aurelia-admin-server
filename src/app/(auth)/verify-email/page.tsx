import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export const metadata = {
  title: "Verify email",
};

function VerifyEmailFallback() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      title="Verify your email"
      description="Enter the verification code sent to your email to activate your staff account."
    >
      <Suspense fallback={<VerifyEmailFallback />}>
        <VerifyEmailPanel />
      </Suspense>
    </AuthLayout>
  );
}
