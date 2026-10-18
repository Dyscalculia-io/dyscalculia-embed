// The package needs no browser to check what matters: the catalog matches the component's constants,
// every combination has code, and the credit wording equals the site's.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const catalog = JSON.parse(readFileSync(new URL("../catalog.json", import.meta.url), "utf8"));
const src = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const list = (name) => JSON.parse(src.match(new RegExp(`const ${name} = (\\[[^\\]]*\\])`))[1]);

const GAMES = list("GAMES");
const LANGS = list("LANGS");
assert.deepEqual(catalog.games.map((g) => g.id), GAMES);
assert.deepEqual(catalog.languages.map((l) => l.code).sort(), [...LANGS].sort());
assert.equal(catalog.total, GAMES.length * LANGS.length);
assert.equal(catalog.items.length, catalog.total);
for (const i of catalog.items) {
  assert.ok(i.script.includes(`data-dysc-game="${i.game}"`) && i.script.includes("https://dyscalculia.io/embed.js"));
  assert.ok(i.component.includes(`game="${i.game}"`) && i.component.includes(`lang="${i.lang}"`));
  assert.equal(i.url, `https://dyscalculia.io/embed/${i.lang}/${i.game}`);
  assert.ok(i.iframe.includes(i.url));
  assert.ok(!/rel=/.test(i.credit) && !/rel=/.test(i.script), "no rel attribute on the credit link");
  assert.ok(!/(diagnos|therapy|treatment|cure)/i.test(JSON.stringify(i)));
}
// The credit phrase in the component equals the one in the catalog, for every language.
for (const l of catalog.languages) {
  const phrase = l.creditLine.replace(/ Dyscalculia\.io$/, "");
  assert.ok(src.includes(`"${phrase}"`) || src.includes(`${l.code === "pt-br" ? '"pt-br"' : l.code}: "${phrase}"`), `${l.code}: credit phrase differs from the component`);
}
assert.ok(!/rel=|noopener/.test(src), "the credit link must not carry rel=noopener");
assert.ok(src.includes('"dysc-embed"'));
const sizes = src.match(/const SIZES = (\{[^}]*\})/)[1].replace(/(\w+):/g, '"$1":');
const SIZES = JSON.parse(sizes);
for (const s of catalog.sizes) assert.deepEqual(SIZES[s.id], [s.width, s.height], `size ${s.id} differs from the catalog`);
for (const f of ["CATALOG.md", "README.md"]) {
  const t = readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
  for (const l of catalog.languages) assert.ok(t.includes(l.creditLine) || f === "README.md", `${f} misses ${l.code}`);
  assert.ok(!/(diagnos|therapy|treatment|cure)\b/i.test(t.replace(/not a diagnosis/gi, "")), `${f}: forbidden wording`);
}
console.log(`ok: ${catalog.total} combinations, ${catalog.charts.length} chart embeds`);
