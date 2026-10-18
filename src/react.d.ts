import type { ReactElement } from "react";
export function Game(props: {
  game: "dots" | "symbolic" | "compare" | "numberline" | "digitspan";
  lang?: "en" | "de" | "es" | "fr" | "nl" | "pt-br";
  size?: "compact" | "standard" | "wide";
}): ReactElement;
