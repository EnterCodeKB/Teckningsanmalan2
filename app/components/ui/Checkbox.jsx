"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import styles from "./Checkbox.module.css";

export const Checkbox = React.forwardRef(
  ({ className = "", ...props }, ref) => {
    return (
      <CheckboxPrimitive.Root
        ref={ref}
        className={`${styles.root} ${className}`}
        {...props}
      >
        <CheckboxPrimitive.Indicator className={styles.indicator}>
          <Check className={styles.icon} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  }
);

Checkbox.displayName = "Checkbox";
