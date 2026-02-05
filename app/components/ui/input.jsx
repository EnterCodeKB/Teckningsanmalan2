"use client";
import React from "react";
import styles from "./input.module.css";

function cx(...cls) {
  return cls.filter(Boolean).join(" ");
}

export const Input = React.forwardRef(function Input(
  { className, type = "text", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cx(styles.input, className)}
      {...props}
    />
  );
});
