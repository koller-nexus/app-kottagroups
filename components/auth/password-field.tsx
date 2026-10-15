"use client";

import { useState, type ComponentProps } from "react";
import { Field } from "@/components/auth/field";

type PasswordFieldProps = Omit<ComponentProps<typeof Field>, "type" | "addon">;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      {...props}
      type={visible ? "text" : "password"}
      addon={
        <button
          type="button"
          aria-pressed={visible}
          aria-controls={props.id}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setVisible((current) => !current)}
          className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-kotta-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kotta-primary"
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      }
    />
  );
}
