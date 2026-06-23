/**
 * Layout for the main authenticated app (all routes inside (app)/).
 * The shell (sidebar + topbar + mobile drawer) is a client component so it
 * can manage the mobile-drawer open state.
 */
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
