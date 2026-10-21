
"use client";

import { useState } from "react";
import Link from "next/link";
import { readData, saveData } from "@/lib/api";
import styles from "./subjects.module.css";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState(() => readData("subjects", []));
  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [message, setMessage] = useState("");

  function addSubject(event) {
    event.preventDefault();

    if (!name.trim() || !faculty.trim()) {
      setMessage("Enter both a subject name and faculty member.");
      return;
    }

    if (
      subjects.some(
        (item) => item.name.toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      setMessage("A subject with this name already exists.");
      return;
    }

    const updated = [
      ...subjects,
      {
        id: Date.now(),
        name: name.trim(),
        faculty: faculty.trim(),
      },
    ];

    if (!saveData("subjects", updated)) {
      setMessage("Unable to save subjects in this browser.");
      return;
    }
    setSubjects(updated);
    setName("");
    setFaculty("");
    setMessage("Subject added successfully.");
  }

  function deleteSubject(id) {
    const updated = subjects.filter((item) => item.id !== id);
    if (!saveData("subjects", updated)) {
      setMessage("Unable to delete this subject.");
      return;
    }
    setSubjects(updated);
    setMessage("Subject deleted.");
  }

  return (
    <main className="page">
      <div className={`container ${styles.container}`}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ADMINISTRATION</p>
            <h1 className="pageTitle">Manage Subjects</h1>
            <p className="pageDescription">Create subjects and assign a faculty member.</p>
          </div>
          <Link className={styles.backLink} href="/admin">Back to dashboard</Link>
        </header>

        {message && <p className={styles.message} role="status">{message}</p>}
        <form className={`card ${styles.form}`} onSubmit={addSubject}>
          <div className={styles.field}>
            <label htmlFor="subject">Subject name</label>
            <input
              id="subject"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Java Programming"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="faculty">Faculty name</label>
            <input
              id="faculty"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              placeholder="e.g. Amit Patil"
              required
            />
          </div>
          <button className={styles.primaryButton} type="submit">Add Subject</button>
        </form>

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
              {subjects.map((item) => (
                <article className={styles.subject} key={item.id}>
                  <span className={styles.subjectIcon}>S</span>
                  <div className={styles.subjectInfo}>
                    <strong>{item.name}</strong>
                    <span>{item.faculty}</span>
                  </div>
                  <button
                    className={styles.deleteButton}
                    type="button"
                    onClick={() => deleteSubject(item.id)}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
