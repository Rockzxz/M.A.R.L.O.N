import React, { useState } from "react";

interface RegisterProps {
  onSuccess: (email: string) => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/accounts/register/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        onSuccess(email);
      } else {
        setError(
          data.error || "Registration failed. Please check your details.",
        );
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "100px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2 style={{ textAlign: "center" }}>Create Account</h2>
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: "15px" }}>
          <label
            htmlFor="email"
            style={{ display: "block", marginBottom: "5px" }}
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label
            htmlFor="password"
            style={{ display: "block", marginBottom: "5px" }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
          />
        </div>
        {error && <p style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: "15px", fontSize: "0.9rem" }}>
        Already have an account?{" "}
        <button
          onClick={onSwitchToLogin}
          style={{
            background: "none",
            border: "none",
            color: "#007bff",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Login
        </button>
      </p>
    </div>
  );
};

export default Register;
