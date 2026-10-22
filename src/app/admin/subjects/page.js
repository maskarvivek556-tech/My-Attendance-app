
"use client";

import { useState } from "react";
import Link from "next/link";
import { readData, saveData } from "@/lib/api";
import { COURSES, getCourseSemesters, normalizeCourse } from "@/lib/courses";
import styles from "./subjects.module.css";

const emptyForm = { name: "", course: "BCA", semester: "1", facultyId: "" };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState(() => readData("subjects", []));
  const [facultyMembers] = useState(() => readData("faculty", []));
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const subjectGroups = COURSES.flatMap((course) =>
    getCourseSemesters(course).map((semester) => ({
      key: `${course}-${semester}`,
      label: `${course} · Semester ${semester}`,
      items: subjects.filter(
        (item) =>
          normalizeCourse(item.course) === course &&
          Number(item.semester) === semester
      ),
    }))
  ).filter((group) => group.items.length > 0);
  const unassignedSubjects = subjects.filter(
    (item) =>
      !getCourseSemesters(item.course).includes(Number(item.semester))
  );
  if (unassignedSubjects.length > 0) {
    subjectGroups.push({
      key: "unassigned",
      label: "Needs course and semester assignment",
      items: unassignedSubjects,
    });
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function saveSubject(event) {
    event.preventDefault();
    const name = form.name.trim();
    const faculty = facultyMembers.find((person) => String(person.id) === form.facultyId);
    const semester = Number(form.semester);

    if (!name || !faculty || !getCourseSemesters(form.course).includes(semester)) {
      setMessage("Enter a subject name, valid course and semester, and select a faculty member.");
      return;
    }

    if (
      subjects.some(
        (item) =>
          item.id !== editingId &&
          normalizeCourse(item.course) === form.course &&
          Number(item.semester) === semester &&
          item.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      setMessage("A subject with this name already exists for this course and semester.");
      return;
    }

    const entry = {
      ...(editingId === null ? { id: Date.now() } : {}),
      name,
      course: form.course,
      semester,
      faculty: faculty.name,
      facultyId: faculty.id,
      facultyEmail: faculty.email.trim().toLowerCase(),
    };
    const updated = editingId === null
      ? [...subjects, entry]
      : subjects.map((item) => item.id === editingId ? { ...item, ...entry } : item);

    if (!saveData("subjects", updated)) {
      setMessage("Unable to save subjects in this browser.");
      return;
    }
    setSubjects(updated);
    setForm(emptyForm);
    setEditingId(null);
    setMessage(editingId === null ? "Subject added successfully." : "Subject updated successfully.");
  }

  function editSubject(item) {
    const assignedFaculty = facultyMembers.find(
      (person) =>
        (item.facultyId != null && String(person.id) === String(item.facultyId)) ||
        (item.facultyEmail && person.email.toLowerCase() === item.facultyEmail.toLowerCase()) ||
        (!item.facultyId && !item.facultyEmail &&
          person.name.trim().toLowerCase() === item.faculty?.trim().toLowerCase())
    );
    const course = COURSES.includes(normalizeCourse(item.course))
      ? normalizeCourse(item.course)
      : "BCA";
    const semester = getCourseSemesters(course).includes(Number(item.semester))
      ? Number(item.semester)
      : 1;
    setForm({
      name: item.name || "",
      course,
      semester: String(semester),
      facultyId: assignedFaculty ? String(assignedFaculty.id) : "",
    });
    setEditingId(item.id);
    setMessage("");
  }

  function deleteSubject(id) {
    const updated = subjects.filter((item) => item.id !== id);
    if (!saveData("subjects", updated)) {
      setMessage("Unable to delete this subject.");
      return;
    }
    setSubjects(updated);
    setMessage("Subject deleted.");
    if (editingId === id) {
      setForm(emptyForm);
      setEditingId(null);
    }
  }

  return (
    <main className="page">
      <div className={`container ${styles.container}`}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ADMINISTRATION</p>
            <h1 className="pageTitle">Manage Subjects</h1>
            <p className="pageDescription">Organize subjects by course and semester, then assign them to faculty.</p>
          </div>
          <Link className={styles.backLink} href="/admin">Back to dashboard</Link>
        </header>

        {message && <p className={styles.message} role="status">{message}</p>}
        <form className={`card ${styles.form}`} onSubmit={saveSubject}>
          <div className={styles.field}>
            <label htmlFor="subject-course">Course</label>
            <select
              id="subject-course"
              name="course"
              value={form.course}
              onChange={(event) => setForm((current) => ({
                ...current,
                course: event.target.value,
                semester: "1",
              }))}
              required
            >
              {COURSES.map((course) => <option key={course} value={course}>{course}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="subject-semester">Semester</label>
            <select
              id="subject-semester"
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
          <div className={styles.field}>
            <label htmlFor="subject">Subject name</label>
            <input
              id="subject"
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="e.g. Java Programming"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="faculty">Assigned faculty</label>
            <select
              id="faculty"
              name="facultyId"
              value={form.facultyId}
              onChange={updateField}
              required
            >
              <option value="">Select faculty</option>
              {facultyMembers.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} · {person.email}
                </option>
              ))}
            </select>
          </div>
          <button className={styles.primaryButton} type="submit">
            {editingId === null ? "Add Subject" : "Save Changes"}
          </button>
          {editingId !== null && (
            <button
              className={styles.cancelButton}
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
        {facultyMembers.length === 0 && (
          <p className={styles.notice}>
            Add faculty members before creating subjects so each subject can be assigned correctly.
          </p>
        )}

        <section className={`card ${styles.listCard}`}>
          <div className={styles.listHeader}>
            <div>
              <h2>Subject directory</h2>
              <p>{subjects.length} {subjects.length === 1 ? "subject" : "subjects"}</p>
            </div>
            <span className={styles.count}>{subjects.length}</span>
          </div>
          {subjects.length === 0 ? (
            <div className={styles.empty}>
              <h3>No subjects yet</h3>
              <p>Add a subject using the form above.</p>
            </div>
          ) : (
            <div className={styles.subjects}>
              {subjectGroups.map((group) => (
                <section className={styles.subjectGroup} key={group.key}>
                  <h3>{group.label}</h3>
                  {group.items.map((item) => (
                    <article className={styles.subject} key={item.id}>
                      <span className={styles.subjectIcon}>S</span>
                      <div className={styles.subjectInfo}>
                        <strong>{item.name}</strong>
                        <span>{item.faculty || "Faculty not assigned"}</span>
                      </div>
                      <button
                        className={styles.editButton}
                        type="button"
                        onClick={() => editSubject(item)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        type="button"
                        onClick={() => deleteSubject(item.id)}
                      >
                        Delete
                      </button>
                    </article>
                  ))}
                </section>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
