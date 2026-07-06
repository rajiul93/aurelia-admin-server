import type { StaffRole } from "@/types/auth";
import type { LucideIcon } from "lucide-react";
import {
  CircleHelp,
  History,
  ImageIcon,
  KeyRound,
  LayoutDashboard,
  MapPinned,
  Smartphone,
  Tags,
  Type,
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
    title: "Tour Mgmt",
    href: "/tours",
    icon: MapPinned,
    description: "Manage downloadable tour content",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
  },
  {
    title: "Access Mgmt",
    href: "/access",
    icon: KeyRound,
    description: "Grant website buyer tour access",
    roles: ["SUPERADMIN", "ADMIN"],
  },
  {
    title: "Audit log",
    href: "/audit-logs",
    icon: History,
    description: "Staff action history",
    roles: ["SUPERADMIN", "ADMIN"],
  },
  {
    title: "App Content",
    icon: Smartphone,
    description: "CMS UI strings and assets for mobile",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    children: [
      {
        title: "Overview",
        href: "/app-content",
        icon: Smartphone,
        description: "App content versions",
        roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
      },
      {
        title: "UI Strings",
        href: "/app-content/strings",
        icon: Type,
        description: "Titles, buttons, labels",
        roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
      },
      {
        title: "Assets",
        href: "/app-content/assets",
        icon: ImageIcon,
        description: "Images and time-of-day backgrounds",
        roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
      },
    ],
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
