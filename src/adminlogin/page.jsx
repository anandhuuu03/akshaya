import React, { useState } from "react";
import { pb } from "../Pocketbase";
import "./adminstyle.css";
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      const user = pb.authStore.model;

      if (user.isadmin) {
        console.log("Login successful! User is an admin.");
        navigate('/admindash');
      } else {
        setError("Access denied. User is not an admin.");
        pb.authStore.clear();
      }
    } catch (error) {
      setError("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-bodyy">
      <div className="admin-module-containerr">
        {/* Back Button */}
        <button className="back-button" onClick={() => navigate('/')}>
          &larr; SignUp page
        </button>
        <h2 className="admin-title">ADMIN LOGIN</h2>
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="admin-input-group">
            <label htmlFor="email" className="admin-label">Email</label>
            <input 
              type="email" 
              id="email" 
              className="admin-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="admin-input-group">
            <label htmlFor="password" className="admin-label">Password</label>
            <input 
              type="password" 
              id="password" 
              className="admin-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="admin-login-button" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div> Logging In...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
        <p className="admin-footer">Virtual Drive Admin Module © 2024</p>
      </div>
    </div>
  );
};

export default AdminLogin;
