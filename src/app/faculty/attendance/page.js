"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./attendance.module.css";
import { readData, saveData } from "@/lib/api";
import { readSession } from "@/lib/session";
import {
  getCourseSemesters,
  getStudentSemester,
  isSubjectAssignedToFaculty,
  normalizeCourse,
} from "@/lib/courses";
import CourseSelector from "@/components/CourseSelector";

export default function AttendancePage() {
  const [students] = useState(() => readData("students", []));
  const [facultyMembers] = useState(() => readData("faculty", []));
  const [facultySession] = useState(() => readSession());
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [subjects] = useState(() => readData("subjects", []));
  const [date, setDate] = useState(() => {
    const today = new Date();
    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
  });
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [records, setRecords] = useState({});
  const [photos, setPhotos] = useState({});
  const [savedRecords, setSavedRecords] = useState({});
  const [requestPhotos, setRequestPhotos] = useState({});
  const [requestingStudentId, setRequestingStudentId] = useState(null);
  const [requestStatuses, setRequestStatuses] = useState({});
  const [requestReasons, setRequestReasons] = useState({});
  const [message, setMessage] = useState("");
  const [cameraStudentId, setCameraStudentId] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraMode, setCameraMode] = useState("attendance");

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const assignedFaculty = facultyMembers.find(
    (person) =>
      person.email?.toLowerCase() === facultySession?.email?.toLowerCase()
  );

  const subjectOptions = subjects.filter(
    (item) =>
      normalizeCourse(item.course) === selectedCourse &&
      Number(item.semester) === Number(selectedSemester) &&
      (facultySession?.role !== "faculty" ||
        (assignedFaculty &&
          isSubjectAssignedToFaculty(item, assignedFaculty)))
  );

  const selectedSubject = subjectOptions.find(
    (item) => String(item.id) === selectedSubjectId
  );

  const courseSemesterStudents = students.filter(
    (student) =>
      normalizeCourse(student.course) === selectedCourse &&
      getStudentSemester(student) === Number(selectedSemester)
  );

  const courseStudents = selectedSubject ? courseSemesterStudents : [];

  function formatAttendanceTime(value) {
    if (!value) return "Not available";

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime())
      ? "Not available"
      : parsed.toLocaleString();
  }

  function clearAttendanceDraft() {
    setRecords({});
    setPhotos({});
    setSavedRecords({});
    setRequestPhotos({});
    setRequestingStudentId(null);
    setMessage("");

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      setCameraStream(null);
      setCameraStudentId(null);
    }
  }

  useEffect(() => {
    if (!cameraStream || !videoRef.current) {
      return undefined;
    }

    const video = videoRef.current;
    video.srcObject = cameraStream;

    video.play().catch(() => {
      setMessage(
        "Unable to start the camera preview. Check camera permissions and try again."
      );
    });

    return () => {
      video.srcObject = null;
    };
  }, [cameraStream]);

  useEffect(
    () => () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  function loadRecords(nextDate, nextCourse, nextSemester, nextSubjectId) {
    if (
      !nextDate ||
      !nextCourse ||
      !nextSemester ||
      !nextSubjectId
    ) {
      setRecords({});
      setPhotos({});
      setSavedRecords({});
      setRequestPhotos({});
      return;
    }

    const nextSubject = subjects.find(
      (item) => String(item.id) === nextSubjectId
    );

    if (
      !nextSubject ||
      normalizeCourse(nextSubject.course) !== nextCourse ||
      Number(nextSubject.semester) !== Number(nextSemester) ||
      !subjectOptions.some(
        (item) => String(item.id) === nextSubjectId
      )
    ) {
      setRecords({});
      setPhotos({});
      setSavedRecords({});
      setRequestPhotos({});
      return;
    }

    const all = readData("attendance", []);

    const studentIds = new Set(
      students
        .filter(
          (student) =>
            normalizeCourse(student.course) === nextCourse &&
            getStudentSemester(student) === Number(nextSemester)
        )
        .map((student) => student.id)
    );

    const existing = all.filter(
      (record) =>
        record.date === nextDate &&
        record.course === nextCourse &&
        Number(record.semester) === Number(nextSemester) &&
        String(record.subjectId) === nextSubjectId &&
        studentIds.has(record.studentId)
    );

    const next = {};
    const nextPhotos = {};
    const nextSavedRecords = {};

    existing.forEach((record) => {
      const status = record.status === "Present" ? "Present" : "Absent";

      nextSavedRecords[record.studentId] = { ...record, status };

      if (record.photo) {
        nextPhotos[record.studentId] = record.photo;
      }

      next[record.studentId] = status;
    });

    setRecords(next);
    setPhotos(nextPhotos);
    setSavedRecords(nextSavedRecords);
    setRequestPhotos({});
  }

  function markStatus(studentId, status) {
    if (
      !selectedCourse ||
      !selectedSemester ||
      !selectedSubject ||
      !courseSemesterStudents.some(
        (student) => student.id === studentId
      )
    ) {
      setMessage(
        "Select a course, semester, and assigned subject before marking attendance."
      );
      return;
    }

    const alreadySaved = readData("attendance", []).some(
      (record) =>
        record.studentId === studentId &&
        record.date === date &&
        record.course === selectedCourse &&
        Number(record.semester) === Number(selectedSemester) &&
        String(record.subjectId) === String(selectedSubject.id)
    );

    if (savedRecords[studentId] || alreadySaved) {
      setMessage(
        "Attendance is already saved for this student and date. Only Admin can update it."
      );
      return;
    }

    if (status === "Present" && !photos[studentId]) {
      setMessage(
        "Capture a photo using the camera before marking the student present."
      );
      return;
    }

    setRecords((previous) => ({
      ...previous,
      [studentId]: status,
    }));

    if (status === "Absent") {
      setPhotos((previous) => {
        const next = { ...previous };
        delete next[studentId];
        return next;
      });
    }
  }

  async function openCamera(studentId, mode = "attendance") {
    if (
      !selectedCourse ||
      !selectedSemester ||
      !selectedSubject ||
      !courseSemesterStudents.some(
        (student) => student.id === studentId
      )
    ) {
      setMessage(
        "Select a course, semester, and assigned subject before capturing attendance photos."
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        "Camera access is unavailable. Use a supported browser on HTTPS or localhost."
      );
      return;
    }

    setMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });

      cameraStreamRef.current = stream;
      setCameraStudentId(studentId);
      setCameraStream(stream);
      setCameraMode(mode);
    } catch (error) {
      console.error("Unable to access the device camera:", error);

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setMessage(
          "Camera permission was denied. Allow camera access in your browser settings and try again."
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        setMessage("No camera was found on this device.");
      } else {
        setMessage(
          "Unable to open the camera. Check that it is available and try again."
        );
      }
    }
  }

  function closeCamera() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setCameraStream(null);
    setCameraStudentId(null);
  }

  function capturePhoto() {
    const video = videoRef.current;

    if (
      !video ||
      !cameraStudentId ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      setMessage(
        "The camera is not ready yet. Wait for the preview and try again."
      );
      return;
    }

    try {
      if (
        !selectedSubject ||
        !courseSemesterStudents.some(
          (student) => student.id === cameraStudentId
        )
      ) {
        setMessage(
          "The selected student is no longer part of this attendance roster."
        );
        closeCamera();
        return;
      }

      const canvas = document.createElement("canvas");
      const scale = Math.min(
        1,
        1280 / Math.max(video.videoWidth, video.videoHeight)
      );

      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const context = canvas.getContext("2d");

      if (!context) {
        setMessage("Unable to prepare the captured photo. Please try again.");
        return;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const photo = canvas.toDataURL("image/jpeg", 0.8);
      const studentId = cameraStudentId;

      if (cameraMode === "request") {
        setRequestPhotos((previous) => ({
          ...previous,
          [studentId]: photo,
        }));

        setMessage(
          "Photo captured and attached to the admin review request."
        );
      } else {
        setPhotos((previous) => ({
          ...previous,
          [studentId]: photo,
        }));

        setRecords((previous) => ({
          ...previous,
          [studentId]: "Present",
        }));

        setMessage("Photo captured. Student marked present.");
      }

      closeCamera();
    } catch (error) {
      console.error("Unable to capture a photo from the camera:", error);
      setMessage("Unable to capture the photo. Please try again.");
    }
  }
    function saveAttendance() {
    if (!selectedCourse || !selectedSemester || !selectedSubject || !date) {
      setMessage("Select a course, semester, subject, and date before saving attendance.");
      return;
    }

    if (courseStudents.length === 0) {
      setMessage(`Add ${selectedCourse} students before recording attendance.`);
      return;
    }

    const all = readData("attendance", []);

    const alreadySaved = new Set(
      all
        .filter(
          (record) =>
            record.date === date &&
            record.course === selectedCourse &&
            Number(record.semester) === Number(selectedSemester) &&
            String(record.subjectId) === String(selectedSubject.id)
        )
        .map((record) => record.studentId)
    );

    const newRecords = courseStudents
      .filter(
        (student) =>
          !alreadySaved.has(student.id) &&
          !savedRecords[student.id] &&
          Boolean(records[student.id])
      )
      .map((student) => {
        const markedAt = new Date().toISOString();
        const status =
          records[student.id] === "Present" && photos[student.id]
            ? "Present"
            : "Absent";
        const faculty = readSession();

        return {
          id: `${date}-${selectedCourse}-${selectedSemester}-${selectedSubject.id}-${student.id}`,
          studentId: student.id,
          rollNo: student.rollNo,
          studentName: student.name,
          date,
          course: selectedCourse,
          semester: Number(selectedSemester),
          subjectId: selectedSubject.id,
          subject: selectedSubject.name,
          status,
          photo: status === "Present" ? photos[student.id] : null,
          markedAt,
          updatedAt: null,
          history: [
            {
              action: "marked",
              status,
              at: markedAt,
              by: faculty?.name || "Faculty",
              role: faculty?.role || "faculty",
            },
          ],
        };
      });

    if (!newRecords.length) {
      const hasUnmarkedStudents = courseStudents.some(
        (student) =>
          !alreadySaved.has(student.id) &&
          !savedRecords[student.id] &&
          !records[student.id]
      );

      setMessage(
        hasUnmarkedStudents
          ? "No new attendance selected. Students left unmarked can send an attendance request to Admin."
          : "Attendance is already saved for the selected students. Only Admin can update saved attendance."
      );
      return;
    }

    if (!saveData("attendance", [...all, ...newRecords])) {
      setMessage(
        "Unable to save attendance in this browser. Check storage settings and try again."
      );
      return;
    }

    setSavedRecords((previous) => ({
      ...previous,
      ...Object.fromEntries(
        newRecords.map((record) => [record.studentId, record])
      ),
    }));

    setMessage("Attendance saved successfully.");
  }

  function submitChangeRequest(student) {
    const requestedStatus = requestStatuses[student.id] || "Present";
    const photo = requestPhotos[student.id] || null;

    if (
      !date ||
      !selectedCourse ||
      !selectedSemester ||
      !selectedSubject ||
      !courseSemesterStudents.some((item) => item.id === student.id)
    ) {
      setMessage(
        "Select a course, semester, subject, and date before requesting attendance."
      );
      return;
    }

    const allAttendance = readData("attendance", []);

    const alreadyMarked =
      savedRecords[student.id] ||
      allAttendance.some(
        (record) =>
          record.studentId === student.id &&
          record.date === date &&
          record.course === selectedCourse &&
          Number(record.semester) === Number(selectedSemester) &&
          String(record.subjectId) === String(selectedSubject.id)
      );

    if (alreadyMarked) {
      setMessage(
        "This student's attendance is already marked. Faculty cannot request attendance again."
      );
      setRequestingStudentId(null);
      return;
    }

    if (requestedStatus === "Present" && !photo) {
      setMessage(
        "Capture a live photo using the camera before requesting Present attendance."
      );
      return;
    }

    const requests = readData("attendanceChangeRequests", []);

    const hasPendingRequest = requests.some(
      (request) =>
        request.studentId === student.id &&
        request.date === date &&
        String(request.subjectId) === String(selectedSubject.id) &&
        request.course === selectedCourse &&
        Number(request.semester) === Number(selectedSemester) &&
        request.status === "Pending"
    );

    if (hasPendingRequest) {
      setMessage(
        "An admin review request for this student, date, and subject is already pending."
      );
      return;
    }

    const faculty = readSession();

    let fallbackId = `request-${date}-${selectedSubject.id}-${student.id}-${requests.length + 1}`;

    while (requests.some((item) => item.id === fallbackId)) {
      fallbackId = `${fallbackId}-next`;
    }

    const request = {
      id: window.crypto?.randomUUID?.() || fallbackId,
      studentId: student.id,
      studentName: student.name,
      rollNo: student.rollNo,
      course: selectedCourse,
      semester: Number(selectedSemester),
      subjectId: selectedSubject.id,
      date,
      subject: selectedSubject.name,
      requestType: "mark_attendance",
      currentStatus: "Not recorded",
      requestedStatus,
      reason: requestReasons[student.id]?.trim() || "",
      photo: requestedStatus === "Present" ? photo : null,
      facultyId: faculty?.id || null,
      facultyName: faculty?.name || "Faculty",
      facultyEmail: faculty?.email || "",
      createdAt: new Date().toISOString(),
      status: "Pending",
    };

    if (!saveData("attendanceChangeRequests", [...requests, request])) {
      setMessage(
        "Unable to send the request. Check browser storage settings and try again."
      );
      return;
    }

    setRequestingStudentId(null);
    setMessage("Pending attendance request sent to the Admin for review.");
  }

  const pendingRequests = readData("attendanceChangeRequests", []).filter(
    (request) =>
      request.date === date &&
      request.course === selectedCourse &&
      Number(request.semester) === Number(selectedSemester) &&
      String(request.subjectId) === String(selectedSubject?.id) &&
      request.status === "Pending" &&
      courseStudents.some((student) => student.id === request.studentId)
  );

  return (
    <main className="page">
      <div className={`container ${styles.container}`}>
        <h1 className="pageTitle">Mark Attendance</h1>

        <p className="pageDescription">
          Choose the course, semester, and assigned subject to open the matching roster.
        </p>

        {message && <p className={styles.message}>{message}</p>}

        <div className={styles.controls}>
          <CourseSelector
            selectedCourse={selectedCourse}
            onSelect={(course) => {
              clearAttendanceDraft();
              setSelectedCourse(course);
              setSelectedSemester("");
              setSelectedSubjectId("");
            }}
          />

          <div className={styles.field}>
            <label htmlFor="semester">Semester</label>
            <select
              id="semester"
              value={selectedSemester}
              disabled={!selectedCourse}
              onChange={(event) => {
                const semester = event.target.value;
                clearAttendanceDraft();
                setSelectedSemester(semester);
                setSelectedSubjectId("");
              }}
            >
              <option value="">Select semester</option>
              {getCourseSemesters(selectedCourse).map((semester) => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="date">Attendance date</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                loadRecords(
                  event.target.value,
                  selectedCourse,
                  selectedSemester,
                  selectedSubjectId
                );
              }}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="subject">Subject</label>
            <select
              id="subject"
              value={selectedSubjectId}
              disabled={!selectedCourse || !selectedSemester}
              onChange={(event) => {
                const subjectId = event.target.value;
                clearAttendanceDraft();
                setSelectedSubjectId(subjectId);
                loadRecords(
                  date,
                  selectedCourse,
                  selectedSemester,
                  subjectId
                );
              }}
            >
              <option value="">Select subject</option>
              {subjectOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!selectedCourse || !selectedSemester || !selectedSubject ? (
          <div className={styles.rosterPrompt} role="status">
            {!selectedCourse
              ? "Select a course to begin."
              : !selectedSemester
                ? "Select a semester to view its subjects."
                : subjectOptions.length === 0
                  ? `No ${selectedCourse} subjects are assigned to you for Semester ${selectedSemester}. Ask an admin to create and assign a subject.`
                  : "Select an assigned subject to load its attendance roster."}
          </div>
        ) : (
          <>
            <div className={styles.rosterHeading}>
              <div>
                <h2>
                  {selectedCourse} · Semester {selectedSemester} ·{" "}
                  {selectedSubject.name}
                </h2>
                <p>
                  Only students enrolled in this course and semester are included.
                </p>
              </div>

              <span>
                {courseStudents.length}{" "}
                {courseStudents.length === 1 ? "student" : "students"}
              </span>
            </div>
                        <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Roll No.</th>
                    <th>Student</th>
                    <th>Attendance Status</th>
                    <th>Photo</th>
                    <th>Admin review</th>
                  </tr>
                </thead>

                <tbody>
                  {courseStudents.map((student) => (
                    <tr key={student.id}>
                      <td data-label="Roll No.">{student.rollNo}</td>
                      <td data-label="Student">{student.name}</td>

                      <td data-label="Attendance Status">
                        {savedRecords[student.id] ? (
                          <span className={styles.savedStatus}>
                            {savedRecords[student.id].status}

                            <small>
                              Marked:{" "}
                              {formatAttendanceTime(
                                savedRecords[student.id].markedAt ||
                                  savedRecords[student.id].createdAt
                              )}
                            </small>

                            {savedRecords[student.id].updatedAt && (
                              <small>
                                Last Admin update:{" "}
                                {formatAttendanceTime(
                                  savedRecords[student.id].updatedAt
                                )}
                              </small>
                            )}

                            <small>
                              Locked. Only Admin can update attendance.
                            </small>
                          </span>
                        ) : (
                          <div
                            className={styles.statusButtons}
                            role="group"
                            aria-label={`Attendance status for ${student.name}`}
                          >
                            <button
                              type="button"
                              className={`${styles.statusButton} ${
                                styles.presentButton
                              } ${
                                records[student.id] === "Present"
                                  ? styles.selectedStatus
                                  : ""
                              }`}
                              aria-pressed={
                                records[student.id] === "Present"
                              }
                              disabled={!photos[student.id]}
                              onClick={() =>
                                markStatus(student.id, "Present")
                              }
                            >
                              Present
                            </button>

                            <button
                              type="button"
                              className={`${styles.statusButton} ${
                                styles.absentButton
                              } ${
                                records[student.id] === "Absent"
                                  ? styles.selectedStatus
                                  : ""
                              }`}
                              aria-pressed={
                                records[student.id] === "Absent"
                              }
                              onClick={() =>
                                markStatus(student.id, "Absent")
                              }
                            >
                              Absent
                            </button>
                          </div>
                        )}
                      </td>

                      <td data-label="Photo">
                        <button
                          type="button"
                          className={styles.photoButton}
                          onClick={() =>
                            openCamera(
                              student.id,
                              savedRecords[student.id] ||
                                requestingStudentId === student.id
                                ? "request"
                                : "attendance"
                            )
                          }
                          aria-label={`Open camera to capture a photo of ${student.name}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <path d="M14 4h-4L8 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2-3Z" />
                            <circle cx="12" cy="13" r="3" />
                          </svg>

                          {savedRecords[student.id] ||
                          requestingStudentId === student.id
                            ? requestPhotos[student.id]
                              ? "Retake Request Photo"
                              : "Capture Request Photo"
                            : photos[student.id]
                              ? "Retake Photo"
                              : "Upload Photo"}
                        </button>

                        {(requestPhotos[student.id] ||
                          photos[student.id]) && (
                          <Image
                            className={styles.photoPreview}
                            src={
                              requestPhotos[student.id] ||
                              photos[student.id]
                            }
                            alt={`Captured for ${student.name}`}
                            width={48}
                            height={48}
                            unoptimized
                          />
                        )}
                      </td>

                      <td data-label="Admin review">
                        {savedRecords[student.id] ? (
                          <span className={styles.notSaved}>
                            Attendance already marked. Admin only can update it.
                          </span>
                        ) : pendingRequests.some(
                            (request) =>
                              request.studentId === student.id
                          ) ? (
                          <span className={styles.pendingRequest}>
                            Request pending
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={styles.requestButton}
                              onClick={() =>
                                setRequestingStudentId(
                                  requestingStudentId === student.id
                                    ? null
                                    : student.id
                                )
                              }
                            >
                              {requestingStudentId === student.id
                                ? "Cancel request"
                                : "Request attendance"}
                            </button>

                            {requestingStudentId === student.id && (
                              <div className={styles.requestForm}>
                                <label
                                  htmlFor={`request-status-${student.id}`}
                                >
                                  Requested attendance
                                </label>

                                <select
                                  id={`request-status-${student.id}`}
                                  value={
                                    requestStatuses[student.id] || "Present"
                                  }
                                  onChange={(event) =>
                                    setRequestStatuses((previous) => ({
                                      ...previous,
                                      [student.id]: event.target.value,
                                    }))
                                  }
                                >
                                  <option value="Present">Present</option>
                                  <option value="Absent">Absent</option>
                                </select>

                                <label
                                  htmlFor={`request-reason-${student.id}`}
                                >
                                  Reason (optional)
                                </label>

                                <textarea
                                  id={`request-reason-${student.id}`}
                                  rows={2}
                                  value={requestReasons[student.id] || ""}
                                  onChange={(event) =>
                                    setRequestReasons((previous) => ({
                                      ...previous,
                                      [student.id]: event.target.value,
                                    }))
                                  }
                                  placeholder="Why was attendance missed?"
                                />

                                {requestStatuses[student.id] !== "Absent" &&
                                  !requestPhotos[student.id] && (
                                    <small>
                                      Capture a request photo before sending a
                                      Present request.
                                    </small>
                                  )}

                                <button
                                  type="button"
                                  className={styles.requestButton}
                                  onClick={() =>
                                    submitChangeRequest(student)
                                  }
                                >
                                  Send to Admin
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}

                  {courseStudents.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        No {selectedCourse} students found for Semester{" "}
                        {selectedSemester}. Add students for this course and
                        semester in Student Management.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {courseStudents.length > 0 && (
              <div className={styles.footer}>
                <span>
                  {courseStudents.length} {selectedCourse} · Semester{" "}
                  {selectedSemester} students ·{" "}
                  {
                    courseStudents.filter(
                      (student) => records[student.id] === "Present"
                    ).length
                  }{" "}
                  selected Present ·{" "}
                  {
                    courseStudents.filter(
                      (student) => records[student.id] === "Absent"
                    ).length
                  }{" "}
                  selected Absent · {pendingRequests.length} pending requests
                </span>

                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={saveAttendance}
                  disabled={!date || !selectedSubject}
                >
                  Save Attendance
                </button>
              </div>
            )}
          </>
        )}

        {selectedCourse &&
          selectedSemester &&
          subjectOptions.length === 0 && (
            <p className={styles.emptyHint}>
              Subjects are scoped by course and semester, and faculty can only
              mark subjects assigned to their account.
            </p>
          )}
      </div>

      {cameraStudentId && (
        <div className={styles.cameraBackdrop} role="presentation">
          <section
            className={styles.cameraDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="camera-title"
          >
            <h2 id="camera-title">
              Capture photo for{" "}
              {
                courseStudents.find(
                  (student) => student.id === cameraStudentId
                )?.name
              }
            </h2>

            <video
              ref={videoRef}
              className={styles.cameraPreview}
              autoPlay
              muted
              playsInline
            />

            <div className={styles.cameraActions}>
              <button
                type="button"
                className={styles.cameraCancel}
                onClick={closeCamera}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.saveButton}
                onClick={capturePhoto}
              >
                Capture Photo
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}