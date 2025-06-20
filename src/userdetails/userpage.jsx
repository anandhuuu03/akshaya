import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import { pb } from "../Pocketbase";
import "./userpage.css";
import "../loading.css";

const UserPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); // For filtered users based on search
  const [searchTerm, setSearchTerm] = useState(""); // For search term input
  const [registrationData, setRegistrationData] = useState(null); // For registration details
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = pb.authStore.model;
  const navigate = useNavigate(); // Initialize navigate function

  useEffect(() => {
    pb.autoCancellation(false); // Disable auto cancellation

    const fetchUsers = async () => {
      try {
        const records = await pb.collection("users").getFullList({
          sort: "-created",
        });
        const filtered = records.filter((u) => u.id !== user.id);
        setUsers(filtered);
        setFilteredUsers(filtered); // Initially, display all users
      } catch (error) {
        setError("Failed to load user details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users when search term changes
    const results = users.filter((user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  }, [searchTerm, users]);

  const handleDelete = async (userId) => {
    try {
      await pb.collection("users").delete(userId);
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      setFilteredUsers((prevFilteredUsers) =>
        prevFilteredUsers.filter((user) => user.id !== userId)
      );
    } catch (error) {
      alert("Failed to delete user. Please try again later.");
    }
  };

  const handleRegister = async (userId) => {
    try {
      const records = await pb.collection("userDetails").getFullList({
        filter: `user_id = "${userId}"`,
        sort: "-created",
      });
      setRegistrationData(records[0]); // Assuming one-to-one mapping with user
    } catch (error) {
      console.error("Error fetching registration data:", error);
      alert("Failed to load registration data. Please try again later.");
    }
  };

  if (loading) {
    return <div className="loader"></div>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="user-body">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate("/admindash")}>
        ← Back
      </button>

      <div className="user-page-container">
        <h1 className="user-page-title">User Details</h1>
        
        {/* Search Bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="user-card-container">
          {filteredUsers.map((user) => (
            <div key={user.id} className="user-card">
              <h2 className="user-name">{user.username}</h2>
              <p className="user-email">{user.email}</p>
              <div className="user-actions">
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(user.id)}
                >
                  Delete
                </button>
                <button
                  className="register-btnn"
                  onClick={() => handleRegister(user.id)}
                >
                  Register
                </button>
              </div>
              {registrationData && registrationData.user_id === user.id && (
                <div className="registration-detailsss">
                  <p>
                    <strong>First Name:</strong> {registrationData.firstName}
                  </p>
                  <p>
                    <strong>Last Name:</strong> {registrationData.lastName}
                  </p>
                  <p>
                    <strong>Address:</strong> {registrationData.address}
                  </p>
                  <p>
                    <strong>Date of Birth:</strong>{" "}
                    {new Date(registrationData.dob).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Phone:</strong> {registrationData.phno}
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {new Date(registrationData.created).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserPage;
