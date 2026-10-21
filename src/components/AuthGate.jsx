"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  dashboardForRole,
  getSessionSnapshot,
  parseSession,
  subscribeToSession,
} from "@/lib/session";
import { readAccounts } from "@/lib/auth";
import useHydrated from "@/lib/useHydrated";

export default function AuthGate({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const sessionSnapshot = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    () => null
  );
  const session = useMemo(() => parseSession(sessionSnapshot), [sessionSnapshot]);
  const account = session
    ? readAccounts().find(
        (item) => item.id === session.id && item.email === session.email &&
          item.role === session.role
      )
    : null;
  const allowed =
    account &&
    (account.role === "admin" ||
      (account.role === "faculty" && pathname.startsWith("/faculty")) ||
      (account.role === "student" && pathname === "/students"));

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (pathname === "/") {
      router.replace(
        allowed ? dashboardForRole(session.role) : "/login"
      );
    } else if (pathname === "/login" && allowed) {
      router.replace(dashboardForRole(session.role));
    } else if (pathname !== "/login" && !allowed) {
      router.replace("/login");
    }
  }, [allowed, hydrated, pathname, router, session]);

  if (!hydrated || pathname === "/") {
    return (
      <main className="page appLoading" aria-live="polite">
        <p>Loading your workspace…</p>
      </main>
    );
  }

  if (pathname !== "/login" && !allowed) {
    return null;
  }

  if (pathname === "/login" && allowed) {
    return null;
  }

  return children;
}
