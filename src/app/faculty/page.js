
"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./faculty.module.css";
import { readData } from "@/lib/api";

export default function FacultyPage() {
  const [summary] = useState(() => {
    const attendance = readData("attendance", []);
    return {
      students: readData("students", []).length,
      attendance: attendance.length,
      reports: new Set(attendance.map((record) => record.date)).size,
    };
  });

  const stats = [
    {
      label: "Students",
      value: summary.students,
      hint: "In your workspace",
      secondaryIcon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0M17 8h4m-2-2v4" />
        </svg>
      ),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="10" cy="7" r="4" />
          <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Attendance records",
      value: summary.attendance,
      hint: "Saved locally",
      secondaryIcon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M8 4H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M8 12h8m-8 4h5" />
        </svg>
      ),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4.5h6M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: "Report dates",
      value: summary.reports,
      hint: "With attendance",
      secondaryIcon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M4 20V10m5 10V4m5 16v-7m5 7V7" />
          <path d="M2 20h20" />
        </svg>
      ),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18m-13 4h2m4 0h2m-8 4h2" />
        </svg>
      ),
    },
  ];

  const actions = [
    {
      title: "Manage Students",
      description: "Add, update and view student records.",
      href: "/faculty/students",
      label: "Open Students",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0M17 8h4m-2-2v4" />
        </svg>
      ),
    },
    {
      title: "Mark Attendance",
      description: "Record present or absent for each student.",
      href: "/faculty/attendance",
      label: "Mark Attendance",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8m-8 4h3m2 1 1.5 1.5L19 11" />
        </svg>
      ),
    },
    {
      title: "Attendance Reports",
      description: "Review attendance records and dates.",
      href: "/faculty/reports",
      label: "View Reports",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M4 19V5m0 14h17" />
          <path d="m7 15 4-4 3 2 5-6" />
          <path d="M16 7h3v3" />
        </svg>
      ),
    },
  ];

  return (
    <main className="page">
      <div className={`container ${styles.container}`}>
        <header className={styles.header}>
  <div className={styles.headerContent}>
    <p className={styles.eyebrow}>FACULTY WORKSPACE</p>
    <h1>Faculty Dashboard</h1>
    <p>Manage your students and daily attendance.</p>
  </div>

  <div className={styles.headerRight}>
    <nav className={styles.headerShortcuts} aria-label="Faculty shortcuts">
      <Link
        href="/faculty/students"
        className={styles.shortcut}
        title="Manage Students"
        aria-label="Manage Students"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true">
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0M17 8h4m-2-2v4" />
        </svg>
        <span>Students</span>
      </Link>

      <Link
        href="/faculty/attendance"
        className={styles.shortcut}
        title="Mark Attendance"
        aria-label="Mark Attendance"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8m-8 4h3m2 1 1.5 1.5L19 11" />
        </svg>
        <span>Attendance</span>
      </Link>

      <Link
        href="/faculty/reports"
        className={styles.shortcut}
        title="Attendance Reports"
        aria-label="Attendance Reports"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true">
          <path d="M4 19V5m0 14h17" />
          <path d="m7 15 4-4 3 2 5-6" />
          <path d="M16 7h3v3" />
        </svg>
        <span>Reports</span>
      </Link>
    </nav>

    <span className={styles.welcomeIcon}>✓</span>
  </div>
</header>

        <section className={styles.stats} aria-label="Attendance overview">
          {stats.map((stat, index) => (
            <article className={styles.statCard} key={stat.label}>
              <div className={styles.statInfo}>
                <span className={`${styles.statSideIcon} ${styles[`tone${index}`]}`}>
                  {stat.secondaryIcon}
                </span>
                <div>
                  <p>{stat.label}</p>
                  <strong>{stat.value}</strong>
                  <small>{stat.hint}</small>
                </div>
              </div>
              <span className={`${styles.statIcon} ${styles[`tone${index}`]}`}>
                {stat.icon}
              </span>
            </article>
          ))}
        </section>

        <div className={styles.sectionTitle}>
          <h2>Quick actions</h2>
          <p>Jump straight into the tasks you use every day.</p>
        </div>
        <section className={styles.actions}>
          {actions.map((action) => (
            <article className={styles.actionCard} key={action.href}>
              <span className={styles.actionMark}>
                {action.icon}
              </span>
              <h2>{action.title}</h2>
              <p>{action.description}</p>
              <Link href={action.href} className={styles.actionLink}>
                {action.label} <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
