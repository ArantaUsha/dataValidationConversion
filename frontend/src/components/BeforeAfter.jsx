import { beforeAfter as c } from "../content/pageContent.js";
import Section from "./Section.jsx";

function Side({ data, kind }) {
  return (
    <div className={`ba-card ba-${kind}`}>
      <p className="ba-label">{data.label}</p>
      <p className="ba-figure">{data.figure}</p>
      <p className="ba-caption">{data.caption}</p>
      <ul>
        {data.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

export default function BeforeAfter() {
  return (
    <Section id="before-after" tone="soft" title={c.title} subtitle={c.subtitle}>
      <div className="ba-grid">
        <Side data={c.before} kind="before" />
        <span className="ba-arrow" aria-hidden="true">
          →
        </span>
        <Side data={c.after} kind="after" />
      </div>
      <p className="fine center">{c.note}</p>
    </Section>
  );
}
