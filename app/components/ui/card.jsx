"use client";
import React from "react";
import styles from "./card.module.css";

function cx(...cls) {
  return cls.filter(Boolean).join(" ");
}

export const Card = React.forwardRef(function Card(
  { className, ...props },
  ref
) {
  return <div ref={ref} className={cx(styles.card, className)} {...props} />;
});

export const CardHeader = React.forwardRef(function CardHeader(
  { className, ...props },
  ref
) {
  return (
    <div ref={ref} className={cx(styles.cardHeader, className)} {...props} />
  );
});

export const CardTitle = React.forwardRef(function CardTitle(
  { className, as: Tag = "h3", ...props },
  ref
) {
  return (
    <Tag ref={ref} className={cx(styles.cardTitle, className)} {...props} />
  );
});

export const CardDescription = React.forwardRef(function CardDescription(
  { className, ...props },
  ref
) {
  return (
    <p ref={ref} className={cx(styles.cardDescription, className)} {...props} />
  );
});

export const CardContent = React.forwardRef(function CardContent(
  { className, ...props },
  ref
) {
  return (
    <div ref={ref} className={cx(styles.cardContent, className)} {...props} />
  );
});

export const CardFooter = React.forwardRef(function CardFooter(
  { className, ...props },
  ref
) {
  return (
    <div ref={ref} className={cx(styles.cardFooter, className)} {...props} />
  );
});
