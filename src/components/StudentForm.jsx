
"use client";

import { useState } from "react";
import styles from "./StudentForm.module.css";

const initialValues = {
  name: "",
  rollNo: "",
  email: "",
  course: "",
};

export default function StudentForm({ onSubmit }) {
  const [form, setForm] = useState(initialValues);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit?.(form);
    setForm(initialValues);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>Add Student</h2>

      <label htmlFor="student-name">Full name</label>
      <input
        id="student-name"
        name="name"
        value={form.name}
        onChange={handleChange}
        required
      />

      <label htmlFor="student-roll">Roll number</label>
      <input
        id="student-roll"
        name="rollNo"
        value={form.rollNo}
        onChange={handleChange}
        required
      />

      <label htmlFor="student-email">Email</label>
      <input
        id="student-email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        required
      />

      <label htmlFor="student-course">Course</label>
      <input
        id="student-course"
        name="course"
        value={form.course}
        onChange={handleChange}
        required
      />

      <button type="submit">Add Student</button>
    </form>
  );
}
