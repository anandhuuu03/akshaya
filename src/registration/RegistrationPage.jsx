import React, { useState } from 'react';
import './RegistrationPage.css';
import bg1 from '../assets/bg.mp4';
import { pb } from "../Pocketbase";
import { useNavigate } from "react-router-dom";

function RegistrationPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [phno, setPhone] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [dobError, setDobError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    const phoneRegex = /^[1-9][0-9]{9}$/;

if (phno[0] === '0') {
  setPhoneError('Phone number should not start with 0.');
  setLoading(false);
  return;
} else if (!phoneRegex.test(phno)) {
  setPhoneError('Phone number must be exactly 10 digits.');
  setLoading(false);
  return;
} else {
  setPhoneError('');
}


    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    const isUnderage = age < 18 || (age === 18 && monthDifference < 0);

    if (isUnderage) {
      setDobError('You must be at least 18 years old to register.');
      setLoading(false);
      return;
    } else {
      setDobError('');
    }

    const currentUser = pb.authStore.model;
    if (!currentUser) {
      console.error("No user is logged in!");
      setLoading(false);
      return;
    }

    const data = {
      firstName,
      lastName,
      address,
      dob,
      phno: parseInt(phno, 10),
      user_id: currentUser.id
    };

    try {
      await pb.collection('UserDetails').create(data);
      setShowSuccess(true);
      navigate("/home");

      setFirstName('');
      setLastName('');
      setAddress('');
      setDob('');
      setPhone('');
    } catch (error) {
      console.error("Error saving user details:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="registration-page-container">
      <div className="video">
        <video src={bg1} autoPlay loop muted />
      </div>

      <div className="registration-form-container">
        <h1 className="registration-page-title">Register</h1>
        <form autoComplete="off" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="First Name" 
            required 
            onChange={(e) => setFirstName(e.target.value)} 
            value={firstName} 
          />
          <input 
            type="text" 
            placeholder="Last Name" 
            required 
            onChange={(e) => setLastName(e.target.value)} 
            value={lastName} 
          />
          <input 
            type="text" 
            placeholder="Address" 
            required 
            onChange={(e) => setAddress(e.target.value)} 
            value={address} 
          />
          <input 
            type="date" 
            required 
            onChange={(e) => setDob(e.target.value)} 
            value={dob} 
          />
          {dobError && <p className="error-message">{dobError}</p>}
          <input 
            type="tel" 
            placeholder="Phone Number" 
            required 
            onChange={(e) => setPhone(e.target.value)} 
            value={phno} 
          />
          {phoneError && <p className="error-message">{phoneError}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        {showSuccess && <p className="success-message">Your registration has been successful!</p>}
      </div>
    </div>
  );
}

export default RegistrationPage;
