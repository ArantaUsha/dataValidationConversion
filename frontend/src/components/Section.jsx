import Reveal from "./Reveal.jsx";

export default function Section({ id, tone = "plain", title, subtitle, children, className = "" }) {
  return (
    <section id={id} className={`section tone-${tone} ${className}`.trim()} aria-labelledby={id ? `${id}-title` : undefined}>
      <Reveal className="container">
        {title && (
          <header className="section-head">
            <h2 id={id ? `${id}-title` : undefined}>{title}</h2>
            {subtitle && <p className="subtitle">{subtitle}</p>}
          </header>
        )}
        {children}
      </Reveal>
    </section>
  );
}
