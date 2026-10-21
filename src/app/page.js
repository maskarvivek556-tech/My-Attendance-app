
import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className="page">
      <section className={`container ${styles.hero}`}>
        <div className={styles.content}>
          <span className={styles.tag}>
            ATTENDANCE MANAGEMENT SYSTEM
          </span>

          <h1>
            Smart Attendance.
            <br />
            <span>Simple Management.</span>
          </h1>

          <p>
            Manage faculty, students, subjects and attendance
            from one simple and responsive dashboard.
          </p>

          <div className={styles.actions}>
            <Link href="/login" className={styles.primaryButton}>
              Get Started
            </Link>

            <Link href="/admin" className={styles.secondaryButton}>
              Admin Dashboard
            </Link>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.icon}>✓</div>
          <h2>Attendance Made Easy</h2>
          <p>Manage your academic records in one place.</p>
          <div className={styles.stat}>
            <span>Student Attendance</span>
            <strong>Track Daily</strong>
          </div>
          <div className={styles.stat}>
            <span>Faculty Management</span>
            <strong>Organized</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
