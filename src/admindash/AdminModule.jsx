import React from 'react';
import { useNavigate } from 'react-router-dom';
import { pb } from '../Pocketbase'; // Import PocketBase
import './styles.css';

const AdminModule = () => {
  const navigate = useNavigate();
  const currentUser = pb.authStore.model; // Retrieve the current user from PocketBase

  const handleLogout = () => {
    pb.authStore.clear(); // Clear the auth store to log out
    console.log("User logged out successfully");
    navigate('/adminlogin'); // Redirect to the login page
  };

  return (
    <div className="admin-body">
      <div className="admin-module-container">
        <h1 className="admin-title">ADMIN MODULE</h1>

        {/* Top-right greeting and logout button */}
        <div className="top-right-container">
  {currentUser ? (
    <span className="user-greeting">Welcome, Admin {currentUser.username}!</span>
  ) : (
    <span className="user-greeting">Welcome, Admin!</span>
  )}
  <button className="logout-button1" onClick={handleLogout}>
    Logout
  </button>
</div>

        <div className="admin-card-container">
          <button 
            className="admin-card admin-user-card" 
            onClick={() => navigate('/userdata')}
          >
            User Details
          </button>
          <button 
            className="admin-card admin-test-card" 
            onClick={() => navigate('/mocktestpage')}
          >
            Mock Test
          </button>
          <button 
            className="admin-card admin-feedback-card" 
            onClick={() => navigate('/viewfeedback')}
          >
            Feedback
          </button>
          <button 
            className="admin-card admin-results-card" 
            onClick={() => navigate('/adminresults')}
          >
            Test Results
          </button>
        </div>

        <footer className="admin-footerr">
          <p>Virtual Drive Admin Module &copy; 2024</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminModule;