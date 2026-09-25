import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/api";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page section-container">
      <div className="auth-intro">
        <span className="eyebrow">Welcome back</span>
        <h1>Continue building local connections.</h1>
        <p>Your feed, appointments and conversations will all live here.</p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <h2>Log in</h2>
          <p>Enter the details you used when creating your account.</p>
        </div>

        {error && <div className="form-alert" role="alert">{error}</div>}

        <label>
          Email
          <input
            autoComplete="email"
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={form.email}
          />
        </label>

        <label>
          Password
          <input
            autoComplete="current-password"
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
        </label>

        <button className="button primary full-width" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>

        <p className="form-switch">
          New to EasyBusy Connect? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </section>
  );
}

