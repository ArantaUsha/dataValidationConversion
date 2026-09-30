// Pure transformation logic: XML text -> JSONL lines. No DOM access, so it runs in the browser and in Node tests.
// The Rules page lists which behaviours are confirmed and which are assumptions.

export const HIERARCHY_COLUMNS = ["Domain Code", "Member Code", "Structure", "Date"];

// Rule sets keyed by FormulierID. The original mechanism is unknown (open question), so this is plain config.
export const DEFAULT_RULES = {
  DEMO_CB77: { booleans: true, businessCode: "cb77-report" },
  DEMO_MB0100: { booleans: true, businessCode: "mrel-demo-01" },
  DEMO_AC3402: { businessCode: "aetc-demo-34" },
};

const EBA_PATTERN = /^EBA_(\w+)_(\w+)/;
const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;
const BOOLEAN_PATTERN = /^(true|false)$/i;

/** Convert a date-ish cell (Date, Excel serial, m/d/yyyy or ISO string) to epoch ms. */
function toTime(v) {
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number") return Math.round((v - 25569) * 86400000);
  const s = String(v ?? "").trim();
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) return Date.UTC(+us[3], +us[1] - 1, +us[2]);
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

/** Latest-date entry wins per (Domain Code, Member Code). Returns Map<"domain|member", {structure, date}>. */
export function buildLookup(rows) {
  const lookup = new Map();
  for (const r of rows) {
    const domain = String(r["Domain Code"] ?? "").trim();
    const member = String(r["Member Code"] ?? "").trim();
    const structure = r["Structure"];
    if (!domain || !member || structure == null || structure === "") continue;
    const time = toTime(r["Date"]);
    const key = `${domain}|${member}`;
    const existing = lookup.get(key);
    if (!existing || time >= existing.time) lookup.set(key, { structure: String(structure), time });
  }
  return lookup;
}

/** Minimal CSV parser (quoted fields, CRLF) returning an array of row objects keyed by header. */
export function parseCsv(text) {
  const rows = [];
  let field = "", row = [], quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x !== "")) rows.push(row);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

/** Python-like numeric normalisation without losing integer precision. Returns a JSON literal or null. */
export function numberLiteral(text) {
  if (!NUMBER_PATTERN.test(text)) return null;
  const negative = text.startsWith("-");
  const [intPart, frac = ""] = text.replace("-", "").split(".");
  const digits = intPart.replace(/^0+(?=\d)/, "");
  if (/^0*$/.test(frac)) return (negative && digits !== "0" ? "-" : "") + digits; // integer-valued -> int
  const n = Number(text); // decimal -> float (precision loss matches float(Decimal(...)))
  return Number.isFinite(n) ? String(n) : null;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1));
    return ENTITIES[e.toLowerCase()];
  });

function parseAttrs(s) {
  const attrs = {};
  for (const m of s.matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attrs[m[1].toLowerCase()] = decode(m[2] ?? m[3]);
  }
  return attrs;
}

export function readMeta(xml) {
  const rap = xml.match(/<rapportage\b([^>]*)>/i);
  const r = rap ? parseAttrs(rap[1]) : {};
  return {
    registratienummer: r.registratienummer,
    formulierId: r.formulierid,
    period: r.period,
    versie: r.versie,
    frequentie: r.frequentie,
    nihil: r.nihil,
  };
}

const json = (v) => JSON.stringify(v);

/**
 * @param {string} xml
 * @param {{lookup?: Map, rules?: object, duplicates?: "keep"|"drop", groupByRijnr?: boolean, traceLimit?: number}} opts
 */
