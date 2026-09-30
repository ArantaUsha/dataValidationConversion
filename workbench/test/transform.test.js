import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLookup, convert, numberLiteral, parseCsv, DEFAULT_RULES } from "../js/transform.js";
import { SAMPLE_XML, SAMPLE_HIERARCHIES_CSV, generateLargeXml } from "../js/samples.js";

const lookup = buildLookup(parseCsv(SAMPLE_HIERARCHIES_CSV));
const wrap = (posts, id = "X") =>
  `<rapportage FormulierID="${id}">\n${posts}\n</rapportage>`;

test("numeric normalisation keeps integers exact and floats as floats", () => {
  assert.equal(numberLiteral("123456789123456789"), "123456789123456789");
  assert.equal(numberLiteral("42.00"), "42");
  assert.equal(numberLiteral("-0"), "0");
  assert.equal(numberLiteral("0.93"), "0.93");
  assert.equal(numberLiteral("1e5"), null);
  assert.equal(numberLiteral("apple"), null);
});

test("hierarchy lookup keeps the latest dated entry", () => {
  assert.equal(lookup.get("FIN|X01").structure, "Corporate Lending");
});

test("generic output matches the documented JSONL shape", () => {
  const r = convert(wrap(`<post value="apple" rij="r_0010" kolom="c_0010"/><post value="0.93" rij="r_0020" kolom="c_0010"/>`), { lookup });
  assert.deepEqual(r.lines, [
    '{"axis_row": "0010", "axis_col": "0010", "Value": "apple"}',
    '{"axis_row": "0020", "axis_col": "0010", "Value": 0.93}',
  ]);
});

test("EBA codes are mapped, and unmapped codes are kept and reported", () => {
  const r = convert(wrap(`<post value="EBA_FIN_X01" rij="r_1" kolom="c_1"/><post value="EBA_FIN_X99" rij="r_2" kolom="c_1"/>`), { lookup });
  assert.match(r.lines[0], /"Value": "Corporate Lending"/);
  assert.match(r.lines[1], /"Value": "EBA_FIN_X99"/);
  assert.ok(r.warnings.some((w) => w.type === "unmapped"));
});

test("boolean rule only applies to configured FormulierIDs", () => {
  const post = `<post value="FALSE" rij="r_1" kolom="c_1"/>`;
  assert.match(convert(wrap(post, "DEMO_MB0100"), { lookup }).lines[0], /"Value": false/);
  assert.match(convert(wrap(post, "OTHER"), { lookup }).lines[0], /"Value": "FALSE"/);
});

test("business code mapping is added from the FormulierID rule", () => {
  const r = convert(wrap(`<post value="1" rij="r_1" kolom="c_1"/>`, "DEMO_AC3402"), { lookup, rules: DEFAULT_RULES });
  assert.match(r.lines[0], /"report_code": "aetc-demo-34"/);
});

test("duplicates are warned with line numbers and the run continues", () => {
  const r = convert(wrap(`<post value="ABC" rij="r_1" kolom="c_1"/>\n<post value="ABC" rij="r_1" kolom="c_1"/>`), { lookup });
  const dup = r.warnings.find((w) => w.type === "duplicate");
  assert.equal(dup.line, 3);
  assert.match(dup.message, /line 2/);
  assert.equal(r.lines.length, 2);
  assert.equal(convert(wrap(`<post value="A" rij="r_1" kolom="c_1"/><post value="A" rij="r_1" kolom="c_1"/>`), { lookup, duplicates: "drop" }).lines.length, 1);
});

test("commented-out posts are ignored and both row spellings work", () => {
  const r = convert(wrap(`<!-- <post value="x" rij="r_1" kolom="c_1"/> -->\n<post value="y" row="r_2" kolom="c_1"/>`), { lookup });
  assert.equal(r.stats.posts, 1);
});

test("rijnr grouping is an opt-in output mode", () => {
  const r = convert(wrap(`<post value="1" rij="r_1" kolom="c_1" rijnr="1"/><post value="2" rij="r_2" kolom="c_1" rijnr="1"/><post value="3" rij="r_3" kolom="c_1" rijnr="2"/>`), { lookup, groupByRijnr: true });
  assert.equal(r.lines.length, 2);
  assert.equal(JSON.parse(r.lines[0]).cells.length, 2);
});

test("the same column in different rijnr groups is not a duplicate", () => {
  const r = convert(wrap(`<post value="EBA_FIN_X02" rij="r_1" kolom="c_1" rijnr="1"/><post value="EBA_FIN_X02" rij="r_1" kolom="c_1" rijnr="2"/>`), { lookup });
  assert.equal(r.stats.duplicates, 0);
  assert.equal(r.stats.conflicts, 0);
  assert.doesNotMatch(r.lines[1], /rijnr/);
});

test("leading zeros: numbers are emitted as values, with a notice", () => {
  const post = wrap(`<post value="00123" rij="r_1" kolom="c_1"/>`);
  const def = convert(post, { lookup });
  assert.match(def.lines[0], /"Value": 123/);
  assert.ok(def.warnings.some((w) => w.type === "leading-zero"));
});

test("demo file metadata is read (FormulierID, period, registratienummer)", () => {
  const m = convert(SAMPLE_XML, { lookup }).meta;
  assert.equal(m.period, "2024-06-30");
  assert.equal(m.registratienummer, "DEMO-104");
});

test("every emitted line is valid JSON for the sample and a 65k-post file", () => {
  const s = convert(SAMPLE_XML, { lookup });
  s.lines.forEach((l) => JSON.parse(l));
  assert.equal(s.meta.formulierId, "DEMO_CB77");
  const big = convert(generateLargeXml(65000), { lookup });
  assert.equal(big.stats.posts, 65000);
  big.lines.forEach((l) => JSON.parse(l));
});
