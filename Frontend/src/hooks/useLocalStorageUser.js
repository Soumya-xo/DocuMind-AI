import { useEffect, useMemo, useState } from "react";

const safeParseUser = (raw) => {
  try {
    return JSON.parse(raw || "{}") || {};
  } catch {
    return {};
  }
};

/**
 * Reactive localStorage user hook.
 * - Same-tab updates: listens to a custom `userUpdated` event.
 * - Cross-tab updates: listens to the `storage` event.
 */
export function useLocalStorageUser() {
  const [user, setUser] = useState(() =>
    safeParseUser(localStorage.getItem("user") || "{}"),
  );

  const refresh = () => {
    setUser(safeParseUser(localStorage.getItem("user") || "{}"));
  };

  useEffect(() => {
    const onUserUpdated = () => refresh();
    const onStorage = (e) => {
      if (e.key === "user") refresh();
    };

    window.addEventListener("userUpdated", onUserUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("userUpdated", onUserUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Avoid accidental re-renders from parsing in render.
  return useMemo(() => user || {}, [user]);
}
