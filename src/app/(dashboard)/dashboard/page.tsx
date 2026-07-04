"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useUsers } from "@/hooks/queries/use-users";
import { FolderTree, MapPin, UserCircle, Users } from "lucide-react";

const dashboardCardClassName = "border border-primary ring-0";

function UsersStatCard() {
  const { data, isLoading, isError } = useUsers({ page: 1, limit: 1 });

  return (
    <Card className={dashboardCardClassName}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
        <Users className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-8 w-16" />}
        {isError && (
          <p className="text-destructive text-sm">Could not load user count</p>
        )}
        {data && (
          <p className="text-3xl font-bold">{data.meta?.total ?? 0}</p>
        )}
        <p className="text-muted-foreground mt-1 text-xs">Total users</p>
      </CardContent>
    </Card>
  );
}

const quickLinks = [
  {
    title: "Place Mgmt",
    description: "Manage tour places and locations",
    icon: MapPin,
    href: "/places",
  },
  {
    title: "Category Mgmt",
    description: "Organize categories and groupings",
    icon: FolderTree,
    href: "/categories",
  },
  {
    title: "My Profile",
    description: "Update your staff profile information",
    icon: UserCircle,
    href: "/profile",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Manage users, places, categories, languages, and other mobile app
          content from one internal staff portal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UsersStatCard />
        <Card className={dashboardCardClassName}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Places</CardTitle>
            <CardDescription>Module not connected yet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">—</p>
          </CardContent>
        </Card>
        <Card className={dashboardCardClassName}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <CardDescription>Module not connected yet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">—</p>
          </CardContent>
        </Card>
        <Card className={dashboardCardClassName}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Languages</CardTitle>
            <CardDescription>Module not connected yet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">—</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className={dashboardCardClassName}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <link.icon className="text-muted-foreground size-4" />
                  <CardTitle className="text-base">{link.title}</CardTitle>
                </div>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
