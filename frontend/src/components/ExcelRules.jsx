import { excel as c } from "../content/pageContent.js";
import { snapshot } from "../data/selectors.js";
import Section from "./Section.jsx";

export default function ExcelRules() {
  const first = snapshot.excel_rows[0];
  return (
    <Section id="excel" tone="soft" title={c.title} subtitle={c.subtitle}>
      <div className="excel-grid">
        <div>
          <table className="sheet">
            <thead>
              <tr>
                {c.columns.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snapshot.excel_rows.map((r) => (
                <tr key={r.domain + r.member}>
                  <td>{r.domain}</td>
                  <td>{r.member}</td>
                  <td>{r.structure}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="lookup">
            <code>EBA_{first.domain}_{first.member}</code> <span aria-hidden="true">→</span>{" "}
            <code>
              {first.domain} + {first.member}
            </code>{" "}
            <span aria-hidden="true">→</span> <strong>{first.structure}</strong>
          </p>
        </div>

        <ul className="rule-pills">
          {c.rules.map((r) => (
            <li key={r.title}>
              <strong>{r.title}</strong>
              <span>{r.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="fine">{c.note}</p>
    </Section>
  );
}
