import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { businessCategories } from "../constants/businessCategories";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/api";

function durationForForm(durationMinutes = 30) {
  if (durationMinutes >= 60 && durationMinutes % 15 === 0) {
    return {
      durationValue: String(durationMinutes / 60),
      durationUnit: "hours",
    };
  }

  return {
    durationValue: String(durationMinutes),
    durationUnit: "minutes",
  };
}

function createForm(user) {
  const business = user.businessProfile || {};

  return {
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    city: user.city || "",
    avatarUrl: user.avatarUrl || "",
    bio: user.bio || "",
    businessProfile: {
      name: business.name || "",
      category: business.category || "",
      description: business.description || "",
      phone: business.phone || "",
      website: business.website || "",
      address: business.address || "",
      services: (business.services || []).map((service) => ({
        name: service.name || "",
        description: service.description || "",
        ...durationForForm(service.durationMinutes),
        price: String(service.price ?? 0),
      })),
    },
  };
}

const emptyService = {
  name: "",
  description: "",
  durationValue: "30",
  durationUnit: "minutes",
  price: "0",
};

export function ProfilePage() {
  const { deleteAccount, updateProfile, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => createForm(user));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const initials = useMemo(
    () => `${form.firstName[0] || ""}${form.lastName[0] || ""}`.toUpperCase(),
    [form.firstName, form.lastName],
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateBusinessField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      businessProfile: { ...current.businessProfile, [name]: value },
    }));
  }

  function updateService(index, event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      businessProfile: {
        ...current.businessProfile,
        services: current.businessProfile.services.map((service, serviceIndex) =>
          serviceIndex === index ? { ...service, [name]: value } : service,
        ),
      },
    }));
  }

  function addService() {
    setForm((current) => ({
      ...current,
      businessProfile: {
        ...current.businessProfile,
        services: [...current.businessProfile.services, { ...emptyService }],
      },
    }));
  }

  function removeService(index) {
    setForm((current) => ({
      ...current,
      businessProfile: {
        ...current.businessProfile,
        services: current.businessProfile.services.filter((_, serviceIndex) => serviceIndex !== index),
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      city: form.city,
      avatarUrl: form.avatarUrl,
      bio: form.bio,
    };

    if (user.role === "business_owner") {
      payload.businessProfile = {
        ...form.businessProfile,
        services: form.businessProfile.services.map((service) => ({
        ...service,
          durationMinutes:
            service.durationUnit === "hours"
              ? Math.round(Number(service.durationValue) * 60)
              : Math.round(Number(service.durationValue)),
          price: Number(service.price),
        })),
      };
    }

    try {
      const updatedUser = await updateProfile(payload);
      setForm(createForm(updatedUser));
      setSuccess("Your profile was saved successfully.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsDeleting(true);

    try {
      await deleteAccount(deletePassword);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="profile-page section-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Account settings</span>
          <h1>Build a profile people can trust.</h1>
          <p>Keep your personal information and public business details accurate.</p>
        </div>
        <div className="profile-preview-avatar">
          {form.avatarUrl ? <img alt="Profile preview" src={form.avatarUrl} /> : initials}
        </div>
      </div>

      {error && <div className="form-alert page-alert" role="alert">{error}</div>}
      {success && <div className="form-success page-alert" role="status">{success}</div>}

      <form className="profile-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <div className="form-section-heading">
            <span>01</span>
            <div>
              <h2>Personal details</h2>
              <p>Your email remains private and is used for login.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              First name
              <input maxLength="40" name="firstName" onChange={updateField} required value={form.firstName} />
            </label>
            <label>
              Last name
              <input maxLength="40" name="lastName" onChange={updateField} required value={form.lastName} />
            </label>
            <label>
              Email
              <input name="email" onChange={updateField} required type="email" value={form.email} />
            </label>
            <label>
              City
              <input maxLength="80" name="city" onChange={updateField} required value={form.city} />
            </label>
          </div>

          <label>
            Avatar URL
            <input name="avatarUrl" onChange={updateField} placeholder="https://example.com/photo.jpg" type="url" value={form.avatarUrl} />
          </label>
          <label>
            Short bio
            <textarea maxLength="400" name="bio" onChange={updateField} rows="4" value={form.bio} />
            <small>{form.bio.length}/400 characters</small>
          </label>
        </section>

        {user.role === "business_owner" && (
          <section className="form-section">
            <div className="form-section-heading">
              <span>02</span>
              <div>
                <h2>Business profile</h2>
                <p>These details appear in the business directory.</p>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Business name
                <input maxLength="100" name="name" onChange={updateBusinessField} required value={form.businessProfile.name} />
              </label>
              <label>
                Category
                <select name="category" onChange={updateBusinessField} required value={form.businessProfile.category}>
                  <option value="">Select a category</option>
                  {businessCategories.map((category) => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Phone
                <input maxLength="25" name="phone" onChange={updateBusinessField} value={form.businessProfile.phone} />
              </label>
              <label>
                Website
                <input name="website" onChange={updateBusinessField} placeholder="https://" type="url" value={form.businessProfile.website} />
              </label>
            </div>

            <label>
              Address
              <input maxLength="160" name="address" onChange={updateBusinessField} value={form.businessProfile.address} />
            </label>
            <label>
              Business description
              <textarea maxLength="800" name="description" onChange={updateBusinessField} rows="5" value={form.businessProfile.description} />
              <small>{form.businessProfile.description.length}/800 characters</small>
            </label>

            <div className="services-heading">
              <div>
                <h3>Services</h3>
                <p>Add up to 12 services. Prices are shown in NIS.</p>
              </div>
              <button className="button secondary" disabled={form.businessProfile.services.length >= 12} onClick={addService} type="button">
                Add service
              </button>
            </div>

            <div className="service-editor-list">
              {form.businessProfile.services.map((service, index) => (
                <article className="service-editor" key={`service-${index}`}>
                  <div className="service-editor-topline">
                    <h3>Service {index + 1}</h3>
                    <button className="text-danger-button" onClick={() => removeService(index)} type="button">Remove</button>
                  </div>
                  <div className="form-grid">
                    <label>
                      Service name
                      <input maxLength="80" name="name" onChange={(event) => updateService(index, event)} required value={service.name} />
                    </label>
                    <label>
                      Description
                      <input maxLength="240" name="description" onChange={(event) => updateService(index, event)} value={service.description} />
                    </label>
                    <label>
                      Duration
                      <input
                        max={service.durationUnit === "hours" ? "8" : "480"}
                        min={service.durationUnit === "hours" ? "0.25" : "10"}
                        name="durationValue"
                        onChange={(event) => updateService(index, event)}
                        required
                        step={service.durationUnit === "hours" ? "0.25" : "5"}
                        type="number"
                        value={service.durationValue}
                      />
                    </label>
                    <label>
                      Duration unit
                      <select name="durationUnit" onChange={(event) => updateService(index, event)} value={service.durationUnit}>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                      </select>
                    </label>
                    <label>
                      Price
                      <input max="100000" min="0" name="price" onChange={(event) => updateService(index, event)} required step="0.01" type="number" value={service.price} />
                    </label>
                  </div>
                </article>
              ))}
              {form.businessProfile.services.length === 0 && (
                <p className="empty-inline">No services yet. Add the first service customers can book.</p>
              )}
            </div>
          </section>
        )}

        <button className="button primary save-profile-button" disabled={isSaving} type="submit">
          {isSaving ? "Saving profile…" : "Save profile"}
        </button>
      </form>

      <section className="danger-zone">
        <div>
          <h2>Delete account</h2>
          <p>This permanently removes your user record. Enter your password to confirm.</p>
        </div>
        <form onSubmit={handleDelete}>
          <label>
            Current password
            <input autoComplete="current-password" onChange={(event) => setDeletePassword(event.target.value)} required type="password" value={deletePassword} />
          </label>
          <button className="button danger" disabled={isDeleting} type="submit">
            {isDeleting ? "Deleting…" : "Delete my account"}
          </button>
        </form>
      </section>
    </section>
  );
}
