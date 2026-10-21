
"use client";

import { useState } from "react";
import styles from "./students.module.css";
import { readData, saveData } from "@/lib/api";

const emptyForm = {
  name: "",
  rollNo: "",
  email: "",
  course: "",
};

export default function StudentsPage() {
  const [students, setStudents] = useState(() => readData("students", []));
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function submitStudent(event) {
    event.preventDefault();

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
          ? { ...student, ...form, rollNo: form.rollNo.trim() }
          : student
      );
      setMessage("Student updated successfully.");
    } else {
      updated = [
        ...students,
        {
          ...form,
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
    setForm(emptyForm);
    setEditingId(null);
  }

  function editStudent(student) {
    setForm({
      name: student.name,
      rollNo: student.rollNo,
      email: student.email,
      course: student.course,
    });
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
      setForm(emptyForm);
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
            <input
              id="course"
              name="course"
              value={form.course}
              onChange={updateField}
              required
              placeholder="e.g. BCA"
            />
          </div>

          <button className={styles.submitButton} type="submit">
            {editingId !== null ? "Update Student" : "Add Student"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setEditingId(null);
                setMessage("");
              }}
            >
              Cancel Edit
            </button>
          )}
        </form>

        <h2 style={{ marginBottom: 14 }}>Student List ({students.length})</h2>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.rollNo}</td>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.course}</td>
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
              {students.length === 0 && (
                <tr>
                  <td colSpan={5}>No students added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
