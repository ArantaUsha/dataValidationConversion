import { useEffect, useRef, useState } from "react";

/** Fades content in once, the first time it scrolls into view. Renders visible when IntersectionObserver is absent. */
export default function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (shown || !ref.current) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [shown]);

  return (
    <Tag ref={ref} className={`reveal${shown ? " in" : ""} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
