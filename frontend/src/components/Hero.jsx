import { hero } from "../content/pageContent.js";
import { snapshot } from "../data/selectors.js";

export default function Hero() {
  const { xml_input, jsonl_output } = snapshot.example.stages;
  const prettyJsonl = JSON.stringify(JSON.parse(jsonl_output), null, 2);
  return (
    <header className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1>
            {hero.headline[0]}
            <br />
            <span className="accent">{hero.headline[1]}</span>
          </h1>
          <p className="lede">{hero.copy}</p>
          <a className="btn btn-primary" href="#before-after">
            {hero.cta}
          </a>
          <p className="label-pill">{hero.label}</p>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="mini-card">
            <span className="mini-label">XML</span>
            <code className="pretty">{xml_input.replace(/ (rij|kolom|rijnr)=/g, "\n  $1=")}</code>
          </div>
          <span className="connector" />
          <div className="mini-card mini-center">
            <span className="py-mark">Py</span>
            <span className="mini-label">Transform with Python</span>
          </div>
          <span className="connector" />
          <div className="mini-card">
            <span className="mini-label">JSONL</span>
            <code className="pretty">{prettyJsonl}</code>
          </div>
        </div>
      </div>
    </header>
  );
}
