import { errors as c } from "../content/pageContent.js";
import { issueOfType, runSummary } from "../data/selectors.js";
import Section from "./Section.jsx";

export default function ErrorsReprocess() {
  const dup = issueOfType("duplicate");
  const miss = issueOfType("mapping-miss");
  return (
    <Section id="errors" title={c.title} subtitle={c.subtitle}>
      <ol className="flow3">
        {c.steps.map((s, i) => (
          <li key={s.title} className={i === 0 ? "warn" : ""}>
            <strong>{s.title}</strong>
            <span>{s.text}</span>
          </li>
        ))}
      </ol>
      <div className="issue">
        <p>
          <span className="dot" aria-hidden="true" />
          Duplicate detected · Row {dup.row} · Column {dup.col}
        </p>
        <p className="issue-minor">
          Mapping missing · Row {miss.row} · Column {miss.col} · the original code is kept and flagged
        </p>
        <p className="issue-minor">{runSummary()}</p>
      </div>
      <p className="context">{c.copy}</p>
    </Section>
  );
}
