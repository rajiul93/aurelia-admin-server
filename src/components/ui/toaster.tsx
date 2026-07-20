"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useUiStore } from "@/store/ui-store";

/**
 * Sonner reads its own `theme`, but this app drives dark mode from useUiStore
 * (ThemeProvider toggles the `dark` class), so the two have to be wired
 * together or toasts stay light while the rest of the dashboard goes dark.
 */
export function Toaster() {
  const theme = useUiStore((state) => state.theme);

  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "font-sans",
        },
      }}
    />
  );
}
