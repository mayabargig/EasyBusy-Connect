import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/api";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "customer",
  city: "",
};

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
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
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page section-container">
      <div className="auth-intro">
        <span className="eyebrow">Join the community</span>
        <h1>One account, many local connections.</h1>
        <p>Choose the account type that best describes how you will use the platform.</p>
      </div>

      <form className="auth-card auth-card-wide" onSubmit={handleSubmit}>
        <div>
          <h2>Create your account</h2>
          <p>All fields are required. You can update your profile later.</p>
        </div>

        {error && <div className="form-alert" role="alert">{error}</div>}

        <div className="form-grid">
          <label>
            First name
            <input name="firstName" onChange={handleChange} required value={form.firstName} />
          </label>
          <label>
            Last name
            <input name="lastName" onChange={handleChange} required value={form.lastName} />
          </label>
        </div>

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
            aria-describedby="password-help"
            autoComplete="new-password"
            minLength="8"
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
          <small id="password-help">At least 8 characters, with uppercase, lowercase and a number.</small>
        </label>

        <div className="form-grid">
          <label>
            Account type
            <select name="role" onChange={handleChange} value={form.role}>
              <option value="customer">Customer</option>
              <option value="business_owner">Business owner</option>
            </select>
          </label>
          <label>
            City
            <input name="city" onChange={handleChange} required value={form.city} />
          </label>
        </div>

        <button className="button primary full-width" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>

        <p className="form-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
}

