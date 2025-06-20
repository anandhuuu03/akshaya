import React, { useState, useEffect } from "react";
import anime from "animejs/lib/anime.es.js";
import "./stylesignup.css";
import { pb } from "../Pocketbase";
import { useNavigate } from "react-router-dom";

function SignUpPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true); // Page loading state
  const [signUpLoading, setSignUpLoading] = useState(false); // Sign-up button loading
  const [signInLoading, setSignInLoading] = useState(false); // Sign-in button loading
  const navigate = useNavigate();

  useEffect(() => {
    // Animate background elements
    function randomValues() {
      anime({
        targets: ".square, .circle, .triangle",
        translateX: () => anime.random(-500, 500),
        translateY: () => anime.random(-300, 300),
        rotate: () => anime.random(0, 360),
        scale: () => anime.random(0.2, 2),
        duration: 2500,
        easing: "easeInOutQuad",
        complete: randomValues,
      });
    }

    randomValues();
    setLoading(false); // Simulate page load completion
    return () => anime.remove(".square, .circle, .triangle");
  }, []);

  const handleSignUpClick = () => {
    setIsSignUpActive(true);
    setErrorMessage("");
  };

  const handleSignInClick = () => {
    setIsSignUpActive(false);
    setErrorMessage("");
  };

  async function SignUp(event) {
    event.preventDefault();
    setErrorMessage("");
    setSignUpLoading(true);

    // Validate form inputs
    if (!username || !email || !password || !confirmPassword) {
      setErrorMessage("All fields are required.");
      setSignUpLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setSignUpLoading(false);
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      setSignUpLoading(false);
      return;
    }

    try {
      // Fetch all user records
      const records = await pb.collection('users').getFullList({ sort: '-created' });

      // Check if email or username already exists
      const emailExists = records.some(record => record.email === email);
      if (emailExists) {
        setErrorMessage("Email is already in use.");
        setSignUpLoading(false);
        return;
      }

      const usernameExists = records.some(record => record.username === username);
      if (usernameExists) {
        setErrorMessage("Username is already in use.");
        setSignUpLoading(false);
        return;
      }

      // If both checks pass, proceed with registration
      const data = { username, email, emailVisibility: true, password, passwordConfirm: confirmPassword };
      await pb.collection("users").create(data);
      await pb.collection("users").authWithPassword(email, password);

      // Clear form fields on successful signup
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setEmail("");
      navigate("/registration");
    } catch (error) {
      const errorMessage = error.data?.message || "Registration failed. Please try again.";
      setErrorMessage(errorMessage);
      console.error("Registration failed", error);
    } finally {
      setSignUpLoading(false);
    }
  }

  async function Login(event) {
    event.preventDefault();
    setErrorMessage("");
    setSignInLoading(true);

    if (!loginEmail || !loginPassword) {
      setErrorMessage("Email and password are required.");
      setSignInLoading(false);
      return;
    }

    try {
      await pb.collection("users").authWithPassword(loginEmail, loginPassword);
      const user = pb.authStore.model;
      if (!user.isadmin) {
        navigate("/home");
      } else {
        setErrorMessage("Admin access detected.");
        // setTimeout(() => navigate("/admindash"), 1000);
      }
    } catch (error) {
      setErrorMessage("Login failed. Please check your credentials.");
      console.error("Login failed", error);
    } finally {
      setSignInLoading(false);
    }
  }

  // Forgot Password handler
  const handleForgotPassword = () => {
    // Navigate to the password reset page or handle password reset logic
    navigate("/forgot-password");
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>; // Page loading indicator
  }

  return (
    <>
      <div className="page-container">
        <img src="/virtualLogo.png" className="logo-signin" alt="Virtual Drive Logo" />
        <div className="animation-background">
          <div className="shape square"></div>
          <div className="shape square"></div>
          <div className="shape square"></div>
          <div className="shape circle"></div>
          <div className="shape circle"></div>
          <div className="shape triangle"></div>
          <div className="shape square"></div>
          <div className="shape square"></div>
          <div className="shape square"></div>
          <div className="shape circle"></div>
          <div className="shape circle"></div>
          <div className="shape triangle"></div>
          <div className="shape square"></div>
          <div className="shape square"></div>
          <div className="shape square"></div>
          <div className="shape circle"></div>
          <div className="shape circle"></div>
          <div className="shape triangle"></div>
        </div>

        <div className={`form-wrapper ${isSignUpActive ? "active" : ""}`} id="form-wrapper">
          <div className="form-section sign-up">
            <form onSubmit={SignUp}>
              <h1>Create Account</h1>
              {errorMessage && <div className="form-error">{errorMessage}</div>}
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <button type="submit" disabled={signUpLoading}>
                {signUpLoading ? "Signing Up..." : "Sign Up"}
              </button>
            </form>
          </div>

          <div className="form-section sign-in">
            <form onSubmit={Login}>
              <h1>Sign In</h1>
              {errorMessage && <div className="form-error">{errorMessage}</div>}
              <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              <a href="/adminlogin">Admin Login</a>
              <button type="submit" disabled={signInLoading}>
                {signInLoading ? "Signing In..." : "Sign In"}
              </button>
              {/* Forgot Password Link */}
              <p onClick={handleForgotPassword} className="forgot-password-text">
                Forgot Your Password?
              </p>

            </form>
          </div>

          <div className="toggle-wrapper">
            <div className="toggle">
              <div className="toggle-panel toggle-left">
                <h1>Welcome Back!</h1>
                <p>Login to get back into our virtual world</p>
                <button className="hidden" onClick={handleSignInClick} id="login">Sign In</button>
              </div>
              <div className="toggle-panel toggle-right">
                <h1>Hello, Friend!</h1>
                <p>Register to enter our virtual world</p>
                <button className="hidden" onClick={handleSignUpClick} id="register">Sign Up</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SignUpPage;
