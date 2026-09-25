import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api, getApiErrorMessage } from "../services/api";

function formatDuration(durationMinutes) {
  if (durationMinutes < 60) return `${durationMinutes} min`;

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

function todayForDateInput() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

export function BookingPage() {
  const { businessId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [serviceId, setServiceId] = useState(searchParams.get("serviceId") || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadBusiness() {
      try {
        const response = await api.get(`/users/${businessId}`);
        if (isCurrent) setBusiness(response.data.user);
      } catch (requestError) {
        if (isCurrent) setError(getApiErrorMessage(requestError));
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadBusiness();
    return () => {
      isCurrent = false;
    };
  }, [businessId]);

  const services = useMemo(
    () => business?.businessProfile?.services || [],
    [business],
  );
  const selectedService = useMemo(
    () => services.find((service) => service._id === serviceId),
    [serviceId, services],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!serviceId || !date || !time) {
      setError("Choose a service, date and time.");
      return;
    }

    const startAt = new Date(`${date}T${time}`);
    if (Number.isNaN(startAt.getTime())) {
      setError("Choose a valid appointment date and time.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/appointments", {
        businessId,
        serviceId,
        startAt: startAt.toISOString(),
        note,
      });
      navigate("/appointments", {
        state: { message: "Your appointment request was sent to the business." },
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <section className="page-status section-container"><p>Loading booking details…</p></section>;
  }

  if (error && !business) {
    return (
      <section className="page-status section-container">
        <div>
          <h1>Booking unavailable</h1>
          <p>{error}</p>
          <Link className="button secondary" to="/discover">Back to directory</Link>
        </div>
      </section>
    );
  }

  if (user.role !== "customer") {
    return (
      <section className="page-status section-container">
        <div>
          <h1>Customer account required</h1>
          <p>Business owners manage incoming appointments from their appointments page.</p>
          <Link className="button primary" to="/appointments">Manage appointments</Link>
        </div>
      </section>
    );
  }

  const profile = business.businessProfile || {};
  const businessName = profile.name || `${business.firstName} ${business.lastName}`;

  return (
    <section className="booking-page section-container">
      <Link className="back-link" to={`/users/${businessId}`}>← Back to business</Link>

      <div className="page-heading">
        <div>
          <span className="eyebrow">Book an appointment</span>
          <h1>{businessName}</h1>
          <p>Choose a service and send your preferred time to the business.</p>
        </div>
      </div>

      <div className="booking-layout">
        <form className="booking-form" onSubmit={handleSubmit}>
          {error && <div className="form-alert" role="alert">{error}</div>}

          <label>
            Service
            <select onChange={(event) => setServiceId(event.target.value)} required value={serviceId}>
              <option value="">Choose a service</option>
              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name} · ₪{service.price}
                </option>
              ))}
            </select>
          </label>

          <div className="form-grid">
            <label>
              Date
              <input min={todayForDateInput()} onChange={(event) => setDate(event.target.value)} required type="date" value={date} />
            </label>
            <label>
              Time
              <input onChange={(event) => setTime(event.target.value)} required type="time" value={time} />
            </label>
          </div>

          <label>
            Note to the business
            <textarea maxLength="500" onChange={(event) => setNote(event.target.value)} placeholder="Optional request or useful detail" rows="4" value={note} />
            <small>{note.length}/500</small>
          </label>

          <button className="button primary" disabled={isSubmitting || !services.length} type="submit">
            {isSubmitting ? "Sending request…" : "Request appointment"}
          </button>
        </form>

        <aside className="booking-summary">
          <span className="eyebrow">Booking summary</span>
          <h2>{selectedService?.name || "Choose a service"}</h2>
          {selectedService ? (
            <>
              <p>{selectedService.description || "Service details are available from the business."}</p>
              <dl>
                <div><dt>Duration</dt><dd>{formatDuration(selectedService.durationMinutes)}</dd></div>
                <div><dt>Price</dt><dd>₪{selectedService.price}</dd></div>
                {profile.address && <div><dt>Address</dt><dd>{profile.address}</dd></div>}
              </dl>
            </>
          ) : (
            <p>Select one of the published services to see its details.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
