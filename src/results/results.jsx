import React, { useState, useEffect } from 'react';
import './res.css'; 
import Navbar from '../tools/navigation';
import { pb } from '../Pocketbase';
import '../loading.css';
import { useNavigate } from "react-router-dom";

function QuizResult() {
  const [results, setResults] = useState([]); // Store all results
  const [selectedTest, setSelectedTest] = useState(null);
  const [score, setScore] = useState(null); // Dynamic score for selected test
  const [percentage, setPercentage] = useState(null); // Store percentage for selected test
  const [loading, setLoading] = useState(true); // Loading state for data fetch
  const maxScore = 20; // Maximum score for each test (adjust if needed)
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch results when the component mounts
    const fetchResults = async () => {
      try {
        const currentUser = pb.authStore.model; // Get the currently logged-in user

        if (!currentUser) {
          console.error("No user is logged in!");
          return;
        }

        // Fetch results filtered by the current user's ID
        const records = await pb.collection("results").getFullList({
          filter: `user = "${currentUser.id}"`, // Filter results by the user ID
          sort: "-created",
        });

        const results = records.map((record) => ({
          id: record.id,
          user: record.user,
          score: record.score,
          test: `Test ${record.testId}`, // Use "Test X" format for display
        }));

        setResults(results);
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false); // Set loading to false once data is fetched
      }
    };

    fetchResults();
  }, []); // Empty dependency array means this effect runs once on mount

  // Handle selecting a test to view results
  const handleTestClick = (test) => {
    const testResult = results.find(result => result.test === test);
    if (testResult) {
      setScore(testResult.score);
      const calculatedPercentage = ((testResult.score / maxScore) * 100).toFixed(2);
      setPercentage(calculatedPercentage);
      setSelectedTest(testResult.test);
    }
  };

  // Close the result modal
  const closeModal = () => {
    setSelectedTest(null);
    setScore(null);
    setPercentage(null);
  };

  // Determine pass/fail based on score
  const isPassing = (score) => parseInt(score, 10) >= 2; // 2 out of 5 is 40%

  // Go back to the previous page when back button is clicked
  const handleBackClick = () => {
    navigate('/mocktest'); // Navigates to the previous page
  };

  if (loading) {
    return <div className="loader"></div>;
  }

  return (
    <div className="result-container">
      <Navbar />
      <div className="animation-background">
        <div className="moving-circle circle1"></div>
        <div className="moving-circle circle2"></div>
        <div className="moving-circle circle3"></div>
        <div className="moving-circle circle4"></div>
        <div className="moving-circle circle5"></div>
      </div>

      <h1 className="result-heading">Results</h1>
      <h2 className="sub-heading">Test Details</h2>

      {/* Back Button */}
      <button className="back-button" onClick={handleBackClick}> ← Back</button>

      {loading ? (
        <p>Loading results...</p>
      ) : results.length === 0 ? (
        <p className="no-tests-message">You haven't taken any tests yet.</p>
      ) : (
        <div className="test-details-box">
          {results.map((result) => (
            <div 
              key={result.id} 
              className="test-item" 
              onClick={() => handleTestClick(result.test)}
            >
              {result.test}
            </div>
          ))}
        </div>
      )}

      {selectedTest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="result-message">{`Result for ${selectedTest}`}</h3>
            <p>Score: {score}/{maxScore} ({percentage}%)</p>
            {isPassing(score) ? (
              <p>You passed with a score of {score}!</p>
            ) : (
              <p>You did not pass. Your score is {score}. Better luck next time!</p>
            )}
            <button className="close-button" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizResult;
