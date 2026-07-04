import {
  AuthFooterLink,
  AuthLayout,
} from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { AUTH_ROUTES } from "@/lib/auth/routes";

export const metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create staff account"
      description="Register with your work email. Email verification is required."
      footer={
        <AuthFooterLink
          href={AUTH_ROUTES.login}
          label="Already registered? Sign in"
        />
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
