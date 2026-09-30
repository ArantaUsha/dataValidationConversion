import { problem as c } from "../content/pageContent.js";
import Section from "./Section.jsx";

export default function Problem() {
  return (
    <Section id="problem" title={c.title} subtitle={c.subtitle}>
      <ul className="metrics">
        {c.metrics.map((m) => (
          <li key={m.label}>
            <span className="metric-figure">{m.figure}</span>
            <span className="metric-label">{m.label}</span>
          </li>
        ))}
      </ul>
      <p className="context">{c.context}</p>
    </Section>
  );
}
