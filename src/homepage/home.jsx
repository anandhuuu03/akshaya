import React from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';
import Navbar from '../tools/navigation';
import img1 from '../assets/img1.jpeg';
import img2 from '../assets/img2.jpeg';
import img4 from '../assets/img3.jpeg';
import simhome from '../assets/simhome.jpeg';
import res from '../assets/res.jpeg';
import mock from '../assets/mock_test.jpeg';

const Homepage = () => {
  const navigate = useNavigate();

  const handleResourcesClick = () => {
    navigate('/resources');
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <Navbar />
      {/* Hero Section */}
      <div className="hero-section">
        <h1>Welcome to Virtual Drive</h1>
        <div className="p-container">
          <p>Driving Innovation. One simulation at a time</p>
        </div>
      </div>

      {/* Card Section */}
      <div className="card-container">
        {/* Mock Test Card */}
        <div className="card mocktest" style={{ backgroundImage: `url(${mock})` }}>
          <div className="card-front">
            <div className="h2-container">
              <h2>Mock Test</h2>
            </div>
            <div className="button-container">
              <button
                className="action-button"
                onClick={() => navigate('/mocktest')}
              >
                Start Mock Test
              </button>
            </div>
          </div>
        </div>

        {/* Simulation Card */}
        <div className="card simulation" style={{ backgroundImage: `url(${simhome})` }}>
          <div className="card-front">
            <div className="h2-container">
              <h2>Simulation</h2>
            </div>
            <div className="button-container">
              <button
                className="action-button"
                onClick={() => navigate('/simulation')}
              >
                Start Simulation
              </button>
            </div>
          </div>
        </div>

        {/* Resources Card */}
        <div className="card resources" style={{ backgroundImage: `url(${res})` }}>
          <div className="card-front">
            <div className="h2-container">
              <h2>Resources</h2>
            </div>
            <div className="button-container">
              <button
                className="action-button"
                onClick={handleResourcesClick}
              >
                Access Resources
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="info-section">
        <div className="h2-container">
          <h2>More About Our Services</h2>
        </div>

        {[{
            title: 'Mock Test',
            content: "Our Mock Test feature allows students to practice and assess their knowledge before taking the actual driving test. It\'s designed to simulate the real exam environment, helping students to familiarize themselves with the format and types of questions they will encounter.",
            imgSrc: img4,
            
          },
          {
            title: 'Simulation',
            content: "The Simulation feature provides an immersive driving experience using state-of-the-art virtual reality technology. Students can practice driving skills in a safe environment, learning how to handle different traffic scenarios without the risks associated with real-world driving.",
            imgSrc: img2,
          },
          {
            title: 'Resources',
            content: "Our Resources section includes a wealth of information, including driving tips, traffic laws, and instructional materials. Students can access guides and videos to supplement their learning and gain a better understanding of road safety and driving techniques.",
            imgSrc: img1,
          }
        ].map((item, index) => (
          <div className="info-item" key={index}>
            <div className="info-text">
              <div className="h3-container">
                <h3>{item.title}</h3>
              </div>
              <div className="p-container">
                <p>{item.content}</p>
              </div>
            </div>
            <img src={item.imgSrc} alt={item.title} className="info-image" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Homepage;
