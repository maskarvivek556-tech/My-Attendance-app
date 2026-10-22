"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { readData } from "@/lib/api";
import { getCourseSemesters, isSubjectAssignedToFaculty, normalizeCourse } from "@/lib/courses";
import { readSession } from "@/lib/session";
import styles from "./reports.module.css";

const SORT_FIELDS = {
  date: "date",
  rollNo: "rollNo",
  studentName: "studentName",
  course: "course",
  semester: "semester",
  subject: "subject",
  status: "status",
};

export default function ReportsPage() {
  const [allRecords] = useState(() => readData("attendance", []));
  const [subjectCatalog] = useState(() => readData("subjects", []));
  const [facultyMembers] = useState(() => readData("faculty", []));
  const [facultySession] = useState(() => readSession());
  const [filterCourse, setFilterCourse] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "date", direction: "desc" });

  const records = useMemo(() => {
    if (facultySession?.role !== "faculty") return allRecords;
    const assignedFaculty = facultyMembers.find(
      (person) => person.email.toLowerCase() === facultySession.email?.toLowerCase()
    );
    if (!assignedFaculty) return [];
    const assignedSubjects = subjectCatalog.filter(
      (subject) => isSubjectAssignedToFaculty(subject, assignedFaculty)
    );
    return allRecords.filter((record) => assignedSubjects.some((subject) =>
      record.subjectId != null
        ? String(record.subjectId) === String(subject.id)
        : record.subject === subject.name &&
          (!record.course || normalizeCourse(record.course) === normalizeCourse(subject.course)) &&
          (!record.semester || Number(record.semester) === Number(subject.semester))
    ));
  }, [allRecords, facultyMembers, facultySession, subjectCatalog]);

  const subjects = useMemo(
    () => [...new Set(records
      .filter((record) =>
        (!filterCourse || normalizeCourse(record.course) === filterCourse) &&
        (!filterSemester || Number(record.semester) === Number(filterSemester))
      )
      .map((record) => record.subject)
      .filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    [filterCourse, filterSemester, records]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records
      .filter((record) => {
        const matchesSearch = !query || [
          record.studentName,
          record.rollNo,
          record.course,
          record.semester,
          record.subject,
        ]
          .some((value) => String(value ?? "").toLowerCase().includes(query));
        return (
          (!filterDate || record.date === filterDate) &&
          (!filterCourse || normalizeCourse(record.course) === filterCourse) &&
          (!filterSemester || Number(record.semester) === Number(filterSemester)) &&
          (!filterSubject || record.subject === filterSubject) &&
          (!filterStatus || record.status === filterStatus) &&
          matchesSearch
        );
      })
      .sort((a, b) => {
        const left = String(a[SORT_FIELDS[sort.key]] ?? "");
        const right = String(b[SORT_FIELDS[sort.key]] ?? "");
        const comparison = left.localeCompare(right, undefined, {
          numeric: true,
          sensitivity: "base",
        });
        return comparison * (sort.direction === "asc" ? 1 : -1);
      });
  }, [filterCourse, filterDate, filterSemester, filterStatus, filterSubject, records, search, sort]);

  const counts = {
    present: filtered.filter((record) => record.status === "Present").length,
    absent: filtered.filter((record) => record.status === "Absent").length,
    late: filtered.filter((record) => record.status === "Late").length,
  };

  function toggleSort(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function clearFilters() {
    setFilterCourse("");
    setFilterSemester("");
    setFilterDate("");
    setFilterSubject("");
    setFilterStatus("");
    setSearch("");
  }

  function sortHeader(label, key) {
    const active = sort.key === key;
    return (
      <th aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
        <button
          className={styles.sortButton}
          type="button"
          onClick={() => toggleSort(key)}
        >
          {label}
          <span aria-hidden="true">{active ? (sort.direction === "asc" ? " ↑" : " ↓") : " ↕"}</span>
        </button>
      </th>
    );
  }

  return (
    <main className="page">
      <div className={`container ${styles.container}`}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>FACULTY WORKSPACE</p>
            <h1 className="pageTitle">Attendance Reports</h1>
            <p className="pageDescription">
              Search, filter, and sort your saved attendance records.
            </p>
          </div>
          <Link className={styles.backLink} href="/faculty">Back to dashboard</Link>
        </header>

        <section className={styles.filters} aria-label="Filter attendance reports">
          <div className={styles.searchField}>
            <label htmlFor="reportSearch">Search students or subjects</label>
            <input
              id="reportSearch"
              type="search"
              placeholder="Name, roll number, or subject"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="reportCourse">Course</label>
            <select
              id="reportCourse"
              value={filterCourse}
              onChange={(event) => {
                setFilterCourse(event.target.value);
                setFilterSemester("");
                setFilterSubject("");
              }}
            >
              <option value="">All courses</option>
              {["BCA", "BBA", "MCA"].map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="reportSemester">Semester</label>
            <select
              id="reportSemester"
              value={filterSemester}
              disabled={!filterCourse}
              onChange={(event) => {
                setFilterSemester(event.target.value);
                setFilterSubject("");
              }}
            >
              <option value="">All semesters</option>
              {getCourseSemesters(filterCourse).map((semester) => (
                <option key={semester} value={semester}>Semester {semester}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="reportDate">Attendance date</label>
            <input
              id="reportDate"
              type="date"
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="reportSubject">Subject</label>
            <select
              id="reportSubject"
              value={filterSubject}
              onChange={(event) => setFilterSubject(event.target.value)}
            >
              <option value="">All subjects</option>
              {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="reportStatus">Status</label>
            <select
              id="reportStatus"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>
          <button className={styles.clearButton} type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </section>

        <section className={styles.stats} aria-label="Filtered attendance summary">
          <article className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.totalIcon}`} aria-hidden="true">#</span>
            <div><p>Records</p><strong>{filtered.length}</strong></div>
          </article>
          <article className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.presentIcon}`} aria-hidden="true">✓</span>
            <div><p>Present</p><strong>{counts.present}</strong></div>
          </article>
          <article className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.absentIcon}`} aria-hidden="true">×</span>
            <div><p>Absent</p><strong>{counts.absent}</strong></div>
          </article>
          <article className={styles.statCard}>
            <span className={`${styles.statIcon} ${styles.lateIcon}`} aria-hidden="true">◷</span>
            <div><p>Late</p><strong>{counts.late}</strong></div>
          </article>
        </section>

        <section className={styles.tableCard} aria-label="Attendance records">
          <div className={styles.tableHeading}>
            <div>
              <h2>Attendance records</h2>
              <p>{filtered.length} {filtered.length === 1 ? "record" : "records"} shown</p>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {sortHeader("Date", "date")}
                  {sortHeader("Roll No.", "rollNo")}
                  {sortHeader("Student", "studentName")}
                  {sortHeader("Course", "course")}
                  {sortHeader("Semester", "semester")}
                  {sortHeader("Subject", "subject")}
                  {sortHeader("Status", "status")}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <tr key={record.id}>
                    <td>{record.date}</td>
                    <td>{record.rollNo || "—"}</td>
                    <td className={styles.studentName}>{record.studentName || "—"}</td>
                    <td>{record.course || "—"}</td>
                    <td>{record.semester ? `Semester ${record.semester}` : "—"}</td>
                    <td>{record.subject || "—"}</td>
                    <td>
                      <span className={`${styles.status} ${styles[`status${record.status}`] || ""}`}>
                        {record.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className={styles.emptyState} colSpan={7}>
                      {records.length === 0
                        ? "No attendance records yet. Save attendance to see reports here."
                        : "No records match these filters. Try changing or clearing your filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
