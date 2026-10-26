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
    { label: "Dashboard", href: "/admin", icon: "▦" },
    { label: "Faculty", href: "/admin/faculty", icon: "♙" },
    { label: "Subjects", href: "/admin/subjects", icon: "▤" },
    { label: "Accounts", href: "/admin/accounts", icon: "◎" },
    {
      label: "Attendance Requests",
      href: "/admin/attendance-requests",
      icon: "◷",
    },
  ],
  faculty: [
    { label: "Dashboard", href: "/faculty", icon: "▦" },
    { label: "Students", href: "/faculty/students", icon: "♙" },
    { label: "Attendance", href: "/faculty/attendance", icon: "✓" },
    { label: "Reports", href: "/faculty/reports", icon: "▥" },
  ],
  student: [
    { label: "My Attendance", href: "/students", icon: "✓" },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const hydrated = useHydrated();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  const sessionSnapshot = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    () => null
  );

  const session = useMemo(
    () => parseSession(sessionSnapshot),
    [sessionSnapshot]
  );

  const links = linksByRole[session?.role] || [];

  useEffect(() => {
    if (session?.role !== "admin") {
      return undefined;
    }

    function refreshPendingCount() {
      setPendingRequestCount(
        readData("attendanceChangeRequests", []).filter(
          (request) => request.status === "Pending"
        ).length
      );
    }

    refreshPendingCount();

    return subscribeToData(
      "attendanceChangeRequests",
      refreshPendingCount
    );
  }, [session?.role]);

  if (
    !hydrated ||
    !session ||
    pathname === "/" ||
    pathname === "/login"
  ) {
    return null;
  }

  return (
    <aside
      className={`${styles.sidebar} ${
        collapsed ? styles.collapsed : ""
      }`}
    >
      <button
        type="button"
        className={styles.collapseToggle}
        onClick={() => setCollapsed((prev) => !prev)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? "→" : "←"}
      </button>

    
      {!collapsed && (
        <div className={styles.sectionLabel}>WORKSPACE</div>
      )}

      <button
        type="button"
        className={styles.mobileToggle}
        aria-expanded={mobileOpen}
        aria-controls="workspace-navigation"
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span>Workspace Menu</span>
        <span aria-hidden="true">
          {mobileOpen ? "−" : "+"}
        </span>
      </button>

      <nav
        id="workspace-navigation"
        className={`${styles.nav} ${
          mobileOpen ? styles.navOpen : ""
        }`}
        aria-label="Workspace"
      >
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/admin" &&
              link.href !== "/faculty" &&
              pathname.startsWith(`${link.href}/`));

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
              className={`${styles.link} ${
                active ? styles.active : ""
              }`}
              title={collapsed ? link.label : undefined}
            >
              <span className={styles.linkContent}>
                <span className={styles.icon} aria-hidden="true">
                  {link.icon}
                </span>

                {!collapsed && (
                  <span className={styles.linkLabel}>
                    {link.label}
                  </span>
                )}
              </span>

              {!collapsed &&
                link.href === "/admin/attendance-requests" &&
                pendingRequestCount > 0 && (
                  <span
                    className={styles.badge}
                    aria-label={`${pendingRequestCount} pending requests`}
                  >
                    {pendingRequestCount}
                  </span>
                )}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className={styles.sidebarFooter}>
          <span className={styles.statusDot} />
          <span>System Workspace</span>
        </div>
      )}
    </aside>
  );
}