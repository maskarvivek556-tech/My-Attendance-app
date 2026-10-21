"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./faculty.module.css";
import { readData, saveData } from "@/lib/api";

const emptyForm = { name: "", email: "", department: "" };

export default function ManageFacultyPage() {
  const [faculty, setFaculty] = useState(() => readData("faculty", []));
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function saveFaculty(event) {
    event.preventDefault();
    const entry = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      department: form.department.trim(),
    };

    const duplicate = faculty.some(
      (person) =>
        person.email.toLowerCase() === entry.email.toLowerCase() &&
        person.id !== editingId
    );

    if (duplicate) {
      setMessage("A faculty member with this email already exists.");
      return;
    }

    const updated = editingId === null
      ? [...faculty, { ...entry, id: Date.now() }]
      : faculty.map((person) =>
          person.id === editingId ? { ...person, ...entry } : person
        );

    if (!saveData("faculty", updated)) {
      setMessage("Unable to save faculty records in this browser.");
      return;
    }

    setFaculty(updated);
    setForm(emptyForm);
    setEditingId(null);
    setMessage(editingId === null ? "Faculty member added." : "Faculty member updated.");
  }

  function editFaculty(person) {
    setForm({
      name: person.name,
      email: person.email,
      department: person.department,
    });
    setEditingId(person.id);
    setMessage("");
  }

  function deleteFaculty(id) {
    const updated = faculty.filter((person) => person.id !== id);
    if (!saveData("faculty", updated)) {
      setMessage("Unable to delete this faculty record.");
      return;
    }

    setFaculty(updated);
    if (editingId === id) {
      setForm(emptyForm);
      setEditingId(null);
    }
    setMessage("Faculty member deleted.");
  }

  return (
    <main className="page">
      <div className={`container ${styles.container}`}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ADMINISTRATION</p>
            <h1 className="pageTitle">Manage Faculty</h1>
            <p className="pageDescription">Keep faculty contact and department details organized.</p>
          </div>
          <Link className={styles.backLink} href="/admin">Back to dashboard</Link>
        </header>

        {message && <p className={styles.message} role="status">{message}</p>}

        <div className={styles.layout}>
          <form className={`card ${styles.form}`} onSubmit={saveFaculty}>
            <h2>{editingId === null ? "Add faculty member" : "Edit faculty member"}</h2>
            <label htmlFor="faculty-name">Full name</label>
            <input
              id="faculty-name"
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="e.g. Priya Sharma"
              required
            />
            <label htmlFor="faculty-email">Email</label>
            <input
              id="faculty-email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="faculty@example.com"
              required
            />
            <label htmlFor="faculty-department">Department</label>
            <input
              id="faculty-department"
              name="department"
              value={form.department}
              onChange={updateField}
              placeholder="e.g. Computer Science"
              required
            />
            <button className={styles.primaryButton} type="submit">
              {editingId === null ? "Add faculty member" : "Save changes"}
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
                Cancel edit
              </button>
            )}
          </form>

          <section className={`card ${styles.listCard}`}>
            <div className={styles.listHeader}>
              <div>
                <h2>Faculty directory</h2>
                <p>{faculty.length} {faculty.length === 1 ? "member" : "members"}</p>
              </div>
              <span className={styles.count}>{faculty.length}</span>
            </div>
            {faculty.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>✦</span>
                <h3>No faculty members yet</h3>
                <p>Add a faculty member with the form to get started.</p>
              </div>
            ) : (
              <div className={styles.people}>
                {faculty.map((person) => (
                  <article className={styles.person} key={person.id}>
                    <div className={styles.avatar}>
                      {person.name.trim().charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.personInfo}>
                      <strong>{person.name}</strong>
                      <span>{person.email}</span>
                      <small>{person.department}</small>
                    </div>
                    <div className={styles.personActions}>
                      <button type="button" onClick={() => editFaculty(person)}>Edit</button>
                      <button type="button" onClick={() => deleteFaculty(person.id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
