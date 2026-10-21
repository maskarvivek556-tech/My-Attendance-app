
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const links = [
  { label: "Dashboard", href: "/faculty" },
  { label: "Students", href: "/faculty/students" },
  { label: "Attendance", href: "/faculty/attendance" },
  { label: "Reports", href: "/faculty/reports" },
  { label: "Admin", href: "/admin" },
  { label: "Subjects", href: "/admin/subjects" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.title}>AttendEase</h2>

      <nav className={styles.nav}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.link} ${
              pathname === link.href ? styles.active : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
