import React, { useState, useEffect } from 'react';
import './ViewFeedback.css';
import { useNavigate } from 'react-router-dom';
import { pb } from '../Pocketbase';

import fb from '../assets/mail1.png';

pb.autoCancellation(false);

const UniqueViewFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('all'); // State for sorting option
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const records = await pb.collection('feedback').getFullList({
          sort: '-created',
        });
        setFeedbacks(records);
      } catch (error) {
        console.error('Error fetching feedback:', error.message, error);
        setError('Failed to load feedback. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const handleCheckboxChange = async (id, responded) => {
    // Update the local state
    const updatedFeedbacks = feedbacks.map((feedback) =>
      feedback.id === id ? { ...feedback, responded: !responded } : feedback
    );
    setFeedbacks(updatedFeedbacks);

    // Update the responded status in the PocketBase database
    try {
      await pb.collection('feedback').update(id, { responded: !responded });
      console.log(`Feedback ${id} responded status updated successfully.`);
    } catch (error) {
      console.error('Error updating feedback responded status:', error.message);
      setError('Failed to update feedback. Please try again later.');
    }
  };

  const handleSortByResponded = () => {
    setSortOption('responded');
  };

  const handleSortByNotResponded = () => {
    setSortOption('notResponded');
  };

  const handleSortByAll = () => {
    setSortOption('all'); // Set to 'all' to display all feedbacks
  };

  // Filter feedbacks based on sortOption
  const filteredFeedbacks = feedbacks.filter((feedback) => {
    if (sortOption === 'responded') return feedback.responded === true;
    if (sortOption === 'notResponded') return feedback.responded === false;
    return true; // 'all' option, no filter
  });

  if (loading) {
    return <div className="loader"></div>;
  }

  if (error) {
    return <div className="unique-view-feedback-container">{error}</div>;
  }

  return (
    <div className="unique-view-feedback-container">
      <button className="back-button" onClick={() => navigate('/admindash')}>
        &larr; Back
      </button>
      <div className="unique-feedback-header">
        <h1>All Feedback</h1>
        {/* Sort buttons */}
        <div className="sort-options-container">
          <button className="sort-button" onClick={handleSortByAll}>
            All
          </button>
          <button className="sort-button" onClick={handleSortByResponded}>
            Sort by Responded
          </button>
          <button className="sort-button" onClick={handleSortByNotResponded}>
            Sort by Not Responded
          </button>
        </div>
      </div>
      <div className="unique-feedback-list">
        {filteredFeedbacks.map((feedback) => (
          <div key={feedback.id} className="unique-feedback-card">
            <h3 className="unique-feedback-name">{feedback.name}</h3>
            <p className="unique-feedback-message">{feedback.feedbacks}</p>

            <a 
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${feedback.email}&su=${encodeURIComponent('Response to Your Feedback from Virtual Drive 🚗')}`} 
              className="mail-link" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <img
                src={fb}
                alt="Mail Icon"
                className={`mail-icon ${feedback.responded ? '' : 'glow'}`}
              />
            </a>

            <div className="response-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={feedback.responded || false}
                  onChange={() => handleCheckboxChange(feedback.id, feedback.responded)}
                />
                Responded to Email
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UniqueViewFeedback;
