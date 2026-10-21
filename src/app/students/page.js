
"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import styles from "./student.module.css";
import { readData } from "@/lib/api";
import {
  getSessionSnapshot,
  parseSession,
  subscribeToSession,
} from "@/lib/session";

export default function StudentPage() {
  const [students] = useState(() => readData("students", []));
  const [records] = useState(() => readData("attendance", []));
  const sessionSnapshot = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    () => null
  );
  const session = useMemo(() => parseSession(sessionSnapshot), [sessionSnapshot]);
  const rollNo = session?.rollNo || "";

  const student = students.find(
    (item) =>
      item.rollNo.toLowerCase() === rollNo.toLowerCase() &&
      item.email.toLowerCase() === session?.email
  );

  const ownRecords = student
    ? records.filter((record) => record.studentId === student.id)
    : [];

  const present = ownRecords.filter(
    (record) => record.status === "Present"
  ).length;

  const percentage =
    ownRecords.length > 0
      ? Math.round((present / ownRecords.length) * 100)
      : 0;

  return (
    <main className="page">
      <div className={`container ${styles.container}`}>
        <h1 className="pageTitle">Student Portal</h1>
        <p className="pageDescription">
          Your attendance summary and academic records.
        </p>

        {student && (
          <>
            <section className={styles.profile} style={{ marginTop: 22 }}>
              <h2>Student Details</h2>
              <div className={styles.details}>
                <div className={styles.detail}>
                  <span className={styles.label}>Name</span>
                  <span className={styles.value}>{student.name}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.label}>Roll Number</span>
                  <span className={styles.value}>{student.rollNo}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.label}>Email</span>
                  <span className={styles.value}>{student.email}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.label}>Course</span>
                  <span className={styles.value}>{student.course}</span>
                </div>
              </div>
            </section>

            <section className={styles.summary}>
              <div className={styles.summaryCard}>
                <p>Total Records</p>
                <strong>{ownRecords.length}</strong>
              </div>
              <div className={styles.summaryCard}>
                <p>Present</p>
                <strong>{present}</strong>
              </div>
              <div className={styles.summaryCard}>
                <p>Attendance</p>
                <strong>{percentage}%</strong>
              </div>
            </section>

            <div className="card" style={{ overflowX: "auto" }}>
              <h2>Attendance History</h2>
              <table style={{ width: "100%", minWidth: 440, marginTop: 12 }}>
                <thead>
                  <tr>
                    <th align="left">Date</th>
                    <th align="left">Subject</th>
                    <th align="left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ownRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.date}</td>
                      <td>{record.subject}</td>
                      <td>{record.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!student && (
          <p className={styles.notFound}>
            No student record is linked to this registered account. Ask your
            administrator to check the student email and roll number.
          </p>
        )}
      </div>
    </main>
  );
}
