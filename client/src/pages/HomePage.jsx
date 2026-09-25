import { Link } from "react-router-dom";

const features = [
  {
    title: "Discover local businesses",
    description: "Search by location, category and community rating.",
  },
  {
    title: "Book without the back-and-forth",
    description: "Choose a service and manage appointments in one place.",
  },
  {
    title: "Build real connections",
    description: "Follow updates, share feedback and chat in real time.",
  },
];

export function HomePage() {
  return (
    <>
      <section className="hero section-container">
        <div className="hero-copy">
          <span className="eyebrow">Your neighborhood, connected</span>
          <h1>Make local business feel personal again.</h1>
          <p>
            EasyBusy Connect brings discovery, community and appointment
            booking into one friendly platform.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/register">Create an account</Link>
            <Link className="button secondary" to="/login">I already have an account</Link>
          </div>
        </div>

        <div className="hero-card" aria-label="Product preview">
          <span className="preview-badge">Coming in the next milestone</span>
          <h2>Find your next favorite place</h2>
          <div className="mock-search">Coffee · Tel Aviv · 4+ stars</div>
          <div className="mock-result">
            <span className="mock-avatar">BC</span>
            <div>
              <strong>Bloom Café</strong>
              <p>Community favorite · 0.8 km away</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features section-container" aria-labelledby="features-title">
        <div className="section-heading">
          <span className="eyebrow">One connected experience</span>
          <h2 id="features-title">Designed for customers and business owners</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature, index) => (
            <article className="feature-card" key={feature.title}>
              <span className="feature-number">0{index + 1}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

