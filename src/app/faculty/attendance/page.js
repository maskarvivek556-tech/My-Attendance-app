
"use client";

import { useState } from "react";
import styles from "./attendance.module.css";
import { readData, saveData } from "@/lib/api";

export default function AttendancePage() {
  const [students] = useState(() => readData("students", []));
  const [subjects] = useState(() => readData("subjects", []));
  const [date, setDate] = useState(() => {
    const today = new Date();
    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
  });
  const [subject, setSubject] = useState("");
  const [records, setRecords] = useState({});
  const [message, setMessage] = useState("");

  function loadRecords(nextDate, nextSubject) {
    if (!nextDate || !nextSubject) {
      setRecords({});
      return;
    }

    const all = readData("attendance", []);
    const existing = all.filter(
      (record) => record.date === nextDate && record.subject === nextSubject
    );

    const next = {};
    existing.forEach((record) => {
      next[record.studentId] = record.status;
    });
    setRecords(next);
  }

  function markStatus(studentId, status) {
    setRecords((previous) => ({
      ...previous,
      [studentId]: status,
    }));
  }

  function saveAttendance() {
    if (!date || !subject) {
      setMessage("Select date and subject first.");
      return;
    }

    if (students.length === 0) {
      setMessage("Add students before recording attendance.");
      return;
    }

    const all = readData("attendance", []);
    const keep = all.filter(
      (record) => !(record.date === date && record.subject === subject)
    );

    const newRecords = students.map((student) => ({
      id: `${date}-${subject}-${student.id}`,
      studentId: student.id,
      rollNo: student.rollNo,
      studentName: student.name,
      date,
      subject,
      status: records[student.id] || "Absent",
    }));

    if (!saveData("attendance", [...keep, ...newRecords])) {
      setMessage("Unable to save attendance in this browser. Check storage settings and try again.");
      return;
    }
    setMessage("Attendance saved successfully.");
  }

  return (
    <main className="page">
      <div className={`container ${styles.container}`}>
        <h1 className="pageTitle">Mark Attendance</h1>
        <p className="pageDescription">
          Choose a date and subject, then mark each student.
        </p>

        {message && <p className={styles.message}>{message}</p>}

        <div className={styles.controls}>
          <div className={styles.field}>
            <label htmlFor="date">Attendance date</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                loadRecords(event.target.value, subject);
              }}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="subject">Subject</label>
            <select
              id="subject"
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value);
                loadRecords(date, event.target.value);
              }}
            >
              <option value="">Select subject</option>
              {subjects.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Student</th>
                <th>Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.rollNo}</td>
                  <td>{student.name}</td>
                  <td>
                    <select
                      aria-label={`Attendance for ${student.name}`}
                      value={records[student.id] || "Absent"}
                      onChange={(e) =>
                        markStatus(student.id, e.target.value)
                      }
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                    </select>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={3}>
                    Add students first from Student Management.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {subjects.length === 0 && (
          <p className={styles.emptyHint}>
            No subjects found. Add one from the admin Subjects page first.
          </p>
        )}
        <div className={styles.footer}>
          <span>{students.length} students · {Object.values(records).filter((status) => status === "Present").length} marked present</span>
          <button
            type="button"
            className={styles.saveButton}
            onClick={saveAttendance}
            disabled={students.length === 0 || subjects.length === 0}
          >
            Save Attendance
          </button>
        </div>
      </div>
    </main>
  );
}
