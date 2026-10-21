const SESSION_KEY = "attendease_session";
const SESSION_EVENT = "attendease-session-change";

export function readSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Unable to read saved session:", error);
    return null;
  }
}

export function getSessionSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch (error) {
    console.error("Unable to read saved session:", error);
    return null;
  }
}

export function subscribeToSession(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener(SESSION_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SESSION_EVENT, callback);
  };
}

export function saveSession(session) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new Event(SESSION_EVENT));
    return true;
  } catch (error) {
    console.error("Unable to save session:", error);
    return false;
  }
}

export function clearSession() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event(SESSION_EVENT));
    return true;
  } catch (error) {
    console.error("Unable to clear session:", error);
    return false;
  }
}

export function parseSession(snapshot) {
  if (!snapshot) {
    return null;
  }

  try {
    return JSON.parse(snapshot);
  } catch (error) {
    console.error("Unable to parse saved session:", error);
    return null;
  }
}

export function dashboardForRole(role) {
  if (role === "admin") return "/admin";
  if (role === "student") return "/students";
  return "/faculty";
}