export function convert(xml, opts = {}) {
  const started = Date.now();
  const { lookup = new Map(), rules = DEFAULT_RULES, duplicates = "keep", groupByRijnr = false, traceLimit = 25 } = opts;
  const meta = readMeta(xml);
  const rule = (meta.formulierId && rules[meta.formulierId]) || {};
  const warnings = [];
  const trace = [];
  const cells = []; // {line, rijnr, text}
  const seen = new Map(); // "value|row|col" -> line
  const positions = new Map(); // "row|col" -> {value, line}
  const unmapped = new Map();
  const zeros = { count: 0, line: 0, example: "" };
  const stats = { posts: 0, written: 0, skipped: 0, duplicates: 0, conflicts: 0, hierarchyHits: 0, integers: 0, decimals: 0, booleans: 0, text: 0 };

  // Blank out comments (keeping newlines) so commented-out posts are ignored and line numbers stay right.
  const clean = xml.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "));
  let line = 1, cursor = 0;

  for (const m of clean.matchAll(/<post\b([^>]*?)\/?>/gi)) {
    for (let i = cursor; i < m.index; i++) if (clean.charCodeAt(i) === 10) line++;
    cursor = m.index;
    stats.posts++;

    const a = parseAttrs(m[1]);
    const row = a.rij ?? a.row; // notes show both spellings; accept either
    const col = a.kolom;
    let value = a.value ?? null;
    const steps = [];

    if (!row || !col) {
      stats.skipped++;
      warnings.push({ level: "warn", type: "skipped", line, message: `Post skipped: missing ${!row ? "row (rij)" : "column (kolom)"}.` });
      continue;
    }

    // rijnr is part of the cell identity so the same column in different logical groups is not a duplicate.
    const rijnr = a.rijnr ?? "";
    const dupKey = `${a.value ?? ""}|${row}|${col}|${rijnr}`;
    const firstLine = seen.get(dupKey);
    if (firstLine !== undefined) {
      stats.duplicates++;
      warnings.push({ level: "warn", type: "duplicate", line, message: `Duplicate of line ${firstLine}: value="${a.value ?? ""}" row=${row} col=${col}${rijnr ? " rijnr=" + rijnr : ""}.` });
      if (duplicates === "drop") continue;
    } else {
      seen.set(dupKey, line);
      const prev = positions.get(`${row}|${col}|${rijnr}`);
      if (prev) {
        stats.conflicts++;
        warnings.push({ level: "info", type: "conflict", line, message: `Same cell as line ${prev.line} (${row}/${col}${rijnr ? ", rijnr " + rijnr : ""}) but different value: "${prev.value}" vs "${a.value ?? ""}".` });
      } else positions.set(`${row}|${col}|${rijnr}`, { value: a.value ?? "", line });
    }

    let literal;
    if (value !== null && value !== "") {
      const eba = EBA_PATTERN.exec(value);
      if (eba) {
        const hit = lookup.get(`${eba[1]}|${eba[2]}`);
        if (hit) {
          steps.push(`Hierarchy: ${eba[1]}/${eba[2]} → ${hit.structure}`);
          value = hit.structure;
          stats.hierarchyHits++;
        } else {
          steps.push("Hierarchy: no mapping, code kept");
          if (!unmapped.has(value)) unmapped.set(value, line);
        }
      }
    }
    if (value !== null) {
      value = value.trim();
      if (rule.booleans && BOOLEAN_PATTERN.test(value)) {
        literal = value.toLowerCase();
        stats.booleans++;
        steps.push(`Rule (${meta.formulierId}): boolean`);
      } else {
        const leadingZero = /^-?0\d/.test(value);
        literal = numberLiteral(value);
        if (leadingZero && literal !== null) {
          if (!zeros.count++) Object.assign(zeros, { line, example: `${value} → ${literal}` });
        }
        if (literal !== null) {
          const isInt = /^-?\d+$/.test(literal);
          isInt ? stats.integers++ : stats.decimals++;
          steps.push(isInt ? "Numeric: integer" : "Numeric: decimal");
        } else {
          literal = json(value);
          if (!steps.length) steps.push("Kept as text");
          stats.text++;
        }
      }
    } else literal = "null";

    const fields = [
      `"axis_row": ${json(row.replace("r_", ""))}`,
      `"axis_col": ${json(col.replace("c_", ""))}`,
      `"Value": ${literal}`,
    ];
    if (rule.businessCode) fields.push(`"report_code": ${json(rule.businessCode)}`);
    const text = `{${fields.join(", ")}}`;
    cells.push({ line, rijnr, text });
    if (trace.length < traceLimit) trace.push({ line, source: { value: a.value ?? null, row, col, rijnr }, steps, out: text });
  }

  for (const [code, at] of unmapped) {
    warnings.push({ level: "info", type: "unmapped", line: at, message: `No hierarchy mapping for ${code}; original code kept in output (check the Hierarchies sheet).` });
  }
  if (zeros.count) {
    warnings.push({ level: "info", type: "leading-zero", line: zeros.line, message: `${zeros.count} value(s) had leading zeros dropped by numeric conversion (first: ${zeros.example}). Numbers are emitted as values, so check the source if these were meant as identifiers.` });
  }
  if (!stats.posts) warnings.push({ level: "warn", type: "empty", line: 0, message: "No <post> elements found." });
  if (!meta.formulierId) warnings.push({ level: "info", type: "meta", line: 0, message: "No FormulierId found on <rapportage>; only generic rules applied." });
  warnings.sort((x, y) => x.line - y.line);

  let lines;
  if (groupByRijnr) {
    const groups = new Map();
    for (const c of cells) (groups.get(c.rijnr) ?? groups.set(c.rijnr, []).get(c.rijnr)).push(c.text);
    lines = [...groups].map(([n, texts]) => `{"rijnr": ${json(n)}, "cells": [${texts.join(", ")}]}`);
  } else lines = cells.map((c) => c.text);

  stats.written = cells.length;
  stats.leadingZeros = zeros.count;
  stats.outputLines = lines.length;
  stats.ms = Date.now() - started;
  return { meta, rule, lines, warnings, trace, stats };
}
