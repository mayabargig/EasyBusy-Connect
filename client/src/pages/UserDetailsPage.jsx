import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { categoryLabel } from "../constants/businessCategories";
import { useAuth } from "../hooks/useAuth";
import { api, getApiErrorMessage } from "../services/api";

function formatDuration(durationMinutes) {
  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

export function UserDetailsPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadProfile() {
      try {
        const response = await api.get(`/users/${userId}`);
        if (isCurrent) setProfile(response.data.user);
      } catch (requestError) {
        if (isCurrent) setError(getApiErrorMessage(requestError));
      }
    }

    loadProfile();
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  if (error) {
    return (
      <section className="page-status section-container">
        <div>
          <h1>Profile unavailable</h1>
          <p>{error}</p>
          <Link className="button secondary" to="/discover">Back to directory</Link>
        </div>
      </section>
    );
  }

  if (!profile) {
    return <section className="page-status section-container"><p>Loading profile…</p></section>;
  }

  const business = profile.businessProfile || {};
  const title = business.name || `${profile.firstName} ${profile.lastName}`;

  return (
    <section className="public-profile-page section-container">
      <Link className="back-link" to="/discover">← Back to directory</Link>

      <header className="public-profile-header">
        <span className="public-profile-avatar">
          {profile.avatarUrl
            ? <img alt={`${title} profile`} src={profile.avatarUrl} />
            : `${profile.firstName[0]}${profile.lastName[0]}`}
        </span>
        <div>
          <span className="category-badge">{categoryLabel(business.category)}</span>
          <h1>{title}</h1>
          <p>{profile.city}{business.address ? ` · ${business.address}` : ""}</p>
          {user.role === "customer" && (
            <Link className="button secondary profile-chat-button" to={`/chat/${profile.id}`}>
              Message business
            </Link>
          )}
        </div>
      </header>

      <div className="public-profile-layout">
        <article className="public-profile-about">
          <span className="eyebrow">About</span>
          <h2>Meet the business</h2>
          <p>{business.description || profile.bio || "More details will be added soon."}</p>
          <dl className="contact-list">
            {business.phone && <><dt>Phone</dt><dd>{business.phone}</dd></>}
            {business.website && <><dt>Website</dt><dd><a href={business.website} rel="noreferrer" target="_blank">Visit website</a></dd></>}
          </dl>
        </article>

        <aside className="services-panel">
          <span className="eyebrow">Services</span>
          <h2>What you can book</h2>
          {business.services?.length ? (
            <div className="public-service-list">
              {business.services.map((service) => (
                <article key={service._id || service.name}>
                  <div>
                    <h3>{service.name}</h3>
                    <p>{service.description || "Service details available from the business."}</p>
                  </div>
                  <div className="service-meta">
                    <span>{formatDuration(service.durationMinutes)}</span>
                    <strong>₪{service.price}</strong>
                    {user.role === "customer" && (
                      <Link className="service-book-link" to={`/book/${profile.id}?serviceId=${service._id}`}>
                        Book
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-inline">No services have been published yet.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
