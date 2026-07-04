import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import {
  AuthFooterLink,
  AuthLayout,
} from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { AUTH_ROUTES } from "@/lib/auth/routes";

export const metadata = {
  title: "Sign in",
};

function LoginFormFallback() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Sign in"
      description="Access the internal Aurelia staff dashboard."
      footer={
        <AuthFooterLink
          href={AUTH_ROUTES.register}
          label="Need an account? Register"
        />
      }
    >
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
