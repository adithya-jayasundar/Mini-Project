import React, { useState } from "react";
import { authAPI } from "../utils/api";
import "../App.css";

export default function SettingsModal({ user, onClose, onUpdate, onLogout }) {
  const [form, setForm] = useState({
    name: user.name || "",
    affiliation: user.degree || user.affiliation || "",
    interests: user.interests || [],
    interestInput: "",
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

  const handleAddInterest = (interest) => {
    if (interest && !form.interests.includes(interest)) {
      setForm({ ...form, interests: [...form.interests, interest], interestInput: "" });
    }
  };

  const handleRemoveInterest = (interest) => {
    setForm({ ...form, interests: form.interests.filter(i => i !== interest) });
  };

  const handleInterestKeyDown = (e) => {
    if (e.key === 'Enter' && form.interestInput.trim()) {
      e.preventDefault();
      handleAddInterest(form.interestInput.trim());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!form.name || !form.affiliation || form.interests.length === 0 || !form.email) {
        setError("Please fill all fields and add at least one area of interest.");
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
          
          <div style={{ width: '100%', marginBottom: '1rem' }}>
            <label style={{ color: 'var(--primary-blue-dark)', fontWeight: 500, marginBottom: 4, display: 'block' }}>
              Areas of Interest (select or type custom)
            </label>
            
            {/* Display selected interests as chips */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.5rem', 
              marginBottom: '0.5rem',
              minHeight: form.interests.length > 0 ? 'auto' : 0
            }}>
              {form.interests.map((interest, idx) => (
                <span key={idx} style={{
                  background: 'var(--primary-blue)',
                  color: 'white',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.9em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {interest}
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '1.2em',
                      lineHeight: 1,
                      padding: 0
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Popular topics as clickable chips */}
            <div style={{ marginBottom: '0.5rem' }}>
              <small style={{ color: 'var(--text-secondary)' }}>Popular topics:</small>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.3rem' }}>
                {popularTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleAddInterest(topic)}
                    disabled={form.interests.includes(topic)}
                    style={{
                      background: form.interests.includes(topic) ? '#e5e7eb' : 'var(--gray)',
                      border: '1px solid var(--border)',
                      padding: '0.3rem 0.7rem',
                      borderRadius: '16px',
                      fontSize: '0.85em',
                      cursor: form.interests.includes(topic) ? 'default' : 'pointer',
                      color: form.interests.includes(topic) ? 'var(--text-secondary)' : 'var(--primary-blue-dark)',
                      opacity: form.interests.includes(topic) ? 0.6 : 1
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom input */}
            <input
              type="text"
              name="interestInput"
              placeholder="Type custom interest and press Enter"
              value={form.interestInput}
              onChange={handleChange}
              onKeyDown={handleInterestKeyDown}
              className="auth-input"
            />
          </div>
          
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
