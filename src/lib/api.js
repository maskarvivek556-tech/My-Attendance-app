
const STORAGE_PREFIX = "attendease_";
const DATA_EVENT = "attendease-data-change";

export function subscribeToData(key, callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const storageKey = STORAGE_PREFIX + key;
  const handleStorage = (event) => {
    if (event.key === storageKey) {
      callback();
    }
  };
  const handleDataChange = (event) => {
    if (event.detail?.key === key) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(DATA_EVENT, handleDataChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(DATA_EVENT, handleDataChange);
  };
}

export function readData(key, fallback = []) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(
      STORAGE_PREFIX + key
    );

    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.error("Unable to read saved data:", error);
    return fallback;
  }
}

export function saveData(key, data) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(
      STORAGE_PREFIX + key,
      JSON.stringify(data)
    );
    window.dispatchEvent(new CustomEvent(DATA_EVENT, { detail: { key } }));

    return true;
  } catch (error) {
    console.error("Unable to save data:", error);
    return false;
  }
}

export function removeData(key) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key);
    return true;
  } catch (error) {
    console.error("Unable to remove saved data:", error);
    return false;
  }
}
