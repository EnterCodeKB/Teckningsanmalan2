"use client";
import React from "react";
import styles from "./Button.module.css";

/**
 * Props:
 * - variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
 * - size: "sm" | "default" | "lg" | "icon"
 * - className: extra CSS-klasser
 */
export function Button({
  variant = "default",
  size = "default",
  className = "",
  type = "button",
  ...props
}) {
  const cls = `${styles.btn} ${styles[`variant_${variant}`] || ""} ${
    styles[`size_${size}`] || ""
  } ${className}`.trim();

  return <button type={type} className={cls} {...props} />;
}

export default Button;
