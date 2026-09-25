import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="not-found section-container">
      <span className="eyebrow">404</span>
      <h1>This page does not exist.</h1>
      <Link className="button primary" to="/">Return home</Link>
    </section>
  );
}

