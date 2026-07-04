import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileUpdateForm } from "@/components/profile/profile-update-form";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Profile Management
        </h1>
        <p className="text-muted-foreground text-sm">
          View and update your staff account details.
        </p>
      </div>

      <Card className="max-w-lg border border-primary ring-0">
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            Update your display name. Email and role are managed by an
            administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileUpdateForm />
        </CardContent>
      </Card>
    </div>
  );
}
