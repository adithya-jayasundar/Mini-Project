import React, { useState } from "react";
import { authAPI } from "../utils/api";
import "../App.css";

export default function LoginRegister({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    name: "",
    affiliation: "",
    interest: "",
    customInterest: ""
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
      if (!form.email || !form.password || (!isLogin && !form.confirm)) {
        setError("Please fill all fields.");
        return;
      }
      if (!isLogin && form.password !== form.confirm) {
        setError("Passwords do not match.");
        return;
      }
      if (!isLogin && (!form.name || !form.affiliation || !(form.interest || form.customInterest))) {
        setError("Please fill all fields.");
        return;
      }

      if (isLogin) {
        await authAPI.login(form.email, form.password);
        onAuth && onAuth({ email: form.email });
      } else {
        const userData = await authAPI.register(form);
        onAuth && onAuth(userData);
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{isLogin ? "Login" : "Register"}</h2>
        {!isLogin && (
          <>
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
              placeholder="Affiliation (e.g., University, Company)"
              value={form.affiliation}
              onChange={handleChange}
              className="auth-input"
            />
            <div style={{ width: '100%', marginBottom: '1rem' }}>
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
            </div>
          </>
        )}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="auth-input"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="auth-input"
        />
        {!isLogin && (
          <input
            type="password"
            name="confirm"
            placeholder="Confirm Password"
            value={form.confirm}
            onChange={handleChange}
            className="auth-input"
          />
        )}
        {error && <div className="auth-error">{error}</div>}
        <button className="auth-btn" type="submit" disabled={loading}>
          {loading ? "Loading..." : (isLogin ? "Login" : "Register")}
        </button>
        <div className="auth-toggle">
          {isLogin ? (
            <span>
              New here?{' '}
              <button type="button" onClick={() => setIsLogin(false)} className="auth-link">Register</button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button type="button" onClick={() => setIsLogin(true)} className="auth-link">Login</button>
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
