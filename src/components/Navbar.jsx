
"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  clearSession,
  dashboardForRole,
  getSessionSnapshot,
  parseSession,
  subscribeToSession,
} from "@/lib/session";
import useHydrated from "@/lib/useHydrated";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [menuOpenPath, setMenuOpenPath] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const sessionSnapshot = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    () => null
  );
  const session = useMemo(() => parseSession(sessionSnapshot), [sessionSnapshot]);
  const menuOpen = menuOpenPath === pathname;

  const links = session?.role === "admin"
    ? [
        { name: "Dashboard", href: "/admin" },
        { name: "Faculty", href: "/admin/faculty" },
        { name: "Subjects", href: "/admin/subjects" },
      { name: "Accounts", href: "/admin/accounts" },
    ]
    : session?.role === "student"
      ? [{ name: "My Attendance", href: "/students" }]
      : [
          { name: "Dashboard", href: "/faculty" },
          { name: "Students", href: "/faculty/students" },
          { name: "Attendance", href: "/faculty/attendance" },
          { name: "Reports", href: "/faculty/reports" },
        ];

  function logout() {
    if (!clearSession()) {
      return;
    }

    router.replace("/login");
  }

  return (
    <header className={styles.header}>
      <Link href={session ? dashboardForRole(session.role) : "/login"} className={styles.logo}>
        <span className={styles.logoIcon}>A</span>
        <span>Attend<span className={styles.logoAccent}>Ease</span></span>
      </Link>

      {hydrated && session && (
        <button
          className={styles.menuButton}
          onClick={() => setMenuOpenPath(menuOpen ? null : pathname)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          type="button"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      )}

      {hydrated && session && (
        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpenPath(null)}
              className={`${styles.navLink} ${
                pathname === link.href ? styles.active : ""
              }`}
            >
              {link.name}
            </Link>
          ))}
          <span className={styles.userName}>{session.name}</span>
          <button className={styles.logoutButton} onClick={logout} type="button">
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}
