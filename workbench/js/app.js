import { buildLookup, convert, parseCsv, DEFAULT_RULES, HIERARCHY_COLUMNS } from "./transform.js";
import { SAMPLE_XML, SAMPLE_HIERARCHIES_CSV, generateLargeXml } from "./samples.js";

const $ = (id) => document.getElementById(id);
const PREVIEW_LINES = 200;
const state = { lookup: new Map(), hierLabel: "", result: null, filter: "all" };

// ---------- tabs ----------
document.querySelectorAll(".tabs button").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
    document.querySelectorAll(".panel").forEach((p) => (p.hidden = p.id !== `tab-${b.dataset.tab}`));
  })
);

// ---------- source XML ----------
function setXml(text) {
  $("xmlText").value = text;
  updateChips();
}

function updateChips() {
  const text = $("xmlText").value;
  const posts = (text.match(/<post\b/gi) || []).length;
  const rap = text.match(/<rapportage\b([^>]*)>/i);
  const get = (n) => rap && (rap[1].match(new RegExp(`\\b${n}\\s*=\\s*"([^"]*)"`, "i")) || [])[1];
  const chips = [["Posts", posts.toLocaleString()], ["FormulierID", get("FormulierId")], ["Period", get("period")], ["Frequency", get("frequentie")]]
    .filter(([, v]) => v)
    .map(([k, v]) => `<span class="chip">${k}: <b>${escapeHtml(v)}</b></span>`);
  $("metaChips").innerHTML = chips.join("");
}

async function readFile(file) {
  return await file.text();
}

const drop = $("drop");
["dragenter", "dragover"].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", async (ev) => {
  const f = ev.dataTransfer.files[0];
  if (f) setXml(await readFile(f));
});
$("xmlFile").addEventListener("change", async (ev) => {
  const f = ev.target.files[0];
  if (f) setXml(await readFile(f));
});
$("xmlText").addEventListener("input", updateChips);
$("loadSample").addEventListener("click", () => setXml(SAMPLE_XML));
$("loadLarge").addEventListener("click", () => setXml(generateLargeXml(65000)));

// ---------- hierarchies ----------
function applyHierarchies(rows, label) {
  const missing = HIERARCHY_COLUMNS.filter((c) => !rows.length || !(c in rows[0]));
  if (missing.length) {
    $("hierStatus").textContent = `Missing column(s): ${missing.join(", ")}. Hierarchies not loaded.`;
    $("hierStatus").className = "status err";
    state.lookup = new Map();
    return;
  }
  state.lookup = buildLookup(rows);
  $("hierStatus").textContent = `${label}: ${rows.length} rows → ${state.lookup.size} unique Domain/Member pairs (latest date kept).`;
  $("hierStatus").className = "status";
}

$("hierSample").addEventListener("click", () => applyHierarchies(parseCsv(SAMPLE_HIERARCHIES_CSV), "Sample hierarchies"));

$("hierFile").addEventListener("change", async (ev) => {
  const f = ev.target.files[0];
  if (!f) return;
  try {
    if (/\.csv$/i.test(f.name)) return applyHierarchies(parseCsv(await f.text()), f.name);
    await loadSheetJs();
    const wb = window.XLSX.read(await f.arrayBuffer(), { cellDates: true });
    const sheet = wb.Sheets["Hierarchies"] || wb.Sheets[wb.SheetNames[0]];
    applyHierarchies(window.XLSX.utils.sheet_to_json(sheet, { defval: "" }), `${f.name} (${wb.Sheets["Hierarchies"] ? "Hierarchies" : wb.SheetNames[0]} sheet)`);
  } catch (e) {
    $("hierStatus").textContent = `Could not read file: ${e.message}`;
    $("hierStatus").className = "status err";
  }
});

let sheetJs;
function loadSheetJs() {
  if (window.XLSX) return Promise.resolve();
  sheetJs ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Excel reader could not load (offline?). Export the sheet as CSV instead."));
    document.head.append(s);
  });
  return sheetJs;
}

// ---------- rules ----------
$("rulesText").value = JSON.stringify(DEFAULT_RULES, null, 2);

function readRules() {
  try {
    const rules = JSON.parse($("rulesText").value || "{}");
    $("rulesError").hidden = true;
    return rules;
  } catch (e) {
    $("rulesError").textContent = `Rules JSON is invalid: ${e.message}`;
    $("rulesError").hidden = false;
    return null;
  }
}

