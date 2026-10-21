"use client";

import { useState } from "react";
import Link from "next/link";
import { readData } from "@/lib/api";
import styles from "./admin.module.css";

export default function AdminPage() {
  const [counts] = useState(() => ({
    faculty: readData("faculty", []).length,
    students: readData("students", []).length,
    subjects: readData("subjects", []).length,
  }));

  const cards = [
    { label: "Faculty members", value: counts.faculty, icon: "F", tone: "purple" },
    { label: "Students", value: counts.students, icon: "S", tone: "blue" },
    { label: "Subjects", value: counts.subjects, icon: "C", tone: "green" },
  ];

  return (
    <main className="page">
      <div className={`container ${styles.container}`}>
        <header className={styles.welcome}>
          <div>
            <p className={styles.eyebrow}>ATTENDEASE ADMIN</p>
            <h1 className="pageTitle">Admin dashboard</h1>
            <p className="pageDescription">A clear overview of your academic workspace.</p>
          </div>
          <span className={styles.welcomeIcon}>✦</span>
        </header>

        <section className={styles.stats} aria-label="Workspace overview">
          {cards.map((card) => (
            <article className={styles.statCard} key={card.label}>
              <span className={`${styles.statIcon} ${styles[card.tone]}`}>{card.icon}</span>
              <div>
                <p>{card.label}</p>
                <strong>{card.value}</strong>
              </div>
            </article>
          ))}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>Workspace management</h2>
              <p>Choose an area to manage or review.</p>
            </div>
          </div>
          <div className={styles.actions}>
            <Link className={styles.actionCard} href="/admin/faculty">
              <span className={`${styles.actionIcon} ${styles.purple}`}>01</span>
              <span className={styles.actionText}>
                <strong>Manage faculty</strong>
                <small>Add, update, and organize faculty details.</small>
              </span>
              <span className={styles.arrow} aria-hidden="true">→</span>
            </Link>
            <Link className={styles.actionCard} href="/admin/subjects">
              <span className={`${styles.actionIcon} ${styles.blue}`}>02</span>
              <span className={styles.actionText}>
                <strong>Manage subjects</strong>
                <small>Create subjects and assign a faculty member.</small>
              </span>
              <span className={styles.arrow} aria-hidden="true">→</span>
            </Link>
            <Link className={styles.actionCard} href="/admin/accounts">
              <span className={`${styles.actionIcon} ${styles.purple}`}>04</span>
              <span className={styles.actionText}>
                <strong>Manage login accounts</strong>
                <small>Register faculty and student email/password access.</small>
              </span>
              <span className={styles.arrow} aria-hidden="true">→</span>
            </Link>
            <Link className={styles.actionCard} href="/faculty">
              <span className={`${styles.actionIcon} ${styles.green}`}>03</span>
              <span className={styles.actionText}>
                <strong>Faculty workspace</strong>
                <small>Open student, attendance, and reporting tools.</small>
              </span>
              <span className={styles.arrow} aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
