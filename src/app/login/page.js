
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authenticateAccount, createAccount, hasAdminAccount } from "@/lib/auth";
import useHydrated from "@/lib/useHydrated";
import { dashboardForRole, saveSession } from "@/lib/session";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const [role, setRole] = useState("faculty");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const adminExists = hydrated && hasAdminAccount();

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Enter your registered email and password.");
      return;
    }

    if (busy) return;
    setBusy(true);

    try {
      if (!adminExists) {
        if (password.length < 8) {
          setMessage("Use a password with at least 8 characters.");
          return;
        }

        if (password !== confirmPassword) {
          setMessage("The passwords do not match.");
          return;
        }

        const result = await createAccount({
          name,
          email,
          password,
          role: "admin",
        });

        if (!result.ok) {
          setMessage(result.message);
          return;
        }

        if (!startSession(result.account)) {
          setMessage("Admin account was created, but this browser could not save your session. Sign in with the new account.");
          return;
        }

        router.replace("/admin");
        return;
      }

      const account = await authenticateAccount({ email, password, role });
      if (!account) {
        setMessage("Email, password, or account type is incorrect.");
        return;
      }

      if (!startSession(account)) {
        setMessage("Unable to save your session in this browser. Check storage settings and try again.");
        return;
      }

      router.replace(dashboardForRole(account.role));
    } catch (error) {
      console.error("Unable to sign in:", error);
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  function startSession(account) {
    return saveSession({
      id: account.id,
      role: account.role,
      name: account.name,
      email: account.email,
      rollNo: account.rollNo,
    });
  }

  if (!hydrated) {
    return (
      <main className="page appLoading" aria-live="polite">
        <p>Loading sign-in…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <div className={styles.wrapper}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <p className={styles.eyebrow}>ATTENDEASE</p>
          <h1>{adminExists ? "Welcome Back" : "Set Up Admin Account"}</h1>
          <p className={styles.description}>
            {adminExists
              ? "Sign in with your registered account to continue."
              : "Create the first administrator account to secure this workspace."}
          </p>

          {!adminExists && (
            <p className={styles.demoNotice}>
              First-time setup: this account will be the only administrator until it registers other users.
            </p>
          )}

          {!adminExists && (
            <>
              <label htmlFor="name">Administrator name</label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </>
          )}

          {adminExists && (
            <>
              <label htmlFor="role">Account type</label>
              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="faculty">Faculty</option>
                <option value="student">Student</option>
              </select>
            </>
          )}

          <label htmlFor="email">Registered email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={adminExists ? "Enter your password" : "At least 8 characters"}
            autoComplete={adminExists ? "current-password" : "new-password"}
            minLength={adminExists ? undefined : 8}
            required
          />

          {!adminExists && (
            <>
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </>
          )}

          {message && <p className={styles.message}>{message}</p>}

          <button type="submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : adminExists
                ? "Sign in"
                : "Create admin account"}
          </button>
        </form>
      </div>
    </main>
  );
}
