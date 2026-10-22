const SESSION_KEY = "attendease_session";
const SESSION_EVENT = "attendease-session-change";
const VALID_ROLES = new Set(["admin", "faculty", "student"]);

function isValidSession(session) {
  if (!session || typeof session !== "object") {
    return false;
  }

  if (!session.id || !session.email || !session.role || !VALID_ROLES.has(session.role)) {
    return false;
  }

  return true;
}

function normalizeSession(session) {
  if (!isValidSession(session)) {
    return null;
  }

  return {
    id: session.id,
    role: session.role,
    name: session.name || "",
    email: session.email,
    rollNo: session.rollNo || "",
  };
}

export function readSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(SESSION_KEY);
    if (!value) {
      return null;
    }

    const session = JSON.parse(value);
    const normalized = normalizeSession(session);

    if (!normalized) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return normalized;
  } catch (error) {
    console.error("Unable to read saved session:", error);
    window.localStorage.removeItem(SESSION_KEY);
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

  const normalized = normalizeSession(session);
  if (!normalized) {
    return false;
  }

  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
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
    const session = JSON.parse(snapshot);
    return normalizeSession(session);
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
