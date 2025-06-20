import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './forgot.css';
import { pb } from "../Pocketbase"; 

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    // Email format validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrorMessage("Please enter your email address.");
      setLoading(false);
      return;
    } else if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      // Query PocketBase to check if the email exists
      const records = await pb.collection("users").getFullList({
        filter: `email = "${email}"`,
      });

      // Check if email exists
      const emailExists = records.some(record => record.email === email);
      if (!emailExists) {
        setErrorMessage("No user found with this email address.");
        setLoading(false);
        return;
      }

      // If email exists, proceed to request password reset
      await pb.collection("users").requestPasswordReset(email);

      // Navigate the user to the login page after requesting reset
      navigate("/");
    } catch (error) {
      setErrorMessage("There was an error sending the password reset link.");
      console.error("Error sending password reset email:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h1>Forgot Your Password?</h1>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
      <p>
        Remembered your password? <a href="/">Login</a>
      </p>
    </div>
  );
}

export default ForgotPasswordPage;
