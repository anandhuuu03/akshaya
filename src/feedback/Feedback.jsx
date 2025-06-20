import React, { useState } from 'react';
import './feedback.css';
import fb from '../assets/fed.jpg';
import { pb } from "../Pocketbase";
import { useNavigate } from "react-router-dom";
import Navbar from '../tools/navigation';


const FeedbackForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = { name, email, feedbacks: feedback };

    try {
      const record = await pb.collection('feedback').create(data);
      console.log('Feedback saved:', record);

      //Reset form fields after successful submissions
      setName('');
      setEmail('');
      setFeedback('');
      setSuccess(true);
      setError(null);
    } catch (error) {
      console.error('Error saving feedback:', error);
      setError('Failed to save feedback. Please try again.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="background-image-container">
      <Navbar />
      <button className="back-button"
      onClick={() => { console.log("Back button clicked");navigate("/mocktest");}}>
        ← Back
      </button>
      <div className="feedback-form">
        <h2 className="feedback-form-heading">Feedback Form</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <input
              type="text"
              className="feedback-form-input"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-container">
            <input
              type="email"
              className="feedback-form-input"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-container">
            <textarea
              className="feedback-form-textarea"
              placeholder="Your Feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="button-container">
            <button type="submit" className="feedback-form-button" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
        
        {/* Success message displayed below the button */}
        {success && <p className="success-message">Thank you! Your feedback has been submitted.</p>}
      </div>
    </div>
  );
};

export default FeedbackForm;
