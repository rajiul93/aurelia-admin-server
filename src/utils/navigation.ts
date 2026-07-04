import type { StaffRole } from "@/types/auth";
import type { LucideIcon } from "lucide-react";
import {
  CircleHelp,
  FolderTree,
  Languages,
  LayoutDashboard,
  MapPin,
  Tags,
  UserCircle,
} from "lucide-react";

export type NavItem = {
  title: string;
  href?: string;
  icon: LucideIcon;
  description?: string;
  roles: StaffRole[];
  children?: NavItem[];
};

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview and quick stats",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "Place Mgmt",
    href: "/places",
    icon: MapPin,
    description: "Manage places and locations",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "Category Mgmt",
    href: "/categories",
    icon: FolderTree,
    description: "Organize content categories",
    roles: ["SUPERADMIN", "ADMIN"],
  },
  {
    title: "Language Mgmt",
    href: "/languages",
    icon: Languages,
    description: "Manage supported languages",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "Profile",
    href: "/profile",
    icon: UserCircle,
    description: "Manage your staff profile",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "FAQ Management",
    icon: CircleHelp,
    description: "Manage FAQs and categories",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    children: [
      {
        title: "FAQs",
        href: "/faqs",
        icon: CircleHelp,
        description: "Create and edit FAQ entries",
        roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
      },
      {
        title: "Categories",
        href: "/faqs/categories",
        icon: Tags,
        description: "Create and edit FAQ categories",
        roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
      },
    ],
  },
];

export function getNavItemsForRole(role: StaffRole | null) {
  if (!role) {
    return [];
  }

  return mainNavItems
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => child.roles.includes(role)),
    }));
}

function flattenNavItems(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => [
    item,
    ...(item.children ? flattenNavItems(item.children) : []),
  ]);
}

export function getPageTitle(pathname: string): string {
  const items = flattenNavItems(mainNavItems);
  const item = items.find(
    (nav) =>
      nav.href &&
      (nav.href === pathname || pathname.startsWith(`${nav.href}/`)),
  );

  // Prefer the most specific match (longest href).
  const matches = items
    .filter(
      (nav) =>
        nav.href &&
        (nav.href === pathname || pathname.startsWith(`${nav.href}/`)),
    )
    .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0));

  return matches[0]?.title ?? item?.title ?? "Admin";
}
