"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getSessionSnapshot,
  parseSession,
  subscribeToSession,
} from "@/lib/session";
import { readData, subscribeToData } from "@/lib/api";
import useHydrated from "@/lib/useHydrated";
import styles from "./Sidebar.module.css";

const linksByRole = {
  admin: [
    { label: "Dashboard", href: "/admin" },
    { label: "Faculty", href: "/admin/faculty" },
    { label: "Subjects", href: "/admin/subjects" },
    { label: "Accounts", href: "/admin/accounts" },
    { label: "Attendance requests", href: "/admin/attendance-requests" },
  ],
  faculty: [
    { label: "Dashboard", href: "/faculty" },
    { label: "Students", href: "/faculty/students" },
    { label: "Attendance", href: "/faculty/attendance" },
    { label: "Reports", href: "/faculty/reports" },
  ],
  student: [{ label: "My Attendance", href: "/students" }],
};

export default function Sidebar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const sessionSnapshot = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    () => null
  );
  const session = useMemo(() => parseSession(sessionSnapshot), [sessionSnapshot]);
  const links = linksByRole[session?.role] || [];

  useEffect(() => {
    if (session?.role !== "admin") {
      return undefined;
    }

    function refreshPendingCount() {
      setPendingRequestCount(
        readData("attendanceChangeRequests", []).filter((request) => request.status === "Pending").length
      );
    }

    refreshPendingCount();
    return subscribeToData("attendanceChangeRequests", refreshPendingCount);
  }, [session?.role]);

  if (!hydrated || !session || pathname === "/" || pathname === "/login") {
    return null;
  }

  return (
    <aside className={styles.sidebar}>
      <button
        type="button"
        className={styles.mobileToggle}
        aria-expanded={mobileOpen}
        aria-controls="workspace-navigation"
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span>Workspace menu</span>
        <span aria-hidden="true">{mobileOpen ? "−" : "+"}</span>
      </button>
      <nav
        id="workspace-navigation"
        className={`${styles.nav} ${mobileOpen ? styles.navOpen : ""}`}
        aria-label="Workspace"
      >
        {links.map((link) => {
          const active = pathname === link.href ||
            (link.href !== "/admin" && link.href !== "/faculty" && pathname.startsWith(`${link.href}/`));
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
              className={`${styles.link} ${active ? styles.active : ""}`}
            >
              <span>{link.label}</span>
              {link.href === "/admin/attendance-requests" && pendingRequestCount > 0 && (
                <span className={styles.badge} aria-label={`${pendingRequestCount} pending requests`}>
                  {pendingRequestCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
