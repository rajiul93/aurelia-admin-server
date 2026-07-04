import Link from "next/link";
import { Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthLayoutProps = {
  children: React.ReactNode;
  title: string;
  description: string;
  footer?: React.ReactNode;
};

export function AuthLayout({
  children,
  title,
  description,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl">
            <Shield className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Aurelia Admin
            </h1>
            <p className="text-muted-foreground text-sm">
              Internal staff portal
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">{children}</CardContent>
        </Card>

        {footer}
      </div>
    </div>
  );
}

export function AuthFooterLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <p className="text-muted-foreground text-center text-sm">
      <Link href={href} className="text-primary font-medium hover:underline">
        {label}
      </Link>
    </p>
  );
}
