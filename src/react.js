import { createElement, useEffect } from "react";

/** React wrapper: <Game game="dots" lang="en" size="standard" />. Registers the web component on the client only. */
export function Game({ game, lang = "en", size = "standard" }) {
  useEffect(() => { import("./index.js"); }, []);
  return createElement("dyscalculia-game", { game, lang, size });
}
