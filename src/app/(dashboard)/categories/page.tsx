import { RoleGate } from "@/components/auth/role-gate";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function CategoriesPage() {
  return (
    <RoleGate pathname="/categories">
      <PlaceholderPage
        title="Category Management"
        description="Manage categories used across places and content."
        badge="Admin access"
      />
    </RoleGate>
  );
}
