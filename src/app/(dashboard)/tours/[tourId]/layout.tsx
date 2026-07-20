import type { ReactNode } from "react";
import { TourWorkspaceShell } from "@/components/tours/tour-workspace-shell";

export default function TourIdLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <TourWorkspaceShell>{children}</TourWorkspaceShell>;
}
