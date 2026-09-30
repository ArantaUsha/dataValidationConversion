import { demonstrates as c } from "../content/pageContent.js";
import Section from "./Section.jsx";

export default function Demonstrates() {
  return (
    <Section id="demonstrates" tone="soft" title={c.title}>
      <ul className="caps">
        {c.items.map((i) => (
          <li key={i.name}>
            <strong>{i.name}</strong>
            <span>{i.text}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
