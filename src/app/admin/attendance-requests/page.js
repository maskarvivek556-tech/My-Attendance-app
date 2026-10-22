"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { readData, saveData, subscribeToData } from "@/lib/api";
import { readSession } from "@/lib/session";
import styles from "./requests.module.css";

export default function AttendanceRequestsPage() {
  const [requests, setRequests] = useState(() => readData("attendanceChangeRequests", []));
  const [decisions, setDecisions] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    function refreshRequests() {
      setRequests(readData("attendanceChangeRequests", []));
    }

    refreshRequests();
    return subscribeToData("attendanceChangeRequests", refreshRequests);
  }, []);

  const sortedRequests = [...requests].sort(
    (left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || ""))
  );

  function reviewRequest(request, decision) {
    const reviewedAt = new Date().toISOString();
    const reviewer = readSession();
    let originalAttendance = null;
    const updatedRequests = requests.map((item) =>
      item.id === request.id
        ? {
            ...item,
            status: decision,
            reviewedAt,
            reviewedBy: reviewer?.name || "Admin",
            finalStatus: decision === "Approved"
              ? decisions[request.id] || request.requestedStatus
              : null,
          }
        : item
    );

    let updatedAttendance;
    if (decision === "Approved") {
      const finalStatus = decisions[request.id] || request.requestedStatus;
      const allAttendance = readData("attendance", []);
      originalAttendance = allAttendance;
      const matchesRequestScope = (record) =>
        record.studentId === request.studentId &&
        record.date === request.date &&
        (request.subjectId != null
          ? String(record.subjectId) === String(request.subjectId) &&
            record.course === request.course &&
            Number(record.semester) === Number(request.semester)
          : record.subject === request.subject);
      const existing = allAttendance.find(matchesRequestScope);
      const photo = request.photo || existing?.photo || null;
      if (finalStatus === "Present" && !photo) {
        setMessage("A student can only be marked present when the request includes a captured photo.");
        return;
      }

      const updatedRecord = {
        id: existing?.id || `${request.date}-${request.course || "legacy"}-${request.semester || "legacy"}-${request.subjectId || request.subject}-${request.studentId}`,
        studentId: request.studentId,
        rollNo: request.rollNo,
        studentName: request.studentName,
        date: request.date,
        ...(request.course ? { course: request.course } : {}),
        ...(request.semester ? { semester: Number(request.semester) } : {}),
        ...(request.subjectId != null ? { subjectId: request.subjectId } : {}),
        subject: request.subject,
        status: finalStatus,
        photo: finalStatus === "Present" ? photo : null,
        updatedByAdmin: reviewer?.name || "Admin",
        updatedAt: reviewedAt,
      };
      updatedAttendance = [
        ...allAttendance.filter((record) => !matchesRequestScope(record)),
        updatedRecord,
      ];
      if (!saveData("attendance", updatedAttendance)) {
        setMessage("Unable to apply the attendance change. The request remains pending.");
        return;
      }
    }

    if (!saveData("attendanceChangeRequests", updatedRequests)) {
      if (originalAttendance) {
        if (!saveData("attendance", originalAttendance)) {
          setMessage("The request update failed and attendance rollback was unsuccessful. Please verify the attendance record.");
          return;
        }
      }
      setMessage("Unable to save the review decision. Please try again.");
      return;
    }

    setRequests(updatedRequests);
    setMessage(decision === "Approved"
      ? "Request approved and attendance updated."
      : "Request rejected.");
  }

  const pendingRequests = sortedRequests.filter((request) => request.status === "Pending");
  const reviewedRequests = sortedRequests.filter((request) => request.status !== "Pending");

  return (
    <main className="page">
      <div className={`container ${styles.container}`}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ADMINISTRATION</p>
            <h1 className="pageTitle">Attendance change requests</h1>
            <p className="pageDescription">
              Review faculty requests and update attendance records.
            </p>
          </div>
          <Link className={styles.backLink} href="/admin">Back to dashboard</Link>
        </header>

        {message && <p className={styles.message} role="status">{message}</p>}

        <section aria-labelledby="pending-title">
          <div className={styles.sectionHeader}>
            <h2 id="pending-title">Pending requests</h2>
            <span>{pendingRequests.length}</span>
          </div>
          {pendingRequests.length === 0 ? (
            <p className={styles.emptyState}>There are no attendance change requests to review.</p>
          ) : (
            <div className={styles.requestList}>
              {pendingRequests.map((request) => (
                <article className={styles.requestCard} key={request.id}>
                  <div className={styles.requestDetails}>
                    <div className={styles.requestHeading}>
                      <div>
                        <h3>{request.studentName}</h3>
                        <p>Roll no. {request.rollNo}</p>
                      </div>
                      <span className={styles.pendingBadge}>Pending</span>
                    </div>
                    <dl className={styles.details}>
                      <div><dt>Date</dt><dd>{request.date}</dd></div>
                      {request.course && <div><dt>Course</dt><dd>{request.course}</dd></div>}
                      {request.semester && <div><dt>Semester</dt><dd>{request.semester}</dd></div>}
                      <div><dt>Subject</dt><dd>{request.subject}</dd></div>
                      <div><dt>Current status</dt><dd>{request.currentStatus}</dd></div>
                      <div><dt>Requested status</dt><dd>{request.requestedStatus}</dd></div>
                      <div><dt>Requested by</dt><dd>{request.facultyName}{request.facultyEmail ? ` · ${request.facultyEmail}` : ""}</dd></div>
                      <div><dt>Submitted</dt><dd>{new Date(request.createdAt).toLocaleString()}</dd></div>
                    </dl>
                    {request.reason && <p className={styles.reason}><strong>Reason:</strong> {request.reason}</p>}
                    {request.photo && (
                      <div className={styles.photoEvidence}>
                        <p>Captured photo evidence</p>
                        <Image
                          src={request.photo}
                          alt={`Photo evidence for ${request.studentName}`}
                          width={240}
                          height={180}
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                  <div className={styles.reviewActions}>
                    <label htmlFor={`decision-${request.id}`}>Final attendance status</label>
                    <select
                      id={`decision-${request.id}`}
                      value={decisions[request.id] || request.requestedStatus}
                      onChange={(event) => setDecisions((previous) => ({
                        ...previous,
                        [request.id]: event.target.value,
                      }))}
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                    <button
                      type="button"
                      className={styles.approveButton}
                      onClick={() => reviewRequest(request, "Approved")}
                    >
                      Approve and update
                    </button>
                    <button
                      type="button"
                      className={styles.rejectButton}
                      onClick={() => reviewRequest(request, "Rejected")}
                    >
                      Reject request
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {reviewedRequests.length > 0 && (
          <section className={styles.reviewedSection} aria-labelledby="reviewed-title">
            <div className={styles.sectionHeader}>
              <h2 id="reviewed-title">Reviewed requests</h2>
              <span>{reviewedRequests.length}</span>
            </div>
            <div className={styles.reviewedList}>
              {reviewedRequests.map((request) => (
                <article className={styles.reviewedRow} key={request.id}>
                  <div>
                    <strong>{request.studentName}</strong>
                    <span>{request.date} · {request.subject} · {request.finalStatus || request.requestedStatus}</span>
                  </div>
                  <span className={request.status === "Approved" ? styles.approvedBadge : styles.rejectedBadge}>
                    {request.status}
                  </span>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
