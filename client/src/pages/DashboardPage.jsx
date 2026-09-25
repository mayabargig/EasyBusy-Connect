import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function DashboardPage() {
  const { user } = useAuth();
  const accountType = user.role === "business_owner" ? "Business owner" : "Customer";

  return (
    <section className="dashboard section-container">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">Your private dashboard</span>
          <h1>Welcome, {user.firstName}.</h1>
          <p>Your account is connected to MongoDB and ready for the community.</p>
        </div>
        <span className="role-badge">{accountType}</span>
      </div>

      <div className="dashboard-grid">
        <article className="profile-panel">
          <span className="avatar-placeholder" aria-hidden="true">
            {user.firstName[0]}{user.lastName[0]}
          </span>
          <div>
            <h2>{user.firstName} {user.lastName}</h2>
            <p>{user.email}</p>
            <p>{user.city}</p>
          </div>
        </article>

        <article className="next-panel">
          <span className="eyebrow">Continue your journey</span>
          <h2>{user.role === "business_owner" ? "Complete your business page" : "Discover nearby businesses"}</h2>
          <p>
            {user.role === "business_owner"
              ? "Add your services and contact details so customers can find you."
              : "Search local businesses by name, city and category."}
          </p>
          <div className="panel-actions">
            <Link className="button primary" to={user.role === "business_owner" ? "/profile" : "/discover"}>
              {user.role === "business_owner" ? "Edit my profile" : "Explore businesses"}
            </Link>
            <Link className="button inverted" to="/discover">Open directory</Link>
            <Link className="button inverted" to="/posts">Community posts</Link>
            <Link className="button inverted" to="/appointments">
              {user.role === "business_owner" ? "Manage appointments" : "My appointments"}
            </Link>
            <Link className="button inverted" to="/chat">Open chat</Link>
            <Link className="button inverted" to="/stats">View statistics</Link>
          </div>
        </article>
      </div>
    </section>
  );
}
