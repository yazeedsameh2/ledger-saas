"use client";

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Button({
  variant = "default",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger" | "danger-solid";
  size?: "md" | "sm";
}) {
  const base =
    "inline-flex items-center gap-2 rounded font-semibold whitespace-nowrap transition-all active:scale-[0.98]";
  const sizes = size === "sm" ? "px-3 py-1.5 text-[12.5px]" : "px-4 py-2 text-[13.5px]";
  const variants: Record<string, string> = {
    default: "border border-[var(--line-strong)] hover:border-[var(--ink-soft)]",
    primary: "bg-[var(--accent)] text-[var(--accent-ink)] border border-[var(--accent)] hover:opacity-90",
    ghost: "border border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-black/5",
    danger: "border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)]/10",
    "danger-solid": "bg-[var(--danger)] text-white border border-[var(--danger)] hover:opacity-90",
  };
  return <button className={`${base} ${sizes} ${variants[variant]} ${className}`} {...props} />;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded border border-[var(--line)] bg-[var(--paper-raised)] px-3 py-2.5 text-[15px] transition-colors focus:outline-none focus:border-[var(--accent)] ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded border border-[var(--line)] bg-[var(--paper-raised)] px-3 py-2.5 text-[15px] min-h-[72px] resize-y transition-colors focus:outline-none focus:border-[var(--accent)] ${props.className ?? ""}`}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-[12.5px] font-medium text-[var(--ink-soft)] mb-1.5">
      {children}
    </label>
  );
}

export function Field({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3.5 rounded-lg border border-dashed border-[var(--line-strong)] px-5 py-16 text-center">
      <div className="mb-1 text-[var(--ink-faint)] [&>svg]:w-8 [&>svg]:h-8">{icon}</div>
      <h3 className="text-lg text-[var(--ink)]">{title}</h3>
      <p className="max-w-[320px] text-[13.5px] leading-relaxed text-[var(--ink-soft)]">{description}</p>
      {action}
    </div>
  );
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
        active
          ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]"
          : "border-[var(--line-strong)] text-[var(--ink-soft)] hover:border-[var(--ink-soft)] hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

export function Stack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col divide-y divide-[var(--line)]">{children}</div>;
}

export function ViewHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-10">
      {eyebrow && (
        <div className="mb-1.5 font-mono text-[12.5px] text-[var(--ink-faint)]">{eyebrow}</div>
      )}
      <div className="flex flex-wrap items-baseline gap-3.5">
        <h1 className="font-display text-[30px]">{title}</h1>
        {action && <div className="ml-auto">{action}</div>}
      </div>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3.5 font-mono text-[11.5px] uppercase tracking-wider text-[var(--ink-faint)]">
      {children}
    </div>
  );
}

export function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-[3px] rounded-full bg-[var(--line)] overflow-hidden">
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}
