import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './mockteststyle.css'; // Link to CSS for styling
import bg2 from '../assets/v1.mp4'; // Background video source
import Navbar from '../tools/navigation';

const links = [
  { name: 'test', href: '/Quiz' },
  { name: 'result', href: '/result' },
  { name: 'feedback', href: '/feedback' },
];

const MockTest = () => {
  const navigate = useNavigate();

  return (
    <div className="mock-test-container">
      <Navbar/>
      {/* Background Video */}
      <video autoPlay muted loop className="background-video" preload="auto">
        <source src={bg2} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Mock Test Heading */}
      <h1 className="mock-test-heading">Mock Test</h1>
      <div className="button-container">
        {/* Button to start the mock test */}
        <p className="button-comment">Start your test!</p>
        <button className="btn test-btn" onClick={() => navigate(links[0].href)}>Test</button>
        
        {/* Button to view results of the mock test */}
        <p className="button-comment">See your results!</p>
        <button className="btn result-btn" onClick={() => navigate(links[1].href)}>Result</button>
        
        {/* Button to provide feedback on the mock test */}
        <p className="button-comment">Give your feedback!</p>
        <button className="btn feedback-btn" onClick={() => navigate(links[2].href)}>Feedback</button>
      </div>
    </div>
  );
};

export default MockTest;
