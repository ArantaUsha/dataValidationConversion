import { explore as c, REPO_URL } from "../content/pageContent.js";
import Section from "./Section.jsx";

export default function Explore() {
  return (
    <Section id="explore" className="closing">
      <h2 className="center">{c.title}</h2>
      <p className="subtitle center">{c.copy}</p>
      <p className="center">
        <a className="btn btn-primary" href={REPO_URL} target="_blank" rel="noreferrer">
          {c.cta}
        </a>
      </p>
    </Section>
  );
}
