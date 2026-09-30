import { solution as c } from "../content/pageContent.js";
import { outputFor, asJson } from "../data/selectors.js";
import Section from "./Section.jsx";

export default function Pipeline() {
  return (
    <Section id="solution" tone="soft" title={c.title} subtitle={c.subtitle}>
      <ol className="pipeline">
        {c.nodes.map((n, i) => (
          <li key={n.title} className={`node${n.title === "Transform" ? " node-transform" : ""}`}>
            {n.title === "Transform" && <span className="feeds">{c.excelNote}</span>}
            <span className="node-step">{i + 1}</span>
            <strong>{n.title}</strong>
            <span>{n.text}</span>
          </li>
        ))}
      </ol>

      <h3 className="mini-title">{c.conversionsTitle}</h3>
      <ul className="conversions">
        {c.conversions.map((x) => (
          <li key={x.label}>
            <code>{x.source}</code>
            <span className="conv-label">{x.label}</span>
            <code className="out">{asJson(outputFor(x.source))}</code>
          </li>
        ))}
      </ul>
    </Section>
  );
}
