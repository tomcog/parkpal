import * as React from "react";
import { cn } from "./ui/utils";

type ButtonStandardTheme = "white" | "green" | "black";

interface ButtonStandardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  theme?: ButtonStandardTheme;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const themeStyles: Record<ButtonStandardTheme, string> = {
  white: [
    "bg-white text-[#0a0a0a]",
    "hover:bg-[#e3e3e3]",
  ].join(" "),
  green: [
    "bg-brand-accent text-white",
    "hover:bg-[#2c971a]",
  ].join(" "),
  black: [
    "bg-[#313730] text-white",
    "hover:bg-[#717182]",
  ].join(" "),
};

export function ButtonStandard({
  theme = "white",
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonStandardProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-[6px]",
        "h-[44px] px-[12.5px]",
        "rounded-[4px] border border-[rgba(0,0,0,0.1)]",
        "text-[14px] font-medium leading-[20px] whitespace-nowrap",
        "transition-colors",
        "disabled:opacity-50 disabled:pointer-events-none",
        themeStyles[theme],
        className,
      )}
    >
      {icon && <span className="size-[20px] flex items-center justify-center flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
