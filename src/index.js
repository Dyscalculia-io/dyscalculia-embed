/**
 * <dyscalculia-game game="dots" lang="en" size="standard"></dyscalculia-game>
 *
 * Builds an iframe to https://dyscalculia.io/embed/<lang>/<game>, keeps its height equal to its content
 * and writes the visible credit link into the HOST page (light DOM). A link inside the iframe belongs to
 * the game's own document, not to your page, so the credit line is written into yours; the terms
 * (https://dyscalculia.io/embed) ask for it to stay visible.
 *
 * These are PRACTICE games: no score, no result, not a test. The game page loads no analytics and sets no cookies.
 */
const ORIGIN = "https://dyscalculia.io";
// [width, height] in px. The height is the measured tallest state (all rounds and the end screen, six languages), as on the site.
const SIZES = { compact: [360, 560], standard: [480, 560], wide: [720, 560] };
const GAMES = ["dots", "symbolic", "compare", "numberline", "digitspan"];
const LANGS = ["en", "de", "es", "fr", "nl", "pt-br"];
const CREDIT = {
  en: "Free number games by", de: "Kostenlose Zahlenspiele von", es: "Juegos de números gratis de",
  fr: "Jeux de nombres gratuits de", nl: "Gratis getallenspelletjes van", "pt-br": "Jogos de números grátis de",
};
const TITLE = {
  en: "Number game by Dyscalculia.io", de: "Zahlenspiel von Dyscalculia.io", es: "Juego de números de Dyscalculia.io",
  fr: "Jeu de nombres de Dyscalculia.io", nl: "Getallenspel van Dyscalculia.io", "pt-br": "Jogo de números do Dyscalculia.io",
};

export class DyscalculiaGame extends HTMLElement {
  connectedCallback() {
    if (this._mounted) return;
    const game = this.getAttribute("game");
    const lang = (this.getAttribute("lang") || "en").toLowerCase();
    if (!GAMES.includes(game) || !LANGS.includes(lang)) return;
    this._mounted = true;
    const [w, h] = SIZES[this.getAttribute("size")] || SIZES.standard;

    const frame = document.createElement("iframe");
    frame.src = `${ORIGIN}/embed/${lang}/${game}`;
    frame.title = TITLE[lang];
    frame.loading = "lazy";
    frame.width = String(w);
    frame.height = String(h);
    frame.style.cssText = `border:0;width:100%;max-width:${w}px;height:${h}px;display:block;margin:0 auto`;

    const credit = document.createElement("p");
    credit.style.cssText = "text-align:center;font:12px/1.4 system-ui,sans-serif;margin:6px 0 0";
    const a = document.createElement("a");
    a.href = ORIGIN + (lang === "en" ? "/" : `/${lang}`);
    a.target = "_blank";
    a.textContent = "Dyscalculia.io";
    credit.append(`${CREDIT[lang]} `, a);

    this.append(frame, credit);
    this._onMessage = (e) => {
      if (e.origin !== ORIGIN || e.source !== frame.contentWindow) return;
      const m = e.data;
      if (!m || m.source !== "dysc-embed" || m.type !== "resize") return;
      const height = Number(m.height);
      if (Number.isFinite(height) && height >= 120 && height <= 2000) frame.style.height = `${Math.ceil(height)}px`;
    };
    window.addEventListener("message", this._onMessage);
  }
  disconnectedCallback() {
    window.removeEventListener("message", this._onMessage);
    this._mounted = false;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("dyscalculia-game")) {
  customElements.define("dyscalculia-game", DyscalculiaGame);
}
