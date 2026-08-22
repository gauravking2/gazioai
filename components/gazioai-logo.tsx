import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type GazioAILogoProps = HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg";
};

export function GazioAILogo({ className, size = "md", ...props }: GazioAILogoProps) {
  return (
    <div
      aria-label="GAZIOAI"
      role="img"
      className={cn("gazio-logo", `gazio-logo-${size}`, className)}
      {...props}
    >
      <span className="gazio-logo-purple">GAZIO</span>
      <span className="gazio-logo-white">AI</span>
      <span className="gazio-logo-spark">✦</span>
    </div>
  );
}
