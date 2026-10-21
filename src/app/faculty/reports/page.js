
"use client";

import { useState } from "react";
import Link from "next/link";
import { readData } from "@/lib/api";

export default function ReportsPage() {
  const [records] = useState(() => readData("attendance", []));
  const [filterDate, setFilterDate] = useState("");

  const filtered = records.filter(
    (record) => !filterDate || record.date === filterDate
  );

  const present = filtered.filter(
    (record) => record.status === "Present"
  ).length;

  const absent = filtered.filter(
    (record) => record.status === "Absent"
  ).length;

  return (
    <main className="page">
      <div className="container">
        <h1 className="pageTitle">Attendance Reports</h1>
        <p className="pageDescription">
          Review saved attendance by date.
        </p>

        <div className="card">
          <label htmlFor="reportDate">Filter by date: </label>
          <input
            id="reportDate"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginTop: 20,
            }}
          >
            <p><strong>Total records:</strong> {filtered.length}</p>
            <p><strong>Present:</strong> {present}</p>
            <p><strong>Absent:</strong> {absent}</p>
          </div>
        </div>

        <div className="card" style={{ marginTop: 20, overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Date</th>
                <th align="left">Roll No.</th>
                <th align="left">Student</th>
                <th align="left">Subject</th>
                <th align="left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td>{record.rollNo}</td>
                  <td>{record.studentName}</td>
                  <td>{record.subject}</td>
                  <td>{record.status}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5}>No attendance records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 20 }}>
          <Link href="/faculty">Back to Faculty Dashboard</Link>
        </p>
      </div>
    </main>
  );
}
