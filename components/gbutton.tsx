import type { ButtonHTMLAttributes } from "react";

type GButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "deep";
};

export function GButton({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: GButtonProps) {
  return (
    <button
      type={type}
      className={`min-h-gbutton rounded-gbutton px-6 font-body text-[15px] font-medium text-white transition-colors ${
        variant === "primary"
          ? "bg-ggreen-primary hover:bg-ggreen-deep"
          : "bg-ggreen-deep hover:bg-ggreen-primary"
      } ${className}`}
      {...props}
    />
  );
}