// ---------- run ----------
$("run").addEventListener("click", () => {
  const xml = $("xmlText").value.trim();
  if (!xml) return void ($("runHint").textContent = "Add some XML first (try “Load sample”).");
  const rules = readRules();
  if (!rules) return;
  $("runHint").textContent = "";

  $("results").hidden = false;
  const fatal = wellFormedError(xml);
  $("fatal").hidden = !fatal;
  if (fatal) {
    // Original behaviour: a technical parse failure stops the run and no JSONL is produced.
    $("fatal").textContent = `XML could not be parsed, so no JSONL was produced. ${fatal}`;
    for (const id of ["tiles", "warnList", "preview", "trace"]) $(id).innerHTML = "";
    $("warnCount").textContent = $("lineCount").textContent = "";
    state.result = null;
    return;
  }

  const result = convert(xml, {
    lookup: state.lookup,
    rules,
    duplicates: $("dupMode").value,
    groupByRijnr: $("groupMode").checked,
  });
  state.result = result;
  render(result);
  $("results").scrollIntoView({ behavior: "smooth", block: "start" });
});

function wellFormedError(xml) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const err = doc.querySelector("parsererror");
  return err ? err.textContent.split("\n")[0].trim() : "";
}

// ---------- render ----------
function render(r) {
  const s = r.stats;
  const dupWarn = s.duplicates > 0;
  const tiles = [
    ["Posts read", s.posts.toLocaleString()],
    ["Lines written", s.outputLines.toLocaleString()],
    ["Codes resolved", s.hierarchyHits.toLocaleString()],
    ["Numbers", (s.integers + s.decimals).toLocaleString()],
    ["Booleans", s.booleans.toLocaleString()],
    ["Duplicates", s.duplicates.toLocaleString(), dupWarn],
    ["Skipped", s.skipped.toLocaleString(), s.skipped > 0],
    ["Time", `${s.ms} ms`],
  ];
  $("tiles").innerHTML = tiles
    .map(([l, v, w]) => `<div class="tile${w ? " warn" : ""}"><div class="v">${v}</div><div class="l">${l}</div></div>`)
    .join("");

  renderWarnings(r);

  $("lineCount").textContent = `(${r.lines.length.toLocaleString()} lines${r.lines.length > PREVIEW_LINES ? `, showing first ${PREVIEW_LINES}` : ""})`;
  $("preview").textContent = r.lines.slice(0, PREVIEW_LINES).join("\n") || "(no output)";

  $("trace").innerHTML =
    "<thead><tr><th>Line</th><th>Source (value · row · col)</th><th>What happened</th><th>JSONL</th></tr></thead><tbody>" +
    r.trace
      .map(
        (t) =>
          `<tr><td>${t.line}</td><td class="mono">${escapeHtml(String(t.source.value))} · ${escapeHtml(t.source.row)} · ${escapeHtml(t.source.col)}</td><td>${
            t.steps.map(escapeHtml).join("<br>") || "Row/column cleaned"
          }</td><td class="mono">${escapeHtml(t.out)}</td></tr>`
      )
      .join("") +
    "</tbody>";
}

function renderWarnings(r) {
  const types = [...new Set(r.warnings.map((w) => w.type))];
  $("warnFilters").innerHTML = ["all", ...types]
    .map((t) => `<button class="btn" data-f="${t}" aria-pressed="${t === state.filter}">${t}</button>`)
    .join("");
  $("warnFilters").querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => { state.filter = b.dataset.f; renderWarnings(r); })
  );
  const shown = r.warnings.filter((w) => state.filter === "all" || w.type === state.filter);
  $("warnCount").textContent = `(${r.warnings.length})`;
  $("warnList").innerHTML =
    shown
      .slice(0, 500)
      .map((w) => `<li><span class="ln">${w.line ? "line " + w.line : "file"}</span><span class="tag ${w.level === "warn" ? "warn" : ""}">${w.type}</span><span>${escapeHtml(w.message)}</span></li>`)
      .join("") || "<li>No warnings. Clean file.</li>";
}

$("download").addEventListener("click", () => {
  if (!state.result) return;
  const blob = new Blob([state.result.lines.join("\n") + "\n"], { type: "application/x-ndjson" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `${state.result.meta.formulierId || "output"}.jsonl`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
});

$("copy").addEventListener("click", async () => {
  await navigator.clipboard?.writeText($("preview").textContent);
  $("copy").textContent = "Copied";
  setTimeout(() => ($("copy").textContent = "Copy preview"), 1200);
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Start with something to look at.
setXml(SAMPLE_XML);
applyHierarchies(parseCsv(SAMPLE_HIERARCHIES_CSV), "Sample hierarchies");
