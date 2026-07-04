"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, Shield } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useLogout } from "@/hooks/auth/use-logout";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { getNavItemsForRole, type NavItem } from "@/utils/navigation";

function matchesPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Prefer the longest matching href so `/faqs/categories` does not also activate `/faqs`. */
function getActiveHref(pathname: string, hrefs: Array<string | undefined>) {
  return (
    hrefs
      .filter((href): href is string => Boolean(href))
      .filter((href) => matchesPath(pathname, href))
      .sort((a, b) => b.length - a.length)[0] ?? null
  );
}

function isPathActive(pathname: string, href?: string) {
  if (!href) {
    return false;
  }

  return matchesPath(pathname, href);
}

function NavItemWithChildren({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const children = item.children ?? [];
  const childHrefs = children.map((child) => child.href);
  const activeChildHref = getActiveHref(pathname, childHrefs);
  const childActive = Boolean(activeChildHref);
  const [open, setOpen] = useState(childActive);
  const isIconCollapsed = state === "collapsed" && !isMobile;

  if (isIconCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                tooltip={item.title}
                isActive={childActive}
                className={cn(
                  childActive &&
                    "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground data-active:bg-primary data-active:text-primary-foreground [&_svg]:text-primary-foreground",
                )}
              />
            }
          >
            <item.icon />
            <span>{item.title}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="min-w-44">
            {children.map((child) => {
              const active = child.href === activeChildHref;

              return (
                <DropdownMenuItem
                  key={child.href}
                  render={<Link href={child.href ?? "#"} />}
                  className={cn(active && "bg-accent")}
                >
                  <child.icon />
                  {child.title}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={childActive}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          childActive &&
            "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground data-active:bg-primary data-active:text-primary-foreground [&_svg]:text-primary-foreground",
        )}
      >
        <item.icon />
        <span>{item.title}</span>
        <ChevronRight
          className={cn(
            "ml-auto transition-transform",
            open && "rotate-90",
          )}
        />
      </SidebarMenuButton>
      {open ? (
        <SidebarMenuSub>
          {children.map((child) => {
            const active = child.href === activeChildHref;

            return (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton
                  isActive={active}
                  render={<Link href={child.href ?? "#"} />}
                  className={cn(
                    active &&
                      "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground data-active:bg-primary data-active:text-primary-foreground [&_svg]:text-primary-foreground",
                  )}
                >
                  <child.icon />
                  <span>{child.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const navItems = getNavItemsForRole(user?.role ?? null);
  const { logout, isLoggingOut } = useLogout();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Shield className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Aurelia Admin</span>
                <span className="text-muted-foreground truncate text-xs">
                  Internal Staff Portal
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                if (item.children?.length) {
                  return (
                    <NavItemWithChildren
                      key={item.title}
                      item={item}
                    />
                  );
                }

                const isActive = isPathActive(pathname, item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={item.href ?? "#"} />}
                      className={cn(
                        isActive &&
                          "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground data-active:bg-primary data-active:text-primary-foreground [&_svg]:text-primary-foreground",
                      )}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {user ? (
            <SidebarMenuItem>
              <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {user.role}
                </Badge>
              </div>
            </SidebarMenuItem>
          ) : null}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              disabled={isLoggingOut}
              onClick={() => void logout()}
            >
              <LogOut />
              <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
