import { jsonlReport as c } from "../content/pageContent.js";
import { gridSample, jsonlSample } from "../data/selectors.js";
import Section from "./Section.jsx";

const fmt = (v) => (typeof v === "number" ? v.toLocaleString("en-US") : String(v));

export default function JsonlToReport() {
  return (
    <Section id="report" tone="soft" title={c.title} subtitle={c.subtitle}>
      <div className="report-grid">
        <pre className="jsonl" aria-label="Example JSONL records">
          {jsonlSample(3).join("\n")}
        </pre>
        <span className="ba-arrow" aria-hidden="true">
          →
        </span>
        <table className="sheet report" aria-label="Simplified report view">
          <thead>
            <tr>
              <th />
              <th>0010</th>
            </tr>
          </thead>
          <tbody>
            {gridSample("0010", 4).map((r) => (
              <tr key={r.row}>
                <th scope="row">{r.row}</th>
                <td>{fmt(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="context">{c.copy}</p>
    </Section>
  );
}
