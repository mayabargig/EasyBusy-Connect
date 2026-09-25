import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MonthlyAppointmentsChart } from "../components/charts/MonthlyAppointmentsChart";
import { StatusDonutChart } from "../components/charts/StatusDonutChart";
import { useAuth } from "../hooks/useAuth";
import { useJQueryReveal } from "../hooks/useJQueryReveal";
import { api, getApiErrorMessage } from "../services/api";

export function StatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [months, setMonths] = useState(6);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const statsRef = useRef(null);

  useJQueryReveal(statsRef, stats ? `${months}:${stats.totalAppointments}` : "");

  const loadStats = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const response = await api.get("/stats/appointments", {
        params: { months },
      });
      setStats(response.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [months]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const summary = useMemo(() => {
    const count = (status) =>
      stats?.byStatus.find((item) => item.status === status)?.count || 0;

    return {
      upcoming: count("pending") + count("confirmed"),
      completed: count("completed"),
      cancelled: count("cancelled") + count("declined"),
    };
  }, [stats]);

  return (
    <section className="stats-page section-container" ref={statsRef}>
      <div className="page-heading stats-heading">
        <div>
          <span className="eyebrow">Live MongoDB insights</span>
          <h1>{user.role === "business_owner" ? "Business appointment insights." : "Your appointment activity."}</h1>
          <p>Both visualizations are drawn with D3.js from the current database records.</p>
        </div>
        <div className="stats-controls">
          <label>
            Activity range
            <select onChange={(event) => setMonths(Number(event.target.value))} value={months}>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
            </select>
          </label>
          <button className="button secondary" disabled={isLoading} onClick={loadStats} type="button">
            Refresh data
          </button>
        </div>
      </div>

      {error && <div className="form-alert page-alert" role="alert">{error}</div>}
      {isLoading && !stats && <div className="page-status compact-status"><p>Loading live statistics…</p></div>}

      {stats && (
        <>
          <div className="stats-summary-grid">
            <article data-jquery-reveal>
              <span>Total appointments</span>
              <strong>{stats.totalAppointments}</strong>
            </article>
            <article data-jquery-reveal>
              <span>Upcoming</span>
              <strong>{summary.upcoming}</strong>
            </article>
            <article data-jquery-reveal>
              <span>Completed</span>
              <strong>{summary.completed}</strong>
            </article>
            <article data-jquery-reveal>
              <span>Cancelled or declined</span>
              <strong>{summary.cancelled}</strong>
            </article>
          </div>

          <div className="stats-chart-grid">
            <article className="chart-card" data-jquery-reveal>
              <header>
                <span className="eyebrow">D3 donut chart</span>
                <h2>Appointments by status</h2>
                <p>A part-to-whole view of all appointment states.</p>
              </header>
              <StatusDonutChart data={stats.byStatus} />
            </article>

            <article className="chart-card monthly-card" data-jquery-reveal>
              <header>
                <span className="eyebrow">D3 bar chart</span>
                <h2>Monthly appointment activity</h2>
                <p>Appointment count across the selected time range.</p>
              </header>
              <MonthlyAppointmentsChart data={stats.byMonth} />
            </article>
          </div>
        </>
      )}
    </section>
  );
}
