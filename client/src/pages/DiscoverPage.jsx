import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { businessCategories, categoryLabel } from "../constants/businessCategories";
import { useJQueryReveal } from "../hooks/useJQueryReveal";
import { api, getApiErrorMessage } from "../services/api";

const initialFilters = { q: "", city: "", category: "" };

export function DiscoverPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [businesses, setBusinesses] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const resultsRef = useRef(null);

  useJQueryReveal(resultsRef, businesses.map((business) => business.id).join("|"));

  const searchBusinesses = useCallback(async (searchFilters) => {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.get("/users", {
        params: {
          role: "business_owner",
          q: searchFilters.q || undefined,
          city: searchFilters.city || undefined,
          category: searchFilters.category || undefined,
          limit: 24,
        },
      });
      setBusinesses(response.data.users);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    searchBusinesses(initialFilters);
  }, [searchBusinesses]);

  function handleChange(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    searchBusinesses(filters);
  }

  function clearFilters() {
    setFilters(initialFilters);
    searchBusinesses(initialFilters);
  }

  return (
    <section className="directory-page section-container">
      <div className="page-heading directory-heading">
        <div>
          <span className="eyebrow">Local directory</span>
          <h1>Find the right business nearby.</h1>
          <p>Search by a keyword, exact city and business category.</p>
        </div>
      </div>

      <form className="search-panel" onSubmit={handleSubmit}>
        <label>
          Keyword
          <input name="q" onChange={handleChange} placeholder="Business or service" value={filters.q} />
        </label>
        <label>
          City
          <input name="city" onChange={handleChange} placeholder="For example: Tel Aviv" value={filters.city} />
        </label>
        <label>
          Category
          <select name="category" onChange={handleChange} value={filters.category}>
            <option value="">All categories</option>
            {businessCategories.map((category) => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
        </label>
        <button className="button primary" disabled={isLoading} type="submit">Search</button>
        <button className="button secondary" onClick={clearFilters} type="button">Clear</button>
      </form>

      {error && <div className="form-alert page-alert" role="alert">{error}</div>}
      {isLoading && <div className="page-status"><p>Loading businesses…</p></div>}

      {!isLoading && businesses.length === 0 && (
        <div className="empty-state">
          <h2>No businesses matched your search.</h2>
          <p>Try removing one of the filters or searching another city.</p>
        </div>
      )}

      {!isLoading && businesses.length > 0 && (
        <div className="business-grid" ref={resultsRef}>
          {businesses.map((business) => {
            const profile = business.businessProfile || {};
            return (
              <article className="business-card" data-jquery-reveal key={business.id}>
                <div className="business-card-topline">
                  <span className="business-avatar">
                    {business.avatarUrl
                      ? <img alt="" src={business.avatarUrl} />
                      : `${business.firstName[0]}${business.lastName[0]}`}
                  </span>
                  <span className="category-badge">{categoryLabel(profile.category)}</span>
                </div>
                <div>
                  <h2>{profile.name || `${business.firstName} ${business.lastName}`}</h2>
                  <p className="business-location">{business.city}</p>
                  <p className="business-description">
                    {profile.description || business.bio || "This business is preparing its profile."}
                  </p>
                </div>
                <div className="business-card-footer">
                  <span>{profile.services?.length || 0} services</span>
                  <Link to={`/users/${business.id}`}>View profile →</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
