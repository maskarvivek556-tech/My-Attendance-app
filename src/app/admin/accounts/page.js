"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteAccount, readAccounts, createAccount } from "@/lib/auth";
import { readData } from "@/lib/api";
import { readSession } from "@/lib/session";
import styles from "./accounts.module.css";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState(() => readAccounts());
  const [faculty] = useState(() => readData("faculty", []));
  const [students] = useState(() => readData("students", []));
  const [role, setRole] = useState("faculty");
  const [recordId, setRecordId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const people = role === "faculty" ? faculty : students;
  const selectedPerson = people.find((person) => String(person.id) === recordId);
  const accountGroups = [
    { role: "admin", title: "Admin accounts", accounts: accounts.filter((account) => account.role === "admin") },
    { role: "faculty", title: "Faculty accounts", accounts: accounts.filter((account) => account.role === "faculty") },
    { role: "student", title: "Student accounts", accounts: accounts.filter((account) => account.role === "student") },
  ];

  async function addAccount(event) {
    event.preventDefault();
    setMessage("");
    if (!selectedPerson) {
      setMessage(`Add a ${role} record first, then select it here.`);
      return;
    }
    if (password.length < 8) {
      setMessage("Use a password with at least 8 characters.");
      return;
    }
    if (busy) return;

    setBusy(true);
    try {
      const result = await createAccount({
        name: selectedPerson.name,
        email: selectedPerson.email,
        password,
        role,
        ...(role === "student" ? { rollNo: selectedPerson.rollNo } : {}),
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setAccounts((current) => [...current, result.account]);
      setRecordId("");
      setPassword("");
      setMessage(`${role === "faculty" ? "Faculty" : "Student"} login account created.`);
    } catch (error) {
      console.error("Unable to create login account:", error);
      setMessage(error instanceof Error ? error.message : "Unable to create login account.");
    } finally {
      setBusy(false);
    }
  }

  function removeAccount(account) {
    const currentSession = readSession();
    if (currentSession?.id === account.id) {
      setMessage("You cannot delete the account you are currently using.");
      return;
    }

    const result = deleteAccount(account.id);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setAccounts(result.accounts);
    setMessage(`${account.name}'s login account was removed.`);
  }

  return (
    <main className="page">
      <div className={`container ${styles.container}`}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ADMINISTRATION</p>
            <h1 className="pageTitle">Login accounts</h1>
            <p className="pageDescription">
              View registered accounts separately by role and manage Faculty and Student access.
            </p>
          </div>
          <Link className={styles.backLink} href="/admin">Back to dashboard</Link>
        </header>

        {message && <p className={styles.message} role="status">{message}</p>}

        <div className={styles.layout}>
          <form className={`card ${styles.form}`} onSubmit={addAccount}>
            <h2>Register an account</h2>
            <p className={styles.formHint}>
              Passwords are hashed before they are saved in this browser.
            </p>
            <label htmlFor="role">Account type</label>
            <select
              id="role"
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setRecordId("");
              }}
            >
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
            <label htmlFor="record">Registered {role} record</label>
            <select
              id="record"
              value={recordId}
              onChange={(event) => setRecordId(event.target.value)}
              required
            >
              <option value="">Choose a {role}</option>
              {people.map((person) => {
                const alreadyHasAccount = accounts.some(
                  (account) =>
                    account.email === person.email.toLowerCase() &&
                    account.role === role
                );
                return (
                  <option
                    key={person.id}
                    value={person.id}
                    disabled={alreadyHasAccount}
                  >
                    {person.name} — {person.email}
                    {alreadyHasAccount ? " (account exists)" : ""}
                  </option>
                );
              })}
            </select>
            {!people.length && (
              <p className={styles.formHint}>
                No {role} records found. Add one from{" "}
                <Link href={role === "faculty" ? "/admin/faculty" : "/faculty/students"}>
                  {role === "faculty" ? "Manage Faculty" : "Student Management"}
                </Link>{" "}
                first.
              </p>
            )}
            <label htmlFor="account-password">Password</label>
            <input
              id="account-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
              required
            />
            <button className={styles.primaryButton} type="submit" disabled={busy}>
              {busy ? "Creating account…" : "Register account"}
            </button>
          </form>

          <section className={`card ${styles.listCard}`}>
            <div className={styles.listHeader}>
              <div>
                <h2>Registered accounts</h2>
                <p>Only these email/password pairs can sign in.</p>
              </div>
              <span className={styles.count}>{accounts.length}</span>
            </div>
            <div className={styles.accountGroups}>
              {accountGroups.map((group) => (
                <section className={styles.accountGroup} key={group.role} aria-labelledby={`${group.role}-accounts-heading`}>
                  <div className={styles.groupHeader}>
                    <h3 id={`${group.role}-accounts-heading`}>{group.title}</h3>
                    <span className={`${styles.groupCount} ${styles[group.role]}`}>
                      {group.accounts.length}
                    </span>
                  </div>
                  {group.accounts.length ? (
                    <div className={styles.accountList}>
                      {group.accounts.map((account) => (
                        <article className={styles.account} key={account.id}>
                          <span className={`${styles.avatar} ${styles[account.role]}`}>
                            {account.name.charAt(0).toUpperCase()}
                          </span>
                          <div className={styles.accountInfo}>
                            <strong>{account.name}</strong>
                            <span>{account.email}</span>
                            {account.rollNo && <small>Roll no. {account.rollNo}</small>}
                          </div>
                          <button
                            className={styles.deleteButton}
                            type="button"
                            onClick={() => removeAccount(account)}
                          >
                            Remove
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.groupEmpty}>
                      No {group.role} accounts registered yet.
                    </p>
                  )}
                </section>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
