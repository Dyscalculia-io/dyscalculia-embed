// Builds catalog.json and CATALOG.md from the dyscalculia.io site's own embed list (lib/embedGames.ts,
// content/embed.ts), so the README and docs never list a game or language the site does not serve.
//
//   node scripts/build-catalog.mjs [path/to/dyscalculia_marketing]     (or DYSC_SITE=...)
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const site = resolve(process.argv[2] ?? process.env.DYSC_SITE ?? new URL("../../../dyscalculia_marketing", import.meta.url).pathname);
const { createJiti } = await import(`${site}/node_modules/jiti/lib/jiti.mjs`);
const jiti = createJiti(`${site}/x.mjs`, { alias: { "@": site }, jsx: true });
const { EMBED_GAMES, EMBED_LOCALES, EMBED_SIZES, embedTargets, embedPath, homeUrlFor } = await jiti.import(`${site}/lib/embedGames.ts`);
const { EMBED_HEIGHTS } = await jiti.import(`${site}/lib/embedHeights.ts`);
const { EMBED_STRINGS } = await jiti.import(`${site}/content/embed.ts`);
const { localeContent } = await jiti.import(`${site}/content/pages/index.ts`);

const ORIGIN = "https://dyscalculia.io";
const UPDATED = "2026-10-18";
const LANG_NAME = { en: "English", de: "German", es: "Spanish", fr: "French", nl: "Dutch", "pt-br": "Brazilian Portuguese" };

// Chart embeds on the statistics page: the site's own embedCode() output, English page.
const { embedCode } = await jiti.import(`${site}/lib/statsExport.ts`);
const { pageContent } = await jiti.import(`${site}/content/pages/index.ts`);
const { ROUTES } = await jiti.import(`${site}/i18n/slugs.ts`);
const { anchor } = await jiti.import(`${site}/components/site/Blocks.tsx`);
const statsPage = pageContent(ROUTES.statistics, "en");
const charts = statsPage.sections.flatMap((s, i) => (s.chart ? [{
  id: `chart-${i + 1}`, title: s.chart.title,
  svg: `${ORIGIN}/data/dyscalculia-statistics-chart-${i + 1}.svg`,
  page: `${ORIGIN}/dyscalculia-statistics#${anchor(s.h2.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"))}-chart`,
  html: embedCode("en", s.chart, i, `${anchor(s.h2)}-chart`, "Source"),
}] : []));

const games = EMBED_GAMES.map((g) => ({ id: g.id, name: localeContent("en").ui.test.games[g.key], what: g.what }));
const items = embedTargets().map((t) => {
  const g = EMBED_GAMES.find((x) => x.id === t.game);
  const name = localeContent(t.locale).ui.test.games[g.key];
  const url = `${ORIGIN}${embedPath(t)}`;
  const lang = t.locale === "en" ? "" : ` data-lang="${t.locale}"`;
  return {
    game: t.game, lang: t.locale, name, url,
    script: `<div data-dysc-game="${t.game}"${lang}></div>\n<script async src="${ORIGIN}/embed.js"></script>`,
    component: `<dyscalculia-game game="${t.game}" lang="${t.locale}"></dyscalculia-game>`,
    react: `<Game game="${t.game}" lang="${t.locale}" />`,
    iframe: `<iframe src="${url}" title="${EMBED_STRINGS[t.locale].frameTitle}" width="480" height="${EMBED_HEIGHTS[t.game].standard}" style="border:0;width:100%;max-width:480px" loading="lazy"></iframe>`,
    credit: `${EMBED_STRINGS[t.locale].credit} <a href="${homeUrlFor(t.locale)}" target="_blank">Dyscalculia.io</a>`,
  };
});
const catalog = {
  generatedFrom: "dyscalculia.io lib/embedGames.ts and content/embed.ts",
  updated: UPDATED,
  total: items.length,
  languages: EMBED_LOCALES.map((code) => ({ code, name: LANG_NAME[code], creditLine: `${EMBED_STRINGS[code].credit} Dyscalculia.io`, home: homeUrlFor(code) })),
  sizes: EMBED_SIZES.map((s) => ({ id: s.id, width: s.w, height: Math.max(...EMBED_GAMES.map((g) => EMBED_HEIGHTS[g.id][s.id])) })),
  games,
  items,
  charts,
};
writeFileSync(new URL("../catalog.json", import.meta.url), JSON.stringify(catalog, null, 1) + "\n");

const md = [
  "# Game catalog",
  "",
  `Every game and language you can pass to \`data-dysc-game\` / \`game\` and \`data-lang\` / \`lang\`. Generated from the live site list: ${games.length} games in ${catalog.languages.length} languages, ${items.length} combinations, updated ${UPDATED}; machine-readable: [\`catalog.json\`](catalog.json) or <https://docs.dyscalculia.io/embed-catalog.json>.`,
  "",
  "These are **practice games**: no score, no result, not a test. English is the default language (`data-lang` can be left out).",
  "",
  "| Language | `lang` | Credit line written under the game |",
  "|---|---|---|",
  ...catalog.languages.map((l) => `| ${l.name} | \`${l.code}\` | ${l.creditLine} |`),
  "",
  ...games.flatMap((g) => [
    `## \`${g.id}\` — ${g.name}`,
    "",
    g.what,
    "",
    "| Language | Name in that language | Script code | Frame address |",
    "|---|---|---|---|",
    ...items.filter((i) => i.game === g.id).map((i) => `| \`${i.lang}\` | ${i.name} | \`<div data-dysc-game="${i.game}"${i.lang === "en" ? "" : ` data-lang="${i.lang}"`}></div>\` | ${i.url} |`),
    "",
  ]),
  "## Chart embeds",
  "",
  "The statistics page also gives embed code for its charts: a standalone SVG (CC BY 4.0) with a caption that links back to the page. Copy-ready HTML for each of the " + charts.length + " charts:",
  "",
  ...charts.flatMap((c) => [`### ${c.title}`, "", `Image: ${c.svg} · On the page: ${c.page}`, "", "```html", c.html, "```", ""]),
  "Every row needs the one script tag once per page: `<script async src=\"https://dyscalculia.io/embed.js\"></script>`. The web component form is",
  "`<dyscalculia-game game=\"dots\" lang=\"de\"></dyscalculia-game>` and the React form is `<Game game=\"dots\" lang=\"de\" />`.",
  "",
  `Sizes (all games): ${catalog.sizes.map((s) => `\`${s.id}\` ${s.width} x ${s.height} px`).join(", ")}.`,
  "",
];
writeFileSync(new URL("../CATALOG.md", import.meta.url), md.join("\n"));
console.log(`catalog: ${games.length} games x ${catalog.languages.length} languages = ${items.length}`);
