"use client";

import type { CSSProperties } from "react";

interface ShinyTextProps {
  text: string;
  color?: string;
  shineColor?: string;
  className?: string;
  disabled?: boolean;
  speed?: number;
  delay?: number;
  spread?: number;
  direction?: "left" | "right";
  yoyo?: boolean;
  pauseOnHover?: boolean;
}

export default function ShinyText({
  text,
  color = "rgb(17 17 17 / 0.38)",
  shineColor = "rgb(17 17 17 / 0.92)",
  className = "",
  disabled = false,
  speed = 2,
  delay = 0,
  spread = 120,
  direction = "left",
  yoyo = false,
  pauseOnHover = false,
}: ShinyTextProps) {
  const style = {
    "--shiny-text-color": color,
    "--shiny-text-shine-color": shineColor,
    "--shiny-text-speed": `${speed}s`,
    "--shiny-text-delay": `${delay}s`,
    "--shiny-text-spread": `${spread}deg`,
  } as CSSProperties;

  return (
    <span
      className={[
        "shiny-text",
        disabled ? "shiny-text-disabled" : "",
        direction === "right" ? "shiny-text-right" : "",
        yoyo ? "shiny-text-yoyo" : "",
        pauseOnHover ? "shiny-text-pause-on-hover" : "",
        className,
      ].filter(Boolean).join(" ")}
      style={style}
    >
      {text}
    </span>
  );
}
