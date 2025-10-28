import React, { useState } from "react";
import { authAPI } from "../utils/api";
import "../App.css";

export default function SettingsModal({ user, onClose, onUpdate, onLogout }) {
  const [form, setForm] = useState({
    name: user.name || "",
    affiliation: user.degree || user.affiliation || "",
    interest: user.interests && user.interests[0] ? user.interests[0] : "",
    customInterest: user.interests && user.interests[0] && !["Artificial Intelligence", "Machine Learning", "Data Science", "Computer Vision", "Natural Language Processing", "Robotics", "Cybersecurity", "Quantum Computing", "Bioinformatics", "Blockchain"].includes(user.interests[0]) ? user.interests[0] : "",
    email: user.email || ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const popularTopics = [
    "Artificial Intelligence",
    "Machine Learning",
    "Data Science",
    "Computer Vision",
    "Natural Language Processing",
    "Robotics",
    "Cybersecurity",
    "Quantum Computing",
    "Bioinformatics",
    "Blockchain"
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!form.name || !form.affiliation || !(form.interest || form.customInterest) || !form.email) {
        setError("Please fill all fields.");
        return;
      }

      const updatedUser = await authAPI.updateProfile(form);
      onUpdate(updatedUser);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <button className="settings-close-btn" onClick={onClose} aria-label="Close settings">×</button>
        <h2>Settings</h2>
        <form onSubmit={handleSubmit} className="settings-form">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            className="auth-input"
          />
          <input
            type="text"
            name="affiliation"
            placeholder="Affiliation"
            value={form.affiliation}
            onChange={handleChange}
            className="auth-input"
          />
          <label style={{ color: 'var(--primary-blue-dark)', fontWeight: 500, marginBottom: 4, display: 'block' }}>Area of Interest</label>
          <select
            name="interest"
            value={form.interest}
            onChange={handleChange}
            className="auth-input"
            style={{ marginBottom: form.interest === 'custom' ? 8 : 0 }}
          >
            <option value="">Select a topic</option>
            {popularTopics.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
            <option value="custom">Other (add custom)</option>
          </select>
          {form.interest === 'custom' && (
            <input
              type="text"
              name="customInterest"
              placeholder="Enter your custom interest"
              value={form.customInterest}
              onChange={handleChange}
              className="auth-input"
              style={{ marginTop: 8 }}
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            className="auth-input"
          />
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </form>
        <button className="auth-btn" style={{background:'var(--primary-blue-dark)',marginTop:12}} onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
