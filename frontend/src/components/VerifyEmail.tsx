import React, { useState } from "react";

interface VerifyEmailProps {
  email: string;
  onSuccess: () => void;
}

/**
 * Component for verifying the 6-digit OTP code sent to the user's email.
 */
const VerifyEmail: React.FC<VerifyEmailProps> = ({ email, onSuccess }) => {
  const [otp, setOtp] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/accounts/verify-otp/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert("Account verified! You can now log in.");
        onSuccess();
      } else {
        setError(data.error || "Invalid code. Please try again.");
      }
    } catch (err) {
      setError("Connection failed. Please check your network.");
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
        textAlign: "center",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Verify Your Email</h2>
      <p>
        Enter the 6-digit code we sent to <strong>{email}</strong>
      </p>

      <form onSubmit={handleVerify}>
        <div style={{ margin: "20px 0" }}>
          <input
            type="text"
            placeholder="######"
            value={otp}
            // Ensure only digits are entered
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            maxLength={6}
            required
            style={{
              padding: "15px",
              fontSize: "1.5rem",
              letterSpacing: "5px",
              textAlign: "center",
              width: "100%",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        {error && <p style={{ color: "red", marginBottom: "15px" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>
      </form>
    </div>
  );
};

export default VerifyEmail;
