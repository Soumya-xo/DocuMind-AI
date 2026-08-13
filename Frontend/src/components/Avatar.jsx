import React, { useMemo, useState } from "react";
import { useLocalStorageUser } from "../hooks/useLocalStorageUser.js";

const getInitial = (name) => {
  if (!name || typeof name !== "string") return "U";
  const firstToken = name.trim().split(/\s+/)[0] || "";
  const ch = firstToken[0] || "";
  return ch ? ch.toUpperCase() : "U";
};

const sizeToClasses = {
  xs: "h-7 w-7 text-xs",
  sm: "h-9 w-9 text-sm",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-2xl",
};

const sizeToImgClasses = {
  xs: "h-full w-full object-cover",
  sm: "h-full w-full object-cover",
  md: "h-full w-full object-cover",
  lg: "h-full w-full object-cover",
  xl: "h-full w-full object-cover",
};

/**
 * Avatar component with image-first fallback to name initial.
 *
 * Usage:
 *   <Avatar user={user} size="md" />
 */
export default function Avatar({ user, size = "md", className = "" }) {
  const localUser = useLocalStorageUser();
  const resolvedUser = user || localUser || {};

  const [imgFailed, setImgFailed] = useState(false);

  const avatarSrc = resolvedUser?.avatar;

  const initial = useMemo(
    () => getInitial(resolvedUser?.name),
    [resolvedUser?.name],
  );

  const sizeWrapper = sizeToClasses[size] || sizeToClasses.md;
  const sizeImg = sizeToImgClasses[size] || sizeToImgClasses.md;

  const avatarUrl =
    typeof avatarSrc === "string" &&
    avatarSrc.trim().length > 0 &&
    avatarSrc.startsWith("/uploads")
      ? `http://localhost:5001${avatarSrc}`
      : null;

  const showImage =
    !imgFailed && typeof avatarUrl === "string" && avatarUrl.trim().length > 0;

  return (
    <div
      className={[
        "inline-flex items-center justify-center rounded-full",
        // Neutral styling that works in both themes
        "bg-slate-100 dark:bg-slate-800/60",
        "border border-slate-100/70 dark:border-slate-800/60",
        "text-slate-700 dark:text-slate-200",
        sizeWrapper,
        className,
      ].join(" ")}
      aria-label="User avatar"
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={resolvedUser?.name || "User"}
          className={sizeImg}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="font-semibold select-none">{initial}</span>
      )}
    </div>
  );
}
