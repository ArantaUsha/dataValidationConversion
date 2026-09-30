import { builtWith as c } from "../content/pageContent.js";
import Section from "./Section.jsx";

export default function BuiltWith() {
  return (
    <Section id="built-with" title={c.title}>
      <ul className="tech">
        {c.items.map((t) => (
          <li key={t.name}>
            <span className="tag">{t.name}</span>
            <span>{t.text}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
