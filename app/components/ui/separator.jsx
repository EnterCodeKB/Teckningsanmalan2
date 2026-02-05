"use client";
import React from "react";
import styles from "./separator.module.css";

export function Separator({
  orientation = "horizontal",
  decorative = true,
  className = "",
  ...props
}) {
  const cls =
    orientation === "vertical"
      ? `${styles.sep} ${styles.vertical} ${className}`.trim()
      : `${styles.sep} ${styles.horizontal} ${className}`.trim();

  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      className={cls}
      {...props}
    />
  );
}

export default Separator;
