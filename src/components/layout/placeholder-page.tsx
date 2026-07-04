import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PlaceholderPageProps = {
  title: string;
  description: string;
  badge?: string;
};

export function PlaceholderPage({
  title,
  description,
  badge = "Coming soon",
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <Badge variant="secondary">{badge}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Module scaffold</CardTitle>
            <CardDescription>
              This page is ready for tables, forms, and API integration.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Add your service, query hooks, and UI components here without
            changing the shared dashboard layout.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff only</CardTitle>
            <CardDescription>
              Super Admin, Admin, and Manager access.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Customer-facing pages are not part of this dashboard. End users
            interact through the mobile app.
          </CardContent>
        </Card>

        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Next steps</CardTitle>
            <CardDescription>Extend this module when ready.</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm">
            <p>1. Create a service in `services/`</p>
            <p>2. Add query/mutation hooks in `hooks/`</p>
            <p>3. Build the page UI with shadcn components</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
