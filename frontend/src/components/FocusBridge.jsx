import { focus } from "../content/pageContent.js";
import Reveal from "./Reveal.jsx";

/** A compact line between "The problem" and "The solution". Not a section: no heading, no body copy. */
export default function FocusBridge() {
  return (
    <div className="bridge" role="group" aria-label={focus.label}>
      <Reveal className="container bridge-inner">
        <span className="bridge-label">{focus.label}</span>
        <ul>
          {focus.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
