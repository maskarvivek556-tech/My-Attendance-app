
"use client";

import { useState } from "react";
import styles from "./students.module.css";
import { readData, saveData } from "@/lib/api";
import {
  COURSES,
  getCourseSemesters,
  getStudentSemester,
  normalizeCourse,
  normalizeSemester,
} from "@/lib/courses";
import CourseSelector from "@/components/CourseSelector";

const emptyForm = (course = "BCA") => ({
  name: "",
  rollNo: "",
  email: "",
  course,
  semester: "1",
});

export default function StudentsPage() {
  const [students, setStudents] = useState(() => readData("students", []));
  const [selectedCourse, setSelectedCourse] = useState("BCA");
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [form, setForm] = useState(() => emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const filteredStudents = students.filter(
    (student) =>
      normalizeCourse(student.course) === selectedCourse &&
      getStudentSemester(student) === selectedSemester
  );

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function selectCourse(course) {
    setSelectedCourse(course);
    setSelectedSemester(1);
    if (editingId === null) {
      setForm((current) => ({ ...current, course, semester: "1" }));
    } else {
      setForm((current) => ({ ...current, semester: "1" }));
    }
  }

  function selectSemester(semester) {
    setSelectedSemester(semester);
    if (editingId === null) {
      setForm((current) => ({ ...current, course: selectedCourse, semester: String(semester) }));
    }
  }

  function submitStudent(event) {
    event.preventDefault();
    const studentCourse = normalizeCourse(form.course);
    const studentSemester = normalizeSemester(form.semester);
    if (
      !COURSES.includes(studentCourse) ||
      !getCourseSemesters(studentCourse).includes(studentSemester)
    ) {
      setMessage("Select a valid course and semester for the student.");
      return;
    }

    const duplicate = students.some(
      (student) =>
        student.rollNo.toLowerCase() === form.rollNo.trim().toLowerCase() &&
        student.id !== editingId
    );

    if (duplicate) {
      setMessage("This roll number already exists.");
      return;
    }

    let updated;

    if (editingId !== null) {
      updated = students.map((student) =>
        student.id === editingId
          ? {
              ...student,
              ...form,
              course: studentCourse,
              semester: studentSemester,
              rollNo: form.rollNo.trim(),
            }
          : student
      );
      setMessage("Student updated successfully.");
    } else {
      updated = [
        ...students,
        {
          ...form,
          course: studentCourse,
          semester: studentSemester,
          rollNo: form.rollNo.trim(),
          id: Date.now(),
        },
      ];
      setMessage("Student added successfully.");
    }

    if (!saveData("students", updated)) {
      setMessage("Unable to save student records in this browser.");
      return;
    }
    setStudents(updated);
    setSelectedCourse(studentCourse);
    setSelectedSemester(studentSemester);
    setForm({ ...emptyForm(studentCourse), semester: String(studentSemester) });
    setEditingId(null);
  }

  function editStudent(student) {
    setForm({
      name: student.name,
      rollNo: student.rollNo,
      email: student.email,
      course: student.course,
      semester: String(getStudentSemester(student)),
    });
    setSelectedCourse(normalizeCourse(student.course) || "BCA");
    setSelectedSemester(getStudentSemester(student));
    setEditingId(student.id);
    setMessage("");
  }

  function deleteStudent(id) {
    const updated = students.filter((student) => student.id !== id);
    if (!saveData("students", updated)) {
      setMessage("Unable to delete this student.");
      return;
    }
    setStudents(updated);
    setMessage("Student deleted.");
    if (editingId === id) {
      setForm({ ...emptyForm(selectedCourse), semester: String(selectedSemester) });
      setEditingId(null);
    }
  }

  return (
    <main className="page">
      <div className={`container ${styles.container}`}>
        <h1 className="pageTitle">Student Management</h1>
        <p className="pageDescription">
          Add, update and manage student records.
        </p>

        <section className={styles.coursePanel} aria-label="Filter students by course and semester">
          <CourseSelector selectedCourse={selectedCourse} onSelect={selectCourse} />
          <div className={styles.filterField}>
            <label htmlFor="student-filter-semester">Semester</label>
            <select
              id="student-filter-semester"
              value={selectedSemester}
              onChange={(event) => selectSemester(Number(event.target.value))}
            >
              {getCourseSemesters(selectedCourse).map((semester) => (
                <option key={semester} value={semester}>Semester {semester}</option>
              ))}
            </select>
          </div>
          <p className={styles.courseSummary}>
            Showing <strong>{selectedCourse} · Semester {selectedSemester}</strong> students.
          </p>
        </section>

        {message && <p className={styles.message}>{message}</p>}

        <form className={styles.form} onSubmit={submitStudent}>
          <div className={styles.field}>
            <label htmlFor="name">Student name</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={updateField}
              required
              placeholder="Full name"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="rollNo">Roll number</label>
            <input
              id="rollNo"
              name="rollNo"
              value={form.rollNo}
              onChange={updateField}
              required
              placeholder="e.g. BCA101"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              required
              placeholder="student@example.com"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="course">Course / Class</label>
            <select
              id="course"
              name="course"
              value={form.course}
              onChange={(event) => setForm((current) => ({
                ...current,
                course: event.target.value,
                semester: "1",
              }))}
              required
            >
              {COURSES.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="student-semester">Semester</label>
            <select
              id="student-semester"
              name="semester"
              value={form.semester}
              onChange={updateField}
              required
            >
              {getCourseSemesters(form.course).map((semester) => (
                <option key={semester} value={semester}>Semester {semester}</option>
              ))}
            </select>
          </div>

          <button className={styles.submitButton} type="submit">
            {editingId !== null ? "Update Student" : "Add Student"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={() => {
                setForm({ ...emptyForm(selectedCourse), semester: String(selectedSemester) });
                setEditingId(null);
                setMessage("");
              }}
            >
              Cancel Edit
            </button>
          )}
        </form>

        <h2 className={styles.listHeading}>
          {selectedCourse} · Semester {selectedSemester} Student List <span>{filteredStudents.length}</span>
        </h2>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Semester</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.rollNo}</td>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.course}</td>
                  <td>{getStudentSemester(student)}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => editStudent(student)}
                    >
                      Edit
                    </button>{" "}
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => deleteStudent(student.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6}>No {selectedCourse} students in Semester {selectedSemester} yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
