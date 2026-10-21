
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
    { label: "Students", value: summary.students, hint: "In your workspace" },
    { label: "Attendance records", value: summary.attendance, hint: "Saved locally" },
    { label: "Report dates", value: summary.reports, hint: "With attendance" },
  ];

  const actions = [
    {
      title: "Manage Students",
      description: "Add, update and view student records.",
      href: "/faculty/students",
      label: "Open Students",
    },
    {
      title: "Mark Attendance",
      description: "Record present or absent for each student.",
      href: "/faculty/attendance",
      label: "Mark Attendance",
    },
    {
      title: "Attendance Reports",
      description: "Review attendance records and dates.",
      href: "/faculty/reports",
      label: "View Reports",
    },
  ];

  return (
    <main className="page">
      <div className={`container ${styles.container}`}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>FACULTY WORKSPACE</p>
            <h1>Faculty Dashboard</h1>
            <p>Manage your students and daily attendance.</p>
          </div>
          <span className={styles.welcomeIcon}>✓</span>
        </header>

        <section className={styles.stats} aria-label="Attendance overview">
          {stats.map((stat, index) => (
            <article className={styles.statCard} key={stat.label}>
              <span className={`${styles.statIcon} ${styles[`tone${index}`]}`}>
                {["S", "A", "R"][index]}
              </span>
              <div>
                <p>{stat.label}</p>
                <strong>{stat.value}</strong>
                <small>{stat.hint}</small>
              </div>
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
              <span className={styles.actionMark} aria-hidden="true">✦</span>
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
