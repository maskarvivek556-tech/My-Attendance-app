import { readData, saveData } from "@/lib/api";

const ACCOUNTS_KEY = "accounts";
const HASH_ITERATIONS = 120000;

export function readAccounts() {
  return readData(ACCOUNTS_KEY, []);
}

export function hasAdminAccount() {
  return readAccounts().some((account) => account.role === "admin");
}

function encodeBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

async function hashPassword(password, salt) {
  if (!window.crypto?.subtle) {
    throw new Error("Secure password hashing is not supported by this browser.");
  }

  const key = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: HASH_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256
  );

  return encodeBase64(new Uint8Array(bits));
}

function decodeBase64(value) {
  return Uint8Array.from(window.atob(value), (character) =>
    character.charCodeAt(0)
  );
}

export async function createAccount({ name, email, password, role, rollNo }) {
  if (typeof window === "undefined") {
    return { ok: false, message: "Accounts can only be created in a browser." };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const accounts = readAccounts();

  if (!cleanName || !cleanEmail || password.length < 8) {
    return {
      ok: false,
      message: "Enter a name, a valid email, and a password with at least 8 characters.",
    };
  }

  if (accounts.some((account) => account.email === cleanEmail)) {
    return { ok: false, message: "An account with this email already exists." };
  }

  if (role === "admin" && accounts.some((account) => account.role === "admin")) {
    return { ok: false, message: "An admin account has already been set up." };
  }

  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const passwordHash = await hashPassword(password, salt);
    const account = {
      id: window.crypto.randomUUID(),
      name: cleanName,
      email: cleanEmail,
      role,
      salt: encodeBase64(salt),
      passwordHash,
      ...(role === "student" ? { rollNo: rollNo.trim() } : {}),
    };
    const updated = [...accounts, account];

    if (!saveData(ACCOUNTS_KEY, updated)) {
      return { ok: false, message: "Unable to save the account in this browser." };
    }

    return { ok: true, account };
  } catch (error) {
    console.error("Unable to create account:", error);
    return {
      ok: false,
      message: error instanceof Error
        ? error.message
        : "Unable to create the account.",
    };
  }
}

export async function authenticateAccount({ email, password, role }) {
  const cleanEmail = email.trim().toLowerCase();
  const account = readAccounts().find(
    (item) => item.email === cleanEmail && item.role === role
  );

  if (!account) {
    return null;
  }

  try {
    const actualHash = await hashPassword(password, decodeBase64(account.salt));
    const actualBytes = decodeBase64(actualHash);
    const expectedBytes = decodeBase64(account.passwordHash);
    let difference = actualBytes.length ^ expectedBytes.length;

    for (let index = 0; index < Math.max(actualBytes.length, expectedBytes.length); index += 1) {
      difference |= (actualBytes[index] || 0) ^ (expectedBytes[index] || 0);
    }

    return difference === 0 ? account : null;
  } catch (error) {
    console.error("Unable to verify account password:", error);
    throw new Error("Unable to verify credentials in this browser.");
  }
}

export function deleteAccount(id) {
  const accounts = readAccounts();
  const account = accounts.find((item) => item.id === id);

  if (!account) {
    return { ok: false, message: "Account was not found." };
  }

  if (
    account.role === "admin" &&
    accounts.filter((item) => item.role === "admin").length <= 1
  ) {
    return { ok: false, message: "The last admin account cannot be deleted." };
  }

  const updated = accounts.filter((item) => item.id !== id);
  if (!saveData(ACCOUNTS_KEY, updated)) {
    return { ok: false, message: "Unable to delete the account from this browser." };
  }

  return { ok: true, accounts: updated };
}
