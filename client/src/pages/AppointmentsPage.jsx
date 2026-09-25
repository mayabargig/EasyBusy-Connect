import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  appointmentStatusLabel,
  appointmentStatuses,
} from "../constants/appointmentStatuses";
import { useAuth } from "../hooks/useAuth";
import { api, getApiErrorMessage } from "../services/api";

const initialFilters = { q: "", status: "", dateFrom: "", dateTo: "" };

function localDateParts(value) {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return {
    date: localDate.toISOString().slice(0, 10),
    time: localDate.toISOString().slice(11, 16),
  };
}

function formatAppointmentDate(value) {
  return new Intl.DateTimeFormat("en-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(durationMinutes) {
  if (durationMinutes < 60) return `${durationMinutes} min`;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

export function AppointmentsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [filters, setFilters] = useState(initialFilters);
  const [appointments, setAppointments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.message || "");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const loadAppointments = useCallback(async (searchFilters) => {
    setError("");
    setIsLoading(true);
    try {
      const response = await api.get("/appointments", {
        params: {
          q: searchFilters.q || undefined,
          status: searchFilters.status || undefined,
          dateFrom: searchFilters.dateFrom || undefined,
          dateTo: searchFilters.dateTo || undefined,
          limit: 50,
        },
      });
      setAppointments(response.data.appointments);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments(initialFilters);
  }, [loadAppointments]);

  function replaceAppointment(updatedAppointment) {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === updatedAppointment.id ? updatedAppointment : appointment,
      ),
    );
  }

  function handleFilterChange(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function handleSearch(event) {
    event.preventDefault();
    loadAppointments(filters);
  }

  function clearFilters() {
    setFilters(initialFilters);
    loadAppointments(initialFilters);
  }

  async function changeStatus(appointmentId, status) {
    setError("");
    setSuccess("");
    setBusyId(appointmentId);
    try {
      const response = await api.patch(`/appointments/${appointmentId}`, { status });
      replaceAppointment(response.data.appointment);
      setSuccess(`Appointment marked as ${appointmentStatusLabel(status).toLowerCase()}.`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setBusyId("");
    }
  }

  function beginEditing(appointment) {
    const parts = localDateParts(appointment.startAt);
    setEditing({
      id: appointment.id,
      date: parts.date,
      time: parts.time,
      note: appointment.note || "",
    });
    setError("");
    setSuccess("");
  }

  async function saveEdit(event) {
    event.preventDefault();
    const startAt = new Date(`${editing.date}T${editing.time}`);
    if (Number.isNaN(startAt.getTime())) {
      setError("Choose a valid appointment date and time.");
      return;
    }

    setBusyId(editing.id);
    try {
      const response = await api.patch(`/appointments/${editing.id}`, {
        startAt: startAt.toISOString(),
        note: editing.note,
      });
      replaceAppointment(response.data.appointment);
      setEditing(null);
      setSuccess("Appointment request updated successfully.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setBusyId("");
    }
  }

  async function deleteAppointment(appointmentId) {
    if (!window.confirm("Delete this appointment permanently?")) return;

    setError("");
    setSuccess("");
    setBusyId(appointmentId);
    try {
      await api.delete(`/appointments/${appointmentId}`);
      setAppointments((current) =>
        current.filter((appointment) => appointment.id !== appointmentId),
      );
      setSuccess("Appointment deleted successfully.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setBusyId("");
    }
  }

  const isBusinessOwner = user.role === "business_owner";

  return (
    <section className="appointments-page section-container">
      <div className="page-heading appointments-heading">
        <div>
          <span className="eyebrow">Appointment center</span>
          <h1>{isBusinessOwner ? "Manage incoming appointments." : "Your appointments."}</h1>
          <p>
            {isBusinessOwner
              ? "Review requests, confirm appointments and keep their status current."
              : "Track, edit or cancel appointments you requested."}
          </p>
        </div>
        {!isBusinessOwner && <Link className="button primary" to="/discover">Book another appointment</Link>}
      </div>

      <form className="appointment-search-panel" onSubmit={handleSearch}>
        <label>
          Service
          <input name="q" onChange={handleFilterChange} placeholder="For example: Manicure" value={filters.q} />
        </label>
        <label>
          Status
          <select name="status" onChange={handleFilterChange} value={filters.status}>
            <option value="">All statuses</option>
            {appointmentStatuses.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </label>
        <label>
          From
          <input name="dateFrom" onChange={handleFilterChange} type="date" value={filters.dateFrom} />
        </label>
        <label>
          To
          <input name="dateTo" onChange={handleFilterChange} type="date" value={filters.dateTo} />
        </label>
        <div className="appointment-search-actions">
          <button className="button primary" disabled={isLoading} type="submit">Search</button>
          <button className="button secondary" onClick={clearFilters} type="button">Clear</button>
        </div>
      </form>

      {error && <div className="form-alert page-alert" role="alert">{error}</div>}
      {success && <div className="form-success page-alert" role="status">{success}</div>}
      {isLoading && <div className="page-status compact-status"><p>Loading appointments…</p></div>}

      {!isLoading && appointments.length === 0 && (
        <div className="empty-state appointment-empty-state">
          <h2>No appointments found.</h2>
          <p>{isBusinessOwner ? "New customer requests will appear here." : "Choose a business from the directory to request your first appointment."}</p>
        </div>
      )}

      {!isLoading && appointments.length > 0 && (
        <div className="appointment-list">
          {appointments.map((appointment) => {
            const otherParty = isBusinessOwner ? appointment.customer : appointment.business;
            const partyName = isBusinessOwner
              ? `${otherParty?.firstName || ""} ${otherParty?.lastName || ""}`.trim()
              : otherParty?.businessName || `${otherParty?.firstName || ""} ${otherParty?.lastName || ""}`.trim();
            const canDelete = ["cancelled", "declined", "completed"].includes(appointment.status);

            return (
              <article className="appointment-card" key={appointment.id}>
                <header className="appointment-card-header">
                  <div>
                    <span className="appointment-date">{formatAppointmentDate(appointment.startAt)}</span>
                    <h2>{appointment.service.name}</h2>
                    <p>{partyName}</p>
                  </div>
                  <span className={`appointment-status status-${appointment.status}`}>
                    {appointmentStatusLabel(appointment.status)}
                  </span>
                </header>

                <div className="appointment-details">
                  <span>{formatDuration(appointment.service.durationMinutes)}</span>
                  <span>₪{appointment.service.price}</span>
                  {!isBusinessOwner && appointment.business?.businessAddress && (
                    <span>{appointment.business.businessAddress}</span>
                  )}
                  {isBusinessOwner && appointment.customer?.email && (
                    <span>{appointment.customer.email}</span>
                  )}
                </div>

                {appointment.note && <p className="appointment-note">“{appointment.note}”</p>}

                {editing?.id === appointment.id ? (
                  <form className="appointment-edit-form" onSubmit={saveEdit}>
                    <label>
                      New date
                      <input onChange={(event) => setEditing((current) => ({ ...current, date: event.target.value }))} required type="date" value={editing.date} />
                    </label>
                    <label>
                      New time
                      <input onChange={(event) => setEditing((current) => ({ ...current, time: event.target.value }))} required type="time" value={editing.time} />
                    </label>
                    <label className="appointment-edit-note">
                      Note
                      <input maxLength="500" onChange={(event) => setEditing((current) => ({ ...current, note: event.target.value }))} value={editing.note} />
                    </label>
                    <div className="appointment-actions">
                      <button className="button primary" disabled={busyId === appointment.id} type="submit">Save changes</button>
                      <button className="button secondary" onClick={() => setEditing(null)} type="button">Close</button>
                    </div>
                  </form>
                ) : (
                <div className="appointment-actions">
                    <Link className="button secondary" to={`/chat/${otherParty.id}`}>Message</Link>
                    {!isBusinessOwner && appointment.status === "pending" && (
                      <button className="button secondary" onClick={() => beginEditing(appointment)} type="button">Edit request</button>
                    )}
                    {!isBusinessOwner && ["pending", "confirmed"].includes(appointment.status) && (
                      <button className="button danger" disabled={busyId === appointment.id} onClick={() => changeStatus(appointment.id, "cancelled")} type="button">Cancel</button>
                    )}
                    {isBusinessOwner && appointment.status === "pending" && (
                      <>
                        <button className="button primary" disabled={busyId === appointment.id} onClick={() => changeStatus(appointment.id, "confirmed")} type="button">Confirm</button>
                        <button className="button danger" disabled={busyId === appointment.id} onClick={() => changeStatus(appointment.id, "declined")} type="button">Decline</button>
                      </>
                    )}
                    {isBusinessOwner && appointment.status === "confirmed" && (
                      <>
                        <button className="button primary" disabled={busyId === appointment.id} onClick={() => changeStatus(appointment.id, "completed")} type="button">Mark completed</button>
                        <button className="button danger" disabled={busyId === appointment.id} onClick={() => changeStatus(appointment.id, "cancelled")} type="button">Cancel</button>
                      </>
                    )}
                    {canDelete && (
                      <button className="text-action-button danger-text" disabled={busyId === appointment.id} onClick={() => deleteAppointment(appointment.id)} type="button">Delete</button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
