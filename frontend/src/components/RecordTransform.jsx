import { useState } from "react";
import { record as c } from "../content/pageContent.js";
import { snapshot } from "../data/selectors.js";
import Section from "./Section.jsx";

// Lets long JSON wrap at commas only, never mid-word.
const breakAtCommas = (text) =>
  text.split(",").flatMap((part, i, all) => (i < all.length - 1 ? [part + ",", <wbr key={i} />] : [part]));

/** The single interaction on the page. All values come from the snapshot produced by the Python processor. */
export default function RecordTransform() {
  const [runs, setRuns] = useState(0);
  const ran = runs > 0;
  const { stages } = snapshot.example;
  const map = stages.excel_mapping;

  const bodies = [
    <code key="xml">{stages.xml_input}</code>,
    <div key="excel" className="mapping">
      <span>{map.domain}</span>
      <span>{map.member}</span>
      <strong>{map.structure}</strong>
      <small>{c.latestNote}</small>
    </div>,
    <p key="rule">{stages.business_rule}</p>,
    <code key="out" className="commas">{breakAtCommas(stages.jsonl_output)}</code>,
  ];

  return (
    <Section id="record" title={c.title} subtitle={c.subtitle}>
      <div className="run-row">
        <button type="button" className="btn btn-primary" onClick={() => setRuns((n) => n + 1)}>
          {c.button}
        </button>
      </div>

      <ol className={`stages${ran ? " ran" : ""}`} key={runs} aria-live="polite">
        {c.stages.map((s, i) => {
          const lit = ran || i === 0;
          return (
            <li key={s.title} className={`stage${lit ? " lit" : ""}`} style={{ "--i": i }} data-testid={`stage-${i + 1}`}>
              <span className="stage-n">{i + 1}</span>
              <h3>{s.title}</h3>
              <div className="stage-body">{lit ? bodies[i] : <p className="waiting">{s.waiting}</p>}</div>
            </li>
          );
        })}
      </ol>

      <p className={`end-label${ran ? " show" : ""}`}>{ran ? c.endLabel : " "}</p>
      <p className="fine center">{c.note}</p>
    </Section>
  );
}